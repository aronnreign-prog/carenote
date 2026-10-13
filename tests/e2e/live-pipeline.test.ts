import { describe, test, expect, afterAll } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { randomUUID } from 'crypto'
import { extractClinicalFacts } from '@/lib/ai/extract'
import {
  indexClinicalRecordFacts,
  queryPatientMemory,
  purgePatientGraphMemory,
} from '@/lib/zep/ingest'

async function buildTwoPageClinicalEncounterPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Page 1: Outpatient Cardiology Encounter
  const page1 = pdfDoc.addPage([600, 800])
  page1.drawText('CARENOTE CLINICAL ENCOUNTER RECORD - PAGE 1', { x: 50, y: 740, size: 14, font })
  page1.drawText('Record Type: Cardiology Consultation Note', { x: 50, y: 710, size: 11, font })
  page1.drawText('Encounter Date: 2025-08-14', { x: 50, y: 690, size: 11, font })
  page1.drawText('Provider: Dr. Arvind Krishnan, MD (Cardiology)', { x: 50, y: 670, size: 11, font })
  page1.drawText('Reason for Visit: Hypertension and worsening renal function follow-up.', {
    x: 50,
    y: 645,
    size: 11,
    font,
  })
  page1.drawText('Diagnoses:', { x: 50, y: 615, size: 12, font })
  page1.drawText('- Essential Hypertension (active, onset 2021-03-10)', { x: 60, y: 595, size: 11, font })
  page1.drawText('Medications:', { x: 50, y: 565, size: 12, font })
  page1.drawText('- Lisinopril 10 mg oral daily: DISCONTINUED on 2025-08-14 due to hyperkalemia.', {
    x: 60,
    y: 545,
    size: 11,
    font,
  })
  page1.drawText('- Amlodipine 5 mg oral once daily: ACTIVE (started 2025-08-14).', {
    x: 60,
    y: 525,
    size: 11,
    font,
  })

  // Page 2: Laboratory Panel
  const page2 = pdfDoc.addPage([600, 800])
  page2.drawText('CARENOTE CLINICAL LABORATORY PANEL - PAGE 2', { x: 50, y: 740, size: 14, font })
  page2.drawText('Collection Date: 2025-08-14', { x: 50, y: 710, size: 11, font })
  page2.drawText('Lab Results:', { x: 50, y: 680, size: 12, font })
  page2.drawText('Serum Potassium: 5.7 mEq/L (Reference Range: 3.5-5.1 mEq/L) [H]', {
    x: 60,
    y: 655,
    size: 11,
    font,
  })
  page2.drawText('Serum Creatinine: 1.6 mg/dL (Reference Range: 0.7-1.2 mg/dL) [H]', {
    x: 60,
    y: 635,
    size: 11,
    font,
  })
  page2.drawText('Clinical Note: Repeat metabolic panel in 2 weeks.', {
    x: 50,
    y: 595,
    size: 11,
    font,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

describe('Live Deployment-Level Pipeline E2E (Gemini 2.5 Flash + Zep Cloud V3)', () => {
  const testWorkspaceId = randomUUID()
  const testPatientId = randomUUID()
  const testRecordId = randomUUID()

  afterAll(async () => {
    await purgePatientGraphMemory(testWorkspaceId, testPatientId)
  })

  test('extracts multi-page PDF via live Gemini 2.5 Flash, indexes into live Zep Cloud V3, and retrieves provenance-anchored memory', async () => {
    const pdfBuffer = await buildTwoPageClinicalEncounterPdf()
    expect(pdfBuffer.byteLength).toBeGreaterThan(500)

    // 1. Live Multimodal Extraction via Gemini 2.5 Flash
    const extraction = await extractClinicalFacts(pdfBuffer, 'Cardiology_Consult_2025_08_14.pdf')

    expect(extraction.recordDate).toBe('2025-08-14')
    expect(extraction.medications.length).toBeGreaterThanOrEqual(2)

    const lisinopril = extraction.medications.find((m) =>
      m.name.toLowerCase().includes('lisinopril')
    )
    expect(lisinopril).toBeDefined()
    expect(lisinopril?.status).toBe('discontinued')
    expect(lisinopril?.pageNumber).toBe(1)

    const potassium = extraction.lab_values.find((l) =>
      l.name.toLowerCase().includes('potassium')
    )
    expect(potassium).toBeDefined()
    expect(potassium?.value).toContain('5.7')
    expect(potassium?.flag).toBe('HIGH')
    expect(potassium?.pageNumber).toBe(2)

    // 2. Live Zep Cloud V3 Bi-Temporal Graph Indexing
    const ingestRes = await indexClinicalRecordFacts(
      testWorkspaceId,
      testPatientId,
      testRecordId,
      'Cardiology_Consult_2025_08_14.pdf',
      extraction
    )
    expect(ingestRes).toEqual({ success: true })

    // 3. Live 3-Layer Zep Memory Retrieval
    const memoryContext = await queryPatientMemory(
      testWorkspaceId,
      testPatientId,
      'Lisinopril discontinuation and Serum Potassium lab value'
    )

    expect(memoryContext).toContain('<CHRONOLOGICAL_EVIDENCE>')
    expect(memoryContext).toContain(`[record_id: ${testRecordId}]`)
    expect(memoryContext).toContain('[page: 1]')
    expect(memoryContext).toContain('[page: 2]')
    expect(memoryContext).toContain('Lisinopril')
    expect(memoryContext).toContain('5.7')
  })
})
