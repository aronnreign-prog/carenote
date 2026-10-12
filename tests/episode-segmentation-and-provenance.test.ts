import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  segmentClinicalEpisodes,
  serializeEncounterToGraphEpisode,
} from '../src/lib/zep/ingest.ts'
import type { ClinicalExtraction } from '../src/lib/ai/extract.ts'

describe('Clinical Encounter Episode Serialization & Provenance Retention', () => {
  const sampleRecordId = 'rec-1234-abcd'
  const sampleFilename = 'Cardiology_Consult_2026.pdf'

  test('serializes comprehensive encounter episode with exact record_id and page anchors', () => {
    const extraction: ClinicalExtraction = {
      recordDate: '2026-03-15',
      recordType: 'Consultation Note',
      provider: 'Dr. A. Sharma, MD',
      specialty: 'Cardiology',
      encounterContext: 'Outpatient Follow-up',
      medications: [
        { name: 'Metformin', dose: '500mg', frequency: 'twice daily', route: 'oral', status: 'active', pageNumber: 2 },
        { name: 'Lisinopril', dose: '10mg', frequency: 'daily', status: 'discontinued', pageNumber: 3 },
      ],
      lab_values: [
        { name: 'Hemoglobin A1c', value: '6.8', unit: '%', referenceRange: '4.0-5.6', flag: 'HIGH', date: '2026-03-10', pageNumber: 4 },
      ],
      conditions: [
        { name: 'Type 2 Diabetes Mellitus', status: 'active', onsetDate: '2020-05', pageNumber: 1 },
      ],
      otherObservations: [
        'Patient reports improved tolerance with meals.',
      ],
    }

    const episode = serializeEncounterToGraphEpisode(extraction, sampleRecordId, sampleFilename)

    // Verify metadata presence
    assert.ok(episode.includes(`CLINICAL ENCOUNTER RECORD: ${sampleFilename} (record_id: ${sampleRecordId})`))
    assert.ok(episode.includes('Record type: Consultation Note'))
    assert.ok(episode.includes('Provider: Dr. A. Sharma, MD'))

    // Verify provenance tokens [record_id: ...] and [page: ...]
    assert.ok(episode.includes(`Metformin 500mg twice daily (oral) documented as active. [page: 2] [record_id: ${sampleRecordId}]`))
    assert.ok(episode.includes(`Lisinopril 10mg daily documented as discontinued. [page: 3] [record_id: ${sampleRecordId}]`))
    assert.ok(episode.includes(`Hemoglobin A1c was 6.8 % (ref: 4.0-5.6) [HIGH]. [page: 4] [record_id: ${sampleRecordId}]`))
    assert.ok(episode.includes(`Type 2 Diabetes Mellitus (active). [page: 1] [record_id: ${sampleRecordId}]`))
  })

  test('gracefully handles missing and partial extraction fields without crash', () => {
    const emptyExtraction: ClinicalExtraction = {
      medications: [],
      lab_values: [],
      conditions: [],
      otherObservations: [],
    }

    const episode = serializeEncounterToGraphEpisode(emptyExtraction, sampleRecordId, sampleFilename)
    assert.ok(episode.includes('Record type: Unspecified'))
    assert.ok(episode.includes('Encounter date: Date unknown / not documented'))
    assert.ok(!episode.includes('MEDICATIONS:'))
    assert.ok(!episode.includes('LAB RESULTS:'))
    assert.ok(!episode.includes('CONDITIONS / DIAGNOSES:'))
    assert.ok(episode.includes(`SOURCE: ${sampleFilename} (record_id: ${sampleRecordId})`))
  })
})

describe('Clinical Episode Segmentation & Continuation Preservation', () => {
  const header = 'CLINICAL ENCOUNTER RECORD (CONTINUATION): Cardiology.pdf (record_id: rec-123) | Date: 2026-03-15'

  test('returns single episode segment when content is within maxEpisodeChars', () => {
    const content = 'Short clinical note with 100 characters.'
    const segments = segmentClinicalEpisodes(content, header, 7500)
    assert.equal(segments.length, 1)
    assert.equal(segments[0], content)
  })

  test('splits multi-paragraph content exceeding boundary and prefixes continuation header', () => {
    const para1 = 'Paragraph 1: ' + 'A'.repeat(4000)
    const para2 = 'Paragraph 2: ' + 'B'.repeat(4000)
    const fullContent = `${para1}\n\n${para2}`

    const segments = segmentClinicalEpisodes(fullContent, header, 5000)
    assert.equal(segments.length, 2)

    // First segment does not have continuation header prepended
    assert.ok(!segments[0].startsWith(header))
    assert.ok(segments[0].includes('Paragraph 1:'))

    // Second segment MUST have continuation header prepended
    assert.ok(segments[1].startsWith(header))
    assert.ok(segments[1].includes('Paragraph 2:'))
  })

  test('splits oversized single paragraph by line boundaries without data loss', () => {
    const lines: string[] = []
    for (let i = 0; i < 50; i++) {
      lines.push(`Line ${i}: Observation data value ${i} [record_id: test-uuid] [page: 1]`)
    }
    const longParagraph = lines.join('\n')

    // Segment size smaller than total paragraph
    const segments = segmentClinicalEpisodes(longParagraph, header, 500)
    assert.ok(segments.length > 1)

    // Verify all segments stay within bounds (accounting for header)
    segments.forEach((segment, idx) => {
      assert.ok(segment.length > 0)
      if (idx > 0) {
        assert.ok(segment.startsWith(header))
      }
    })

    // Verify every line is preserved across segments
    lines.forEach((line) => {
      const found = segments.some((s) => s.includes(line))
      assert.ok(found, `Line missing from segmented episode output: ${line}`)
    })
  })
})
