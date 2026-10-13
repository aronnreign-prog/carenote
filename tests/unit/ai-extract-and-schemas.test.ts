import { describe, test, expect, vi, beforeEach } from 'vitest'

const aiMocks = vi.hoisted(() => ({
  generateObject: vi.fn(),
  getClinicalModel: vi.fn(() => 'mock-gemini-model'),
}))

vi.mock('ai', () => ({
  generateObject: aiMocks.generateObject,
}))

vi.mock('@/lib/ai/model', () => ({
  getClinicalModel: aiMocks.getClinicalModel,
}))

import { extractClinicalFacts, ClinicalExtractionSchema } from '@/lib/ai/extract'
import { ClinicalSynthesisSchema, ClinicalQueryOutputSchema } from '@/lib/ai/schemas'
import { isValidUUID } from '@/lib/validators'

describe('AI Multimodal Extraction, Schemas & Validators', () => {
  beforeEach(() => {
    aiMocks.generateObject.mockReset()
  })

  describe('extractClinicalFacts (src/lib/ai/extract.ts)', () => {
    const samplePdfBuffer = Buffer.from('%PDF-1.4 sample bytes')

    test('invokes generateObject with PDF buffer and ClinicalExtractionSchema on first attempt', async () => {
      const mockExtracted = {
        recordDate: '2025-05-10',
        recordType: 'Lab Report',
        provider: 'Dr. K. Patel',
        medications: [],
        lab_values: [{ name: 'HbA1c', value: '6.4', unit: '%', flag: 'HIGH' as const, pageNumber: 1 }],
        conditions: [],
        otherObservations: [],
      }
      aiMocks.generateObject.mockResolvedValueOnce({ object: mockExtracted })

      const result = await extractClinicalFacts(samplePdfBuffer, 'labs_may2025.pdf')

      expect(result).toEqual(mockExtracted)
      expect(aiMocks.generateObject).toHaveBeenCalledTimes(1)
      expect(aiMocks.generateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-gemini-model',
          schema: ClinicalExtractionSchema,
          messages: [
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text', text: expect.stringContaining('labs_may2025.pdf') }),
                expect.objectContaining({ type: 'file', data: samplePdfBuffer, mediaType: 'application/pdf' }),
              ]),
            }),
          ],
        })
      )
    })

    test('retries once on transient extraction error and succeeds on second attempt', async () => {
      using warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.useFakeTimers()

      const mockExtracted = {
        medications: [{ name: 'Atorvastatin', dose: '40 mg', status: 'active' as const, pageNumber: 2 }],
        lab_values: [],
        conditions: [],
        otherObservations: [],
      }

      aiMocks.generateObject
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValueOnce({ object: mockExtracted })

      const promise = extractClinicalFacts(samplePdfBuffer, 'retry_record.pdf')
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(result).toEqual(mockExtracted)
      expect(aiMocks.generateObject).toHaveBeenCalledTimes(2)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })

    test('throws underlying error when both extraction attempts fail', async () => {
      using warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.useFakeTimers()

      aiMocks.generateObject
        .mockRejectedValueOnce(new Error('Attempt 1 timeout'))
        .mockRejectedValueOnce(new Error('Attempt 2 quota exceeded'))

      const promise = extractClinicalFacts(samplePdfBuffer, 'corrupt.pdf')
      const assertion = expect(promise).rejects.toThrow('Attempt 2 quota exceeded')
      await vi.advanceTimersByTimeAsync(1000)
      await assertion

      expect(aiMocks.generateObject).toHaveBeenCalledTimes(2)
      expect(warnSpy).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })
  })

  describe('ClinicalExtractionSchema, ClinicalSynthesisSchema & ClinicalQueryOutputSchema', () => {
    test('ClinicalExtractionSchema requires core entity arrays (preventing empty {} structured output) and validates enums', () => {
      const emptyObj = ClinicalExtractionSchema.safeParse({})
      expect(emptyObj.success).toBe(false)

      const validMinimal = ClinicalExtractionSchema.safeParse({
        medications: [],
        lab_values: [],
        conditions: [],
        otherObservations: [],
      })
      expect(validMinimal.success).toBe(true)

      const invalidLabFlag = ClinicalExtractionSchema.safeParse({
        medications: [],
        lab_values: [{ name: 'WBC', value: '12.0', flag: 'CRITICAL_PANIC' }],
        conditions: [],
        otherObservations: [],
      })
      expect(invalidLabFlag.success).toBe(false)
    })

    test('ClinicalSynthesisSchema validates PaperTrail claims and flagged_concerns', () => {
      const valid = ClinicalSynthesisSchema.safeParse({
        synthesis_text: 'Renal function declined over 12 months [claim:c1].',
        claims: [
          {
            claim_id: 'c1',
            claim_text: 'eGFR fell from 72 to 44 mL/min',
            claim_type: 'source_record',
            flag: 'SUPPORTED',
            evidence: [{ source_record_id: 'rec-1', source_page: 2, source_quote: 'eGFR 44' }],
          },
        ],
        flagged_concerns: [
          {
            concern: 'Unmonitored ACEi continuation during acute eGFR drop',
            severity: 'high',
            related_claims: ['c1'],
          },
        ],
      })
      expect(valid.success).toBe(true)
    })

    test('ClinicalQueryOutputSchema rejects unsupported flag values', () => {
      const invalid = ClinicalQueryOutputSchema.safeParse({
        answer: 'Test [claim:c1]',
        claims: [{ claim_id: 'c1', claim_text: 'Test', flag: 'INVENTED_FLAG' }],
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('isValidUUID (src/lib/validators.ts)', () => {
    test('accepts strict UUID v4 strings and rejects non-v4, malformed, or literal null/undefined strings', () => {
      expect(isValidUUID('11111111-1111-4111-8111-111111111111')).toBe(true)
      expect(isValidUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true)

      // Rejects UUID v1 (version nibble 1 instead of 4)
      expect(isValidUUID('11111111-1111-1111-8111-111111111111')).toBe(false)
      expect(isValidUUID('undefined')).toBe(false)
      expect(isValidUUID('null')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID("11111111-1111-4111-8111-111111111111' OR '1'='1")).toBe(false)
      expect(isValidUUID(null)).toBe(false)
      expect(isValidUUID(undefined)).toBe(false)
    })
  })
})
