import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { cleanup, render } from '@testing-library/react'
import type { ClinicalRecord, ClinicalSynthesis, Patient } from '@/types/database'

afterEach(() => {
  cleanup()
})

const { mockSubmitDemoRequest, mockAskPatientClinicalQuery } = vi.hoisted(() => ({
  mockSubmitDemoRequest: vi.fn(),
  mockAskPatientClinicalQuery: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/app/actions/demo', () => ({
  submitDemoRequest: mockSubmitDemoRequest,
}))

vi.mock('@/app/dashboard/patients/[id]/pipeline-actions', () => ({
  indexClinicalRecord: vi.fn(),
  synthesizePatientGraph: vi.fn(),
  createClinicalRecord: vi.fn(),
  createSynthesisRecord: vi.fn(),
  askPatientClinicalQuery: mockAskPatientClinicalQuery,
}))

vi.mock('@/app/dashboard/actions', () => ({
  initializePatientGraph: vi.fn(),
  purgePatientGraph: vi.fn(),
  pruneClinicalRecord: vi.fn(),
  deleteClinicalSynthesis: vi.fn(),
}))

import { DemoRequestModal, DemoRequestTrigger } from '@/components/marketing/DemoRequestModal'
import PatientDetailClient from '@/app/dashboard/patients/[id]/PatientDetailClient'

const samplePatient: Patient = {
  id: '00000000-0000-4000-8000-000000000010',
  workspace_id: '00000000-0000-4000-8000-000000000001',
  name: 'Arthur Pendelton',
  date_of_birth: '1952-11-04',
  biological_sex: 'male',
  created_at: '2026-01-10T00:00:00.000Z',
}

const sampleRecords: ClinicalRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    patient_id: samplePatient.id,
    workspace_id: samplePatient.workspace_id,
    filename: 'cardiology_discharge_2025.pdf',
    blob_url: 'https://test.public.blob.vercel-storage.com/cardiology_discharge_2025.pdf',
    record_type: 'Discharge Summary',
    record_date: '2025-11-15',
    status: 'extracted',
    error_message: null,
    uploaded_at: '2026-01-10T00:00:00.000Z',
  },
]

const sampleSyntheses: ClinicalSynthesis[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    patient_id: samplePatient.id,
    workspace_id: samplePatient.workspace_id,
    status: 'complete',
    synthesis_text:
      '### Longitudinal Trajectory\nLoop diuretic Furosemide 40mg daily was initiated on discharge [claim:c1]. Post-discharge potassium monitoring has not been documented [claim:c2].',
    claims: [
      {
        claim_id: 'c1',
        claim_text: 'Furosemide 40mg daily initiated at discharge',
        claim_type: 'medication',
        flag: 'SUPPORTED',
        evidence: [
          {
            source_record_id: '11111111-1111-4111-8111-111111111111',
            source_page: 2,
            source_quote: 'Start Furosemide 40mg PO daily',
          },
        ],
      },
      {
        claim_id: 'c2',
        claim_text: 'No follow-up BMP or potassium level documented post-discharge',
        claim_type: 'notable_absence',
        flag: 'SUPPORTED',
        evidence: [],
      },
    ],
    flagged_concerns: [
      {
        severity: 'high',
        description: 'Hypokalemia (K+ 3.1 mEq/L) during Furosemide therapy without potassium supplementation or repeat BMP.',
      },
    ],
    error_message: null,
    created_at: '2026-01-11T00:00:00.000Z',
  },
]

describe('CareNote Real Chromium Browser Component Suite (Vitest Browser Mode)', () => {
  it('opens DemoRequestModal in Chromium, fills clinical intake fields, and transitions to confirmation state', async () => {
    mockSubmitDemoRequest.mockResolvedValueOnce({ success: true })

    render(
      <div>
        <DemoRequestTrigger className="px-4 py-2">Request Clinical Demo</DemoRequestTrigger>
        <DemoRequestModal />
      </div>
    )

    const triggerBtn = page.getByRole('button', { name: 'Request Clinical Demo' })
    await expect.element(triggerBtn).toBeVisible()
    await userEvent.click(triggerBtn)

    const heading = page.getByRole('heading', { name: 'Request Demo Access' })
    await expect.element(heading).toBeVisible()

    await userEvent.fill(page.getByLabelText(/Full Name/i), 'Dr. Maya Lin')
    await userEvent.fill(page.getByLabelText(/Email Address/i), 'maya.lin@hospital.org')
    await userEvent.fill(page.getByLabelText(/Clinical Role/i), 'Nephrologist')
    await userEvent.fill(page.getByLabelText(/Institution \/ Practice/i), 'Pacific Renal Group')

    const submitBtn = page.getByRole('button', { name: 'Request Demo Access' })
    await userEvent.click(submitBtn)

    await expect.element(page.getByText('Demo Access Request Received')).toBeVisible()
    expect(mockSubmitDemoRequest).toHaveBeenCalledTimes(1)
    const submittedFormData = mockSubmitDemoRequest.mock.calls[0][0] as FormData
    expect(submittedFormData.get('name')).toBe('Dr. Maya Lin')
    expect(submittedFormData.get('email')).toBe('maya.lin@hospital.org')
    expect(submittedFormData.get('role')).toBe('Nephrologist')
    expect(submittedFormData.get('organization')).toBe('Pacific Renal Group')
  })

  it('renders PatientDetailClient in Chromium, verifies PaperTrail citation chips, and executes Temporal Memory Query', async () => {
    mockAskPatientClinicalQuery.mockResolvedValueOnce({
      answer: 'Potassium was 3.1 mEq/L on discharge while taking Furosemide 40mg daily [claim:q1].',
      claims: [
        {
          claim_id: 'q1',
          claim_text: 'Potassium 3.1 mEq/L on discharge',
          claim_type: 'lab_value',
          flag: 'SUPPORTED',
          evidence: [
            {
              source_record_id: '11111111-1111-4111-8111-111111111111',
              source_page: 2,
              source_quote: 'Potassium 3.1 mEq/L (Low)',
            },
          ],
        },
      ],
    })

    render(
      <PatientDetailClient
        patient={samplePatient}
        initialRecords={sampleRecords}
        initialSyntheses={sampleSyntheses}
      />
    )

    // Verify patient header & flagged concern banner render in real Chromium DOM
    await expect.element(page.getByRole('heading', { name: 'Arthur Pendelton', level: 1 })).toBeVisible()
    await expect.element(
      page.getByText(/Hypokalemia \(K\+ 3\.1 mEq\/L\) during Furosemide therapy/i)
    ).toBeVisible()

    // Verify PaperTrail citation chip and notable absence chip render
    const citationChip = page.getByRole('button', { name: /Discharge Summary · 15 Nov 25 · p\.2/i })
    await expect.element(citationChip).toBeVisible()
    await expect.element(page.getByText('∅ Not Documented')).toBeVisible()

    // Switch to Temporal Memory Query tab
    const queryTab = page.getByRole('button', { name: /Temporal Memory Query/i })
    await userEvent.click(queryTab)

    const queryInput = page.getByPlaceholder(/Ask a longitudinal question/i)
    await expect.element(queryInput).toBeVisible()

    await userEvent.fill(queryInput, 'What was the potassium level at discharge?')
    const askBtn = page.getByRole('button', { name: /Query Graph Memory/i })
    await userEvent.click(askBtn)

    // Verify query answer and its PaperTrail citation chip appear in Chromium
    await expect.element(
      page.getByText(/Potassium was 3\.1 mEq\/L on discharge while taking Furosemide 40mg daily/i)
    ).toBeVisible()
    expect(mockAskPatientClinicalQuery).toHaveBeenCalledWith(
      samplePatient.id,
      'What was the potassium level at discharge?',
      undefined
    )
  })
})
