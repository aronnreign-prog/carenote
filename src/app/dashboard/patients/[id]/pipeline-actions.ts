'use server'

import { db } from '@/lib/db'
import { clinicalRecords, clinicalSyntheses, patients } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { extractClinicalFacts } from '@/lib/ai/extract'
import { indexClinicalRecordFacts, queryPatientMemory } from '@/lib/zep/ingest'
import { getClinicalModel } from '@/lib/ai/model'
import { ClinicalSynthesisSchema, ClinicalQueryOutputSchema } from '@/lib/ai/schemas'
import { generateObject } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getWorkspace } from '@/lib/auth-session'
import { isValidUUID } from '@/lib/validators'
import { validatePaperTrailClaims } from '@/lib/ai/validate-papertrail'

function isValidVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.blob.vercel-storage.com') ||
        parsed.hostname === 'blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}

export async function createClinicalRecord(
  patientId: string,
  filename: string,
  blobUrl: string,
  fileSize: number,
  mimeType: string,
): Promise<{ id?: string; error?: string }> {
  if (!isValidUUID(patientId)) return { error: 'Invalid patient ID' }
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))
    .limit(1)
  if (!patient) return { error: 'Patient not found or unauthorized' }

  if (!isValidVercelBlobUrl(blobUrl)) {
    return { error: 'Invalid clinical record storage URL origin.' }
  }

  try {
    const [inserted] = await db.insert(clinicalRecords).values({
      patient_id: patientId,
      workspace_id: workspace.id,
      filename,
      blob_url: blobUrl,
      file_size: String(fileSize),
      mime_type: mimeType,
      status: 'uploaded',
    }).returning({ id: clinicalRecords.id })
    return { id: inserted.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'DB insert failed' }
  }
}

export async function indexClinicalRecord(recordId: string): Promise<{ error?: string }> {
  if (!isValidUUID(recordId)) return { error: 'Invalid clinical record ID' }
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [record] = await db
    .select()
    .from(clinicalRecords)
    .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))
    .limit(1)
  if (!record) return { error: 'Clinical record not found or unauthorized' }
  if (!record.blob_url) return { error: 'Clinical record has no storage URL' }

  if (!isValidVercelBlobUrl(record.blob_url)) {
    return { error: 'Untrusted clinical record storage URL.' }
  }

  await db
    .update(clinicalRecords)
    .set({ status: 'extracting' })
    .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))

  try {
    const response = await fetch(record.blob_url)
    if (!response.ok) throw new Error(`Failed to download clinical record blob: ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    const extraction = await extractClinicalFacts(pdfBuffer, record.filename)

    const indexResult = await indexClinicalRecordFacts(
      workspace.id,
      record.patient_id,
      record.id,
      record.filename,
      extraction,
    )
    if (!indexResult.success) console.error('[Pipeline] Zep graph indexing failed:', indexResult.error)

    await db.update(clinicalRecords).set({
      status: 'extracted',
      record_date: extraction.recordDate ?? null,
      record_type: extraction.recordType ?? null,
      processed_at: new Date(),
    }).where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))

    revalidatePath('/dashboard/patients/' + record.patient_id)
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Pipeline] Extraction failed:', message)
    await db.update(clinicalRecords).set({ status: 'failed', error_message: message }).where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))
    return { error: message }
  }
}

export type ClinicalQueryResult = {
  answer?: string
  claims?: z.infer<typeof ClinicalQueryOutputSchema>['claims']
  error?: string
}

function buildClinicalSynthesisQuery(): string {
  return 'comprehensive longitudinal clinical trajectory medications diagnoses lab results vitals and safety flags'
}

export async function createSynthesisRecord(
  patientId: string,
  sourceRecordIds: string[] = [],
): Promise<{ id?: string; error?: string }> {
  if (!isValidUUID(patientId)) return { error: 'Invalid patient ID' }
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))
    .limit(1)
  if (!patient) return { error: 'Patient not found or unauthorized' }

  try {
    const [inserted] = await db.insert(clinicalSyntheses).values({
      patient_id: patientId,
      workspace_id: workspace.id,
      status: 'queued',
      source_record_ids: sourceRecordIds,
    }).returning({ id: clinicalSyntheses.id })
    return { id: inserted.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to initialize clinical synthesis' }
  }
}

export async function synthesizePatientGraph(
  patientId: string,
  synthesisId: string,
): Promise<{ error?: string }> {
  if (!isValidUUID(patientId) || !isValidUUID(synthesisId)) {
    return { error: 'Invalid patient or clinical synthesis ID' }
  }
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))
    .limit(1)
  if (!patient) {
    return { error: 'Unauthorized or patient not found' }
  }

  const [synthesis] = await db
    .select()
    .from(clinicalSyntheses)
    .where(
      and(
        eq(clinicalSyntheses.id, synthesisId),
        eq(clinicalSyntheses.patient_id, patientId),
        eq(clinicalSyntheses.workspace_id, workspace.id)
      )
    )
    .limit(1)
  if (!synthesis) return { error: 'Clinical synthesis not found or unauthorized' }

  await db
    .update(clinicalSyntheses)
    .set({ status: 'processing' })
    .where(
      and(
        eq(clinicalSyntheses.id, synthesisId),
        eq(clinicalSyntheses.patient_id, patientId),
        eq(clinicalSyntheses.workspace_id, workspace.id)
      )
    )

  try {
    // 1. Query Zep with clinical intent query - the single source of truth for clinical memory
    const zepQuery = buildClinicalSynthesisQuery()
    const context = await queryPatientMemory(workspace.id, patientId, zepQuery)

    // 2. If memory is empty, fail with a clear message
    if (!context || context.trim().length === 0) {
      await db.update(clinicalSyntheses).set({
        status: 'failed',
        error_message: 'No clinical facts found in temporal graph memory. Please ensure clinical records are indexed.',
      }).where(
        and(
          eq(clinicalSyntheses.id, synthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )
      return { error: 'Clinical memory unavailable.' }
    }

    const patientHeader = `Patient: ${patient.name}, DOB: ${patient.date_of_birth}, Biological Sex: ${patient.biological_sex}`

    const model = getClinicalModel()

    // -- Diagnostics Context ------------------------------------------------
    console.log('=== [ZEP RETRIEVAL CONTEXT TO GEMINI] ===')
    console.log(patientHeader)
    console.log('--- context length: ' + context.length + ' chars ---')
    console.log('=== [END CONTEXT HEADER] ===')
    // -----------------------------------------------------------------------

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

    const { object } = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${patientHeader}\n\nExtracted clinical facts:\n\n${context}\n\nSynthesize a comprehensive longitudinal clinical synthesis with inline [claim:cN] citations.`,
      }],
      schema: ClinicalSynthesisSchema,
      abortSignal: AbortSignal.timeout(120000),
    })

    const paperTrailCheck = validatePaperTrailClaims(object.synthesis_text, object.claims, context)
    if (!paperTrailCheck.valid) {
      const errorMessage = `PaperTrail integrity check failed: ${paperTrailCheck.errors.join(' ')}`
      await db.update(clinicalSyntheses).set({
        status: 'failed',
        error_message: errorMessage,
      }).where(
        and(
          eq(clinicalSyntheses.id, synthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )
      return { error: errorMessage }
    }

    const cleanedSynthesisText = object.synthesis_text.replace(/^[0-9]+\s+/, '').trim()

    await db.update(clinicalSyntheses).set({
      status: 'complete',
      synthesis_text: cleanedSynthesisText,
      claims: object.claims,
      flagged_concerns: object.flagged_concerns,
      completed_at: new Date(),
    }).where(
      and(
        eq(clinicalSyntheses.id, synthesisId),
        eq(clinicalSyntheses.patient_id, patientId),
        eq(clinicalSyntheses.workspace_id, workspace.id)
      )
    )

    revalidatePath('/dashboard/patients/' + patientId)
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Synthesis] Generation failed:', message)
    await db.update(clinicalSyntheses).set({ status: 'failed', error_message: message }).where(
      and(
        eq(clinicalSyntheses.id, synthesisId),
        eq(clinicalSyntheses.patient_id, patientId),
        eq(clinicalSyntheses.workspace_id, workspace.id)
      )
    )
    return { error: message }
  }
}

export async function askPatientClinicalQuery(
  patientId: string,
  question: string,
  previousTurn?: { question: string; answer: string },
): Promise<ClinicalQueryResult> {
  if (!isValidUUID(patientId)) return { error: 'Invalid patient ID' }
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))
    .limit(1)
  if (!patient) return { error: 'Patient not found or unauthorized' }

  const trimmedQuestion = question.trim().slice(0, 1000)
  if (!trimmedQuestion) return { error: 'Please enter a clinical question.' }

  try {
    // 1. Query Zep graph memory: if a previous turn exists, combine prior question context for anaphoric resolution
    const retrievalQuery = previousTurn?.question
      ? `${previousTurn.question} ${trimmedQuestion}`
      : trimmedQuestion

    let context = await queryPatientMemory(workspace.id, patientId, retrievalQuery)

    // If Zep is empty, fallback to self-heal rebuild from indexed PDF records
    if (!context || context.trim().length === 0) {
      console.log('[Clinical Query] Zep memory empty: attempting rebuild from Blob PDFs...')
      const patientRecords = await db
        .select()
        .from(clinicalRecords)
        .where(and(eq(clinicalRecords.patient_id, patientId), eq(clinicalRecords.workspace_id, workspace.id), eq(clinicalRecords.status, 'extracted')))

      for (const record of patientRecords) {
        if (record.blob_url && isValidVercelBlobUrl(record.blob_url)) {
          try {
            const res = await fetch(record.blob_url)
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer())
              const extraction = await extractClinicalFacts(buffer, record.filename)
              await indexClinicalRecordFacts(workspace.id, patientId, record.id, record.filename, extraction)
            }
          } catch (rebuildErr) {
            console.warn('[Clinical Query Rebuild] Failed to re-index record:', record.filename, rebuildErr)
          }
        }
      }
      context = await queryPatientMemory(workspace.id, patientId, retrievalQuery)
    }

    if (!context || context.trim().length === 0) {
      return { error: 'No clinical facts available in temporal memory. Please index at least one medical record first.' }
    }

    const patientHeader = `Patient: ${patient.name}, DOB: ${patient.date_of_birth}, Biological Sex: ${patient.biological_sex}`
    const model = getClinicalModel()

    const SYSTEM_PROMPT = `You are CareNote's clinical intelligence engine answering a longitudinal inquiry about patient ${patient.name} based on their temporal memory graph and clinical records timeline.

Guidelines:
1. Provide a direct, factual, and chronological answer formatted cleanly in Markdown (with bullet points or bold text where appropriate).
2. If this is a follow-up question (e.g., "and what about now?", "why was that stopped?"), resolve pronouns and temporal references against the prior conversation turn, but strictly ground all facts in the patient's longitudinal records.
3. Ground every single claim strictly in the provided temporal facts and chronological episodes. Never hallucinate.
4. If an aspect of the question is not documented in the records across time, explicitly state that it is not documented in the available timeline.
5. For every specific fact, medication dose, date, lab value, or trajectory asserted, embed an inline token like [claim:c1], [claim:c2].
6. For each claim in the schema:
   - Mark flag: 'SUPPORTED', 'CONFLICTING', or 'MEDICAL_KNOWLEDGE'.
   - In the evidence array, extract source_record_id from [record_id: <uuid>] or [doc_id: <uuid>] and source_page from [page: <number>].
   - If citing multiple clinical records or chronological changes over time, include an evidence item for each supporting record across the timeline.`

    type MessageItem = { role: 'user' | 'assistant'; content: string }
    const messages: MessageItem[] = []

    if (previousTurn && previousTurn.question?.trim() && previousTurn.answer?.trim()) {
      messages.push({
        role: 'user',
        content: previousTurn.question.trim().slice(0, 1000),
      })
      messages.push({
        role: 'assistant',
        content: previousTurn.answer.trim().slice(0, 4000),
      })
    }

    messages.push({
      role: 'user',
      content: `${patientHeader}\n\nClinical Record & Graph Memory Context:\n\n${context}\n\nQuestion to answer: ${trimmedQuestion}`,
    })

    const { object } = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      messages,
      schema: ClinicalQueryOutputSchema,
      abortSignal: AbortSignal.timeout(45000),
    })

    const paperTrailCheck = validatePaperTrailClaims(object.answer, object.claims, context)
    if (!paperTrailCheck.valid) {
      return {
        error: `PaperTrail integrity check failed: ${paperTrailCheck.errors.join(' ')}`,
      }
    }

    return {
      answer: object.answer,
      claims: object.claims,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Clinical Query] Failed:', message)
    return { error: message }
  }
}