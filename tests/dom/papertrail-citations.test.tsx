import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ClinicalRecord } from '@/types/database'

vi.mock('@/app/dashboard/patients/[id]/pipeline-actions', () => ({
  createSynthesisRecord: vi.fn(),
  askPatientClinicalQuery: vi.fn(),
}))

vi.mock('@/app/dashboard/actions', () => ({
  deleteClinicalSynthesis: vi.fn(),
}))

import {
  formatShortDate,
  CitationChip,
  renderContentWithClaims,
} from '@/app/dashboard/patients/[id]/PatientDetailClient'
import { FlaggedBanner } from '@/components/clinical/flagged-banner'

describe('PaperTrail Citation Rendering & Clinical Safety UI (DOM)', () => {
  afterEach(() => {
    cleanup()
  })

  const mockRecords: ClinicalRecord[] = [
    {
      id: 'rec-discharge-1',
      patient_id: 'pat-1',
      workspace_id: 'ws-1',
      filename: 'discharge_2025.pdf',
      blob_url: 'https://store.blob.vercel-storage.com/discharge_2025.pdf',
      file_size: '1024',
      mime_type: 'application/pdf',
      status: 'extracted',
      uploaded_at: '2025-03-15T00:00:00Z',
      processed_at: '2025-03-15T00:01:00Z',
      record_date: '2025-03-14',
      record_type: 'Discharge Summary',
      error_message: null,
    },
  ]

  test('formatShortDate formats valid ISO dates and returns Undated for null/empty strings', () => {
    expect(formatShortDate(null)).toBe('Undated')
    expect(formatShortDate('   ')).toBe('Undated')
    expect(formatShortDate('null')).toBe('Undated')
    expect(formatShortDate('2025-03-14')).toMatch(/14 Mar 25/)
  })

  test('CitationChip renders interactive source button and triggers onRecordClick with exact recordId and page', () => {
    const onRecordClick = vi.fn()
    render(
      <CitationChip
        claim={{
          claim_id: 'c1',
          claim_text: 'Serum Potassium 5.8 mEq/L',
          claim_type: 'source_record',
          flag: 'SUPPORTED',
          evidence: [
            {
              source_record_id: 'rec-discharge-1',
              source_page: 2,
              source_quote: 'K+ 5.8 mEq/L [HIGH]',
            },
          ],
        }}
        records={mockRecords}
        onRecordClick={onRecordClick}
      />
    )

    const btn = screen.getByRole('button', { name: /Discharge Summary · 14 Mar 25 · p\.2/i })
    expect(btn).toBeDefined()
    expect(btn.getAttribute('title')).toBe('K+ 5.8 mEq/L [HIGH]')

    fireEvent.click(btn)
    expect(onRecordClick).toHaveBeenCalledTimes(1)
    expect(onRecordClick).toHaveBeenCalledWith(expect.anything(), 'rec-discharge-1', 2)
  })

  test('CitationChip renders Conflicting, Not Documented, Medical Knowledge, and Unverified states accurately', () => {
    const noop = vi.fn()
    const { rerender } = render(
      <CitationChip
        claim={{ claim_text: 'Conflicting penicillin allergy status', flag: 'CONFLICTING' }}
        onRecordClick={noop}
      />
    )
    expect(screen.getByText('⚡ Conflicting')).toBeDefined()

    rerender(
      <CitationChip
        claim={{ claim_text: 'Missing baseline echocardiogram', claim_type: 'notable_absence' }}
        onRecordClick={noop}
      />
    )
    expect(screen.getByText('∅ Not Documented')).toBeDefined()

    rerender(
      <CitationChip
        claim={{ claim_text: 'ACEi contraindicated in hyperkalemia', flag: 'MEDICAL_KNOWLEDGE' }}
        onRecordClick={noop}
      />
    )
    expect(screen.getByText('⚠ Medical Knowledge')).toBeDefined()

    // Pruned or nonexistent record ID falls back to ? Unverified instead of a dead button
    rerender(
      <CitationChip
        claim={{
          claim_text: 'Pruned record citation',
          flag: 'SUPPORTED',
          evidence: [{ source_record_id: 'deleted-record-id', source_page: 1 }],
        }}
        records={mockRecords}
        onRecordClick={noop}
      />
    )
    expect(screen.getByText('? Unverified')).toBeDefined()
  })

  test('renderContentWithClaims parses adjacent tokens and renders ? Unverified when a claim ID is missing from claimsMap', () => {
    const onRecordClick = vi.fn()
    const claimsMap = {
      c1: {
        claim_id: 'c1',
        claim_text: 'Lisinopril stopped',
        claim_type: 'source_record',
        flag: 'SUPPORTED',
        evidence: [{ source_record_id: 'rec-discharge-1', source_page: 1 }],
      },
      c2: {
        claim_id: 'c2',
        claim_text: 'No repeat potassium check',
        claim_type: 'notable_absence',
      },
    }

    const node = (
      <p>
        Regimen updated [claim:c1][claim:c2] and unmapped assertion [claim:c999].
      </p>
    )

    render(<div>{renderContentWithClaims(node, claimsMap, onRecordClick, mockRecords)}</div>)

    expect(screen.getByRole('button', { name: /Discharge Summary · 14 Mar 25/i })).toBeDefined()
    expect(screen.getByText('∅ Not Documented')).toBeDefined()
    expect(screen.getByText('? Unverified')).toBeDefined()
  })

  test('FlaggedBanner renders severity badges and returns null when concerns list is empty', () => {
    const { container, rerender } = render(<FlaggedBanner concerns={[]} />)
    expect(container.firstChild).toBeNull()

    rerender(
      <FlaggedBanner
        concerns={[
          { severity: 'high', concern: 'Hyperkalemia on ACE inhibitor' },
          { severity: 'medium', concern: 'Unclosed nephrology follow-up hold' },
        ]}
      />
    )

    expect(screen.getByText('FLAGGED SAFETY CONCERNS')).toBeDefined()
    expect(screen.getByText('HIGH')).toBeDefined()
    expect(screen.getByText('Hyperkalemia on ACE inhibitor')).toBeDefined()
    expect(screen.getByText('MEDIUM')).toBeDefined()
  })
})
