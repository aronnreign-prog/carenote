import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ClinicalSynthesisSchema, ClinicalQueryOutputSchema } from '../src/lib/ai/schemas.js'

describe('AI Output Schemas & Validation Contracts', () => {
  describe('ClinicalSynthesisSchema', () => {
    test('successfully validates complete, rich longitudinal synthesis payload', () => {
      const validSynthesis = {
        synthesis_text: 'Patient presented with elevated HbA1c [claim:c1]. Metformin was initiated [claim:c2].',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'HbA1c was elevated at 7.2%',
            claim_type: 'source_record',
            flag: 'SUPPORTED',
            evidence: [
              {
                source_record_id: 'rec-uuid-1',
                source_page: 2,
                source_quote: 'HbA1c: 7.2%',
                entry_text: 'Routine outpatient lab panel',
              },
            ],
          },
          {
            claim_id: 'c2',
            claim_text: 'Metformin 500mg BID started',
            claim_type: 'source_record',
            flag: 'SUPPORTED',
            evidence: [
              {
                source_record_id: 'rec-uuid-2',
                source_page: 1,
                source_quote: 'Rx: Metformin 500mg PO BID',
              },
            ],
          },
        ],
        flagged_concerns: [
          {
            concern: 'Elevated glycemic control',
            severity: 'medium',
            related_claims: ['c1'],
          },
        ],
      }

      const parsed = ClinicalSynthesisSchema.safeParse(validSynthesis)
      assert.equal(parsed.success, true)
    })

    test('validates valid synthesis with all allowed claim types and flags', () => {
      const allVariations = {
        synthesis_text: 'Multiple claims [claim:c1][claim:c2][claim:c3][claim:c4].',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'Source fact',
            claim_type: 'source_record',
            flag: 'SUPPORTED',
          },
          {
            claim_id: 'c2',
            claim_text: 'Conflicting finding across visits',
            claim_type: 'source_record',
            flag: 'CONFLICTING',
          },
          {
            claim_id: 'c3',
            claim_text: 'Standard contraindication rule',
            claim_type: 'medical_knowledge',
            flag: 'MEDICAL_KNOWLEDGE',
          },
          {
            claim_id: 'c4',
            claim_text: 'Baseline renal function test was not found',
            claim_type: 'notable_absence',
            flag: 'UNVERIFIED',
          },
        ],
        flagged_concerns: [],
      }

      const parsed = ClinicalSynthesisSchema.safeParse(allVariations)
      assert.equal(parsed.success, true)
    })

    test('rejects synthesis when synthesis_text is missing', () => {
      const invalid = {
        claims: [],
        flagged_concerns: [],
      }
      const parsed = ClinicalSynthesisSchema.safeParse(invalid)
      assert.equal(parsed.success, false)
    })

    test('rejects synthesis when claim_type is invalid enum', () => {
      const invalid = {
        synthesis_text: 'Text [claim:c1]',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'Invalid type claim',
            claim_type: 'custom_type_not_allowed',
          },
        ],
        flagged_concerns: [],
      }
      const parsed = ClinicalSynthesisSchema.safeParse(invalid)
      assert.equal(parsed.success, false)
    })

    test('rejects synthesis when flagged_concern severity is invalid', () => {
      const invalid = {
        synthesis_text: 'Text',
        claims: [],
        flagged_concerns: [
          {
            concern: 'Unknown danger',
            severity: 'critical_emergency', // not in ['high', 'medium', 'low']
            related_claims: [],
          },
        ],
      }
      const parsed = ClinicalSynthesisSchema.safeParse(invalid)
      assert.equal(parsed.success, false)
    })
  })

  describe('ClinicalQueryOutputSchema', () => {
    test('successfully validates direct clinical answer with evidence', () => {
      const validQuery = {
        answer: 'The patient is currently on Lisinopril 10mg daily [claim:c1].',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'Lisinopril 10mg prescribed for hypertension',
            flag: 'SUPPORTED',
            evidence: [
              {
                source_record_id: 'rec-uuid-99',
                source_page: 1,
                source_quote: 'Lisinopril 10mg once daily',
                entry_text: 'Medication list verified by physician',
              },
            ],
          },
        ],
      }

      const parsed = ClinicalQueryOutputSchema.safeParse(validQuery)
      assert.equal(parsed.success, true)
    })

    test('rejects clinical query when flag is missing or invalid enum', () => {
      const invalid = {
        answer: 'Some answer',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'Claim without valid flag',
            flag: 'TRUE_FACT', // invalid enum
          },
        ],
      }
      const parsed = ClinicalQueryOutputSchema.safeParse(invalid)
      assert.equal(parsed.success, false)
    })
  })
})
