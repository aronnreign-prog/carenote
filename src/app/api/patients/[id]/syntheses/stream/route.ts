import { streamObject } from 'ai'
import { getClinicalModel } from '@/lib/ai/model'
import { ClinicalSynthesisSchema } from '@/lib/ai/schemas'
import { queryPatientMemory } from '@/lib/zep/ingest'
import { db } from '@/lib/db'
import { clinicalSyntheses, patients } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getWorkspace } from '@/lib/auth-session'
import { isValidUUID } from '@/lib/validators'
import { validatePaperTrailClaims } from '@/lib/ai/validate-papertrail'
import { NextResponse } from 'next/server'

export const maxDuration = 300

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: patientId } = await params
    if (!isValidUUID(patientId)) return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 })
    const workspace = await getWorkspace()
    if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const targetSynthesisId = body.synthesisId
    if (!isValidUUID(targetSynthesisId)) return NextResponse.json({ error: 'Invalid or missing synthesisId' }, { status: 400 })

    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))
      .limit(1)

    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const [synthesis] = await db
      .select()
      .from(clinicalSyntheses)
      .where(
        and(
          eq(clinicalSyntheses.id, targetSynthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )
      .limit(1)

    if (!synthesis) {
      return NextResponse.json({ error: 'Clinical synthesis not found or unauthorized' }, { status: 404 })
    }

    await db
      .update(clinicalSyntheses)
      .set({ status: 'processing' })
      .where(
        and(
          eq(clinicalSyntheses.id, targetSynthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )

    const zepQuery = 'comprehensive longitudinal clinical trajectory medications diagnoses lab results vitals and safety flags'
    const context = await queryPatientMemory(workspace.id, patientId, zepQuery)

    if (!context || context.trim().length === 0) {
      await db
        .update(clinicalSyntheses)
        .set({
          status: 'failed',
          error_message: 'No clinical facts found in graph memory. Please ensure clinical records are extracted.',
        })
        .where(
          and(
            eq(clinicalSyntheses.id, targetSynthesisId),
            eq(clinicalSyntheses.patient_id, patientId),
            eq(clinicalSyntheses.workspace_id, workspace.id)
          )
        )

      return NextResponse.json({ error: 'Clinical memory unavailable.' }, { status: 400 })
    }

    const patientHeader = `Patient: ${patient.name}, DOB: ${patient.date_of_birth}, Biological Sex: ${patient.biological_sex}`
    const model = getClinicalModel()

    const SYSTEM_PROMPT = `You are CareNote's clinical intelligence engine synthesizing an evolving longitudinal patient graph across time.
Your purpose is to construct a rigorous Longitudinal Clinical Synthesis from the patient's temporal memory graph.
Medical history is an evolving graph over time, not disconnected text chunks. Trace how diagnoses evolved, dose adjustments occurred, lab trajectories shifted across providers, and whether past therapies were superseded or invalidated.
Write for a medical specialist: emphasize longitudinal trajectories, exact medication dosages, cross-doctor conflicts, clinical reasoning, and notable clinical absences.

Use ONLY the clinical facts provided in the context. Do not hallucinate or invent clinical findings.
For each claim, mark it:
- SUPPORTED: directly confirmed by records in the temporal graph
- CONFLICTING: contradictory findings or superseded/invalidated diagnoses/allergies across records over time
- MEDICAL_KNOWLEDGE: based on standard pharmacology/clinical principles
- NOTABLE_ABSENCE (claim_type): an expected clinical test, monitoring baseline, or history is conspicuously missing from the timeline
- UNVERIFIED: uncertain or unconfirmed

Clinical Narrative Structure:
1. Patient Demographics & Baseline Overview: Patient identity, DOB/age, and core longitudinal baseline.
2. Longitudinal Clinical Trajectory: Synthesize the clinical history in chronological epochs (e.g., Initial Presentation & Diagnosis, Longitudinal Trajectory across years, Recent Status). Write rich narrative prose connecting events across time rather than isolated bullet points.
3. Active Pharmacotherapy & Multi-System Baselines: Detail current active medications with exact dosages and active conditions. Note when prior medications were modified, discontinued, or superseded.
4. Flagged Safety Concerns & Discrepancies: Highlight acute contraindications, significant dosage fluctuations across time, conflicting notes between providers, abrupt discontinuations, or missing monitoring baselines.

PaperTrail Citation Requirement:
- Embed inline claim markers like [claim:c1], [claim:c2] immediately after each factual assertion, lab value, medication dose, or concern.
- Write individual claim tokens (e.g., [claim:c1][claim:c2]). Do NOT bundle multiple claim IDs inside a single comma-separated bracket.
- In each claim's evidence array, cite EVERY source clinical record and page that supports the claim (extract source_record_id from [record_id: <uuid>] or [doc_id: <uuid>] and source_page from [page: <number>] found inside <CHRONOLOGICAL_EVIDENCE>). For longitudinal trends spanning multiple dates/visits, include an evidence entry for each supporting record across time.`

    const result = streamObject({
      model,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${patientHeader}\n\nExtracted clinical facts:\n\n${context}\n\nGenerate a comprehensive Longitudinal Clinical Synthesis with inline [claim:cN] citations.`,
        },
      ],
      schema: ClinicalSynthesisSchema,
      abortSignal: req.signal,
    })

    // Do not send generated text to the browser before its PaperTrail structure
    // has been checked. This endpoint intentionally buffers the final object,
    // validates it, persists it, and only then returns the synthesis text.
    let object: Awaited<typeof result.object>
    try {
      object = await result.object
    } catch (generationError) {
      const technicalError = generationError instanceof Error ? generationError.message : String(generationError)
      console.error('[Synthesis Stream Generation Error - Developer Log]:', technicalError)
      await db
        .update(clinicalSyntheses)
        .set({
          status: 'failed',
          error_message: 'Unable to complete longitudinal clinical synthesis. Please retry in a moment.',
        })
        .where(
          and(
            eq(clinicalSyntheses.id, targetSynthesisId),
            eq(clinicalSyntheses.patient_id, patientId),
            eq(clinicalSyntheses.workspace_id, workspace.id)
          )
        )
      return NextResponse.json(
        { error: 'Unable to complete longitudinal clinical synthesis. Please retry in a moment.' },
        { status: 500 }
      )
    }
    const paperTrailCheck = validatePaperTrailClaims(object.synthesis_text, object.claims, context)
    if (!paperTrailCheck.valid) {
      const error = `PaperTrail integrity check failed: ${paperTrailCheck.errors.join(' ')}`
      await db
        .update(clinicalSyntheses)
        .set({ status: 'failed', error_message: error })
        .where(
          and(
            eq(clinicalSyntheses.id, targetSynthesisId),
            eq(clinicalSyntheses.patient_id, patientId),
            eq(clinicalSyntheses.workspace_id, workspace.id)
          )
        )
      return NextResponse.json({ error: 'Synthesis failed PaperTrail integrity checks.' }, { status: 422 })
    }

    const cleanedSynthesisText = object.synthesis_text.replace(/^[0-9]+\s+/, '').trim()
    await db
      .update(clinicalSyntheses)
      .set({
        status: 'complete',
        synthesis_text: cleanedSynthesisText,
        claims: object.claims,
        flagged_concerns: object.flagged_concerns,
        completed_at: new Date(),
      })
      .where(
        and(
          eq(clinicalSyntheses.id, targetSynthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )

    return Response.json({
      synthesis_text: cleanedSynthesisText,
      claims: object.claims,
      flagged_concerns: object.flagged_concerns,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Synthesis Stream API Error]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
