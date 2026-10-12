import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

interface Claim {
  claim_id: string
  claim_text: string
  claim_type?: string
  flag?: string
  evidence?: Array<{
    source_record_id?: string
    source_page?: number
    source_quote?: string
    entry_text?: string
  }>
}

interface ClinicalRecordItem {
  id: string
  record_type?: string | null
  record_date?: string | null
}

interface ParsedToken {
  type: 'text' | 'claim'
  content: string
  claimId?: string
  resolvedClaim?: Claim
  resolvedRecord?: ClinicalRecordItem
  chipType?: 'clinical_record' | 'conflicting' | 'absence' | 'medical_knowledge' | 'unverified'
}

// Pure tokenization logic matching PatientDetailClient.tsx renderContentWithClaims
function tokenizeAndResolveClaims(
  text: string,
  claimsMap: Record<string, Claim>,
  records: ClinicalRecordItem[] = []
): ParsedToken[] {
  const parts = text.split(/(\[claim:[^\]]+\])/g)
  const results: ParsedToken[] = []

  for (const part of parts) {
    if (!part) continue
    const match = part.match(/^\[claim:([^\]]+)\]$/)
    if (match) {
      const rawContent = match[1]
      const idMatches = rawContent.match(/[a-zA-Z0-9_-]+/g) ?? []

      for (const rawId of idMatches) {
        const claimId = rawId.replace(/^claim:/, '')
        const claim = claimsMap[claimId]

        if (!claim) {
          results.push({
            type: 'claim',
            content: rawId,
            claimId,
            chipType: 'unverified',
          })
          continue
        }

        let chipType: ParsedToken['chipType'] = 'clinical_record'
        if (claim.flag === 'CONFLICTING') {
          chipType = 'conflicting'
        } else if (claim.claim_type === 'notable_absence') {
          chipType = 'absence'
        } else if (claim.flag === 'MEDICAL_KNOWLEDGE' || claim.claim_type === 'medical_knowledge') {
          chipType = 'medical_knowledge'
        } else {
          const evidenceList = claim.evidence || []
          if (evidenceList.length === 0) {
            chipType = 'unverified'
          } else {
            const firstEv = evidenceList[0]
            const rec = firstEv.source_record_id ? records.find((r) => r.id === firstEv.source_record_id) : undefined
            if (!rec) {
              chipType = 'unverified'
            } else {
              chipType = 'clinical_record'
            }
          }
        }

        const evidenceRecord = claim.evidence?.[0]?.source_record_id
          ? records.find((r) => r.id === claim.evidence![0].source_record_id)
          : undefined

        results.push({
          type: 'claim',
          content: part,
          claimId,
          resolvedClaim: claim,
          resolvedRecord: evidenceRecord,
          chipType,
        })
      }
    } else {
      results.push({
        type: 'text',
        content: part,
      })
    }
  }

  return results
}

describe('Citation Tokenization & Claim Resolution (PatientDetailClient)', () => {
  const mockRecords: ClinicalRecordItem[] = [
    { id: 'rec-1', record_type: 'Discharge Summary', record_date: '2026-01-10' },
    { id: 'rec-2', record_type: 'Lab Report', record_date: '2026-02-14' },
  ]

  const mockClaims: Record<string, Claim> = {
    c1: {
      claim_id: 'c1',
      claim_text: 'Admitted for acute heart failure exacerbation',
      claim_type: 'source_record',
      flag: 'SUPPORTED',
      evidence: [{ source_record_id: 'rec-1', source_page: 1 }],
    },
    c2: {
      claim_id: 'c2',
      claim_text: 'Conflicting allergy notes: penicillin noted as tolerated then allergic',
      claim_type: 'source_record',
      flag: 'CONFLICTING',
      evidence: [{ source_record_id: 'rec-1', source_page: 3 }],
    },
    c3: {
      claim_id: 'c3',
      claim_text: 'Standard dosing guidance for ACE inhibitors',
      claim_type: 'medical_knowledge',
      flag: 'MEDICAL_KNOWLEDGE',
    },
    c4: {
      claim_id: 'c4',
      claim_text: 'No baseline echocardiogram found in file',
      claim_type: 'notable_absence',
    },
    c5: {
      claim_id: 'c5',
      claim_text: 'Claim citing pruned clinical record',
      claim_type: 'source_record',
      flag: 'SUPPORTED',
      evidence: [{ source_record_id: 'pruned-rec-uuid', source_page: 1 }],
    },
  }

  test('correctly parses plain text without claim tokens', () => {
    const text = 'Normal clinical text without any special annotations.'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].type, 'text')
    assert.equal(tokens[0].content, text)
  })

  test('resolves single clinical-record-backed claim badge', () => {
    const text = 'Patient was admitted [claim:c1] for monitoring.'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    assert.equal(tokens.length, 3)
    assert.equal(tokens[0].type, 'text')
    assert.equal(tokens[1].type, 'claim')
    assert.equal(tokens[1].claimId, 'c1')
    assert.equal(tokens[1].chipType, 'clinical_record')
    assert.equal(tokens[1].resolvedRecord?.id, 'rec-1')
    assert.equal(tokens[2].type, 'text')
  })

  test('resolves multiple adjacent claim tokens [claim:c1][claim:c2]', () => {
    const text = 'Critical clinical trajectory assertion [claim:c1][claim:c2].'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    const claims = tokens.filter((t) => t.type === 'claim')
    assert.equal(claims.length, 2)
    assert.equal(claims[0].claimId, 'c1')
    assert.equal(claims[0].chipType, 'clinical_record')
    assert.equal(claims[1].claimId, 'c2')
    assert.equal(claims[1].chipType, 'conflicting')
  })

  test('handles medical knowledge and notable absence special badges', () => {
    const text = 'Guidance rule [claim:c3] and missing test [claim:c4].'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    const claims = tokens.filter((t) => t.type === 'claim')
    assert.equal(claims.length, 2)
    assert.equal(claims[0].claimId, 'c3')
    assert.equal(claims[0].chipType, 'medical_knowledge')
    assert.equal(claims[1].claimId, 'c4')
    assert.equal(claims[1].chipType, 'absence')
  })

  test('gracefully falls back to unverified chip when clinical record is pruned or missing from timeline', () => {
    const text = 'Fact from pruned record [claim:c5].'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    const claimToken = tokens.find((t) => t.type === 'claim')
    assert.ok(claimToken)
    assert.equal(claimToken?.chipType, 'unverified')
    assert.equal(claimToken?.resolvedRecord, undefined)
  })

  test('gracefully handles nonexistent claim ID without throwing unhandled exception', () => {
    const text = 'Phantom citation [claim:c999] in text.'
    const tokens = tokenizeAndResolveClaims(text, mockClaims, mockRecords)
    const claimToken = tokens.find((t) => t.type === 'claim')
    assert.ok(claimToken)
    assert.equal(claimToken?.claimId, 'c999')
    assert.equal(claimToken?.chipType, 'unverified')
    assert.equal(claimToken?.resolvedClaim, undefined)
  })
})
