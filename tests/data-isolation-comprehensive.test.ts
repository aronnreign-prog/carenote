import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

interface MockSynthesis {
  id: string
  workspace_id: string
  patient_id: string
  synthesis_text: string
  status: 'queued' | 'generating' | 'complete' | 'failed'
}

interface MockClinicalRecord {
  id: string
  workspace_id: string
  patient_id: string
  blob_url: string
  status: 'uploaded' | 'extracted' | 'failed'
}

// Simulated query engine enforcing the 3-key invariant
class IsolationStore {
  syntheses: MockSynthesis[] = []
  records: MockClinicalRecord[] = []

  // Invariant: updates must match id, patient_id, AND workspace_id simultaneously
  updateSynthesis(
    synthesisId: string,
    patientId: string,
    workspaceId: string,
    patch: Partial<MockSynthesis>
  ): { success: boolean; updatedCount: number } {
    const targets = this.syntheses.filter(
      (s) => s.id === synthesisId && s.patient_id === patientId && s.workspace_id === workspaceId
    )

    if (targets.length === 0) {
      return { success: false, updatedCount: 0 }
    }

    for (const s of targets) {
      Object.assign(s, patch)
    }
    return { success: true, updatedCount: targets.length }
  }

  // Invariant: clinical record pruning must match id, patient_id, AND workspace_id
  pruneRecord(
    recordId: string,
    patientId: string,
    workspaceId: string
  ): { success: boolean; deletedCount: number } {
    const initialLen = this.records.length
    this.records = this.records.filter(
      (r) => !(r.id === recordId && r.patient_id === patientId && r.workspace_id === workspaceId)
    )
    const deletedCount = initialLen - this.records.length
    return { success: deletedCount > 0, deletedCount }
  }
}

describe('Comprehensive Multi-Tenant & Intra-Tenant Isolation Invariants', () => {
  const workspaceA = 'ws-alice'
  const workspaceB = 'ws-bob'

  const patientA1 = 'pat-alice-1'
  const patientA2 = 'pat-alice-2'
  const patientB1 = 'pat-bob-1'

  let store: IsolationStore

  // Setup fixtures before tests
  const setupStore = () => {
    store = new IsolationStore()
    store.syntheses.push({
      id: 'syn-1',
      workspace_id: workspaceA,
      patient_id: patientA1,
      synthesis_text: 'Alice Patient 1 synthesis text',
      status: 'queued',
    })
    store.syntheses.push({
      id: 'syn-2',
      workspace_id: workspaceA,
      patient_id: patientA2,
      synthesis_text: 'Alice Patient 2 synthesis text',
      status: 'queued',
    })
    store.syntheses.push({
      id: 'syn-3',
      workspace_id: workspaceB,
      patient_id: patientB1,
      synthesis_text: 'Bob Patient 1 synthesis text',
      status: 'queued',
    })

    store.records.push({
      id: 'rec-1',
      workspace_id: workspaceA,
      patient_id: patientA1,
      blob_url: 'https://blob.vercel-storage.com/rec1.pdf',
      status: 'extracted',
    })
    store.records.push({
      id: 'rec-2',
      workspace_id: workspaceB,
      patient_id: patientB1,
      blob_url: 'https://blob.vercel-storage.com/rec2.pdf',
      status: 'extracted',
    })
  }

  test('permits authorized synthesis update matching all 3 dimensions', () => {
    setupStore()
    const res = store.updateSynthesis('syn-1', patientA1, workspaceA, {
      status: 'complete',
      synthesis_text: 'Updated longitudinal clinical synthesis',
    })
    assert.equal(res.success, true)
    assert.equal(res.updatedCount, 1)

    const updated = store.syntheses.find((s) => s.id === 'syn-1')
    assert.equal(updated?.status, 'complete')
    assert.equal(updated?.synthesis_text, 'Updated longitudinal clinical synthesis')
  })

  test('blocks cross-tenant update (Workspace B targeting Workspace A synthesis)', () => {
    setupStore()
    const res = store.updateSynthesis('syn-1', patientA1, workspaceB, {
      status: 'failed',
    })
    assert.equal(res.success, false)
    assert.equal(res.updatedCount, 0)
    assert.equal(store.syntheses.find((s) => s.id === 'syn-1')?.status, 'queued')
  })

  test('blocks intra-tenant cross-patient overwrite (Workspace A targeting Patient 2 synthesis under Patient 1 context)', () => {
    setupStore()
    // Workspace A owns both patients, but supplies patientA1 in the URL/action while passing syn-2 (which belongs to patientA2)
    const res = store.updateSynthesis('syn-2', patientA1, workspaceA, {
      status: 'complete',
      synthesis_text: 'Malicious intra-tenant overwrite',
    })
    assert.equal(res.success, false)
    assert.equal(res.updatedCount, 0)
    assert.equal(store.syntheses.find((s) => s.id === 'syn-2')?.status, 'queued')
    assert.equal(store.syntheses.find((s) => s.id === 'syn-2')?.synthesis_text, 'Alice Patient 2 synthesis text')
  })

  test('blocks cross-tenant clinical record pruning', () => {
    setupStore()
    const res = store.pruneRecord('rec-1', patientA1, workspaceB)
    assert.equal(res.success, false)
    assert.equal(res.deletedCount, 0)
    assert.equal(store.records.some((r) => r.id === 'rec-1'), true)
  })

  test('blocks intra-tenant clinical record pruning with mismatched patient ID', () => {
    setupStore()
    const res = store.pruneRecord('rec-1', patientA2, workspaceA)
    assert.equal(res.success, false)
    assert.equal(res.deletedCount, 0)
    assert.equal(store.records.some((r) => r.id === 'rec-1'), true)
  })

  test('handles adversarial ID inputs (SQL injection substrings, empty strings) safely', () => {
    setupStore()
    const maliciousInputs = [
      "syn-1' OR '1'='1",
      'syn-1; DROP TABLE clinical_syntheses;',
      '',
      '   ',
      '../etc/passwd',
      'null',
      'undefined',
    ]

    for (const badId of maliciousInputs) {
      const res = store.updateSynthesis(badId, patientA1, workspaceA, { status: 'failed' })
      assert.equal(res.success, false)
      assert.equal(res.updatedCount, 0)
    }
  })
})
