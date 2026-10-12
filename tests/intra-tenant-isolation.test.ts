import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

interface SynthesisRecord {
  id: string
  patient_id: string
  workspace_id: string
  status: string
  synthesis_text: string | null
}

function authorizeSynthesisOperation(
  synthesis: SynthesisRecord | null,
  workspaceId: string,
  patientId: string,
  synthesisId: string
): { authorized: boolean; reason?: string } {
  if (!synthesis) {
    return { authorized: false, reason: 'Synthesis not found' }
  }

  // Cross-tenant check (Workspace boundary)
  if (synthesis.workspace_id !== workspaceId) {
    return { authorized: false, reason: 'Cross-tenant access forbidden' }
  }

  // Intra-tenant check (Patient boundary within workspace)
  if (synthesis.patient_id !== patientId) {
    return { authorized: false, reason: 'Intra-tenant cross-patient access forbidden' }
  }

  if (synthesis.id !== synthesisId) {
    return { authorized: false, reason: 'Synthesis ID mismatch' }
  }

  return { authorized: true }
}

describe('Intra-Tenant Multi-Patient Isolation', () => {
  const workspace1 = 'workspace-111'
  const workspace2 = 'workspace-222'

  const patientA = 'patient-aaa'
  const patientB = 'patient-bbb'

  const synthesisA: SynthesisRecord = {
    id: 'synthesis-001',
    patient_id: patientA,
    workspace_id: workspace1,
    status: 'queued',
    synthesis_text: null,
  }

  test('allows authorized operation on matching workspace and patient', () => {
    const res = authorizeSynthesisOperation(synthesisA, workspace1, patientA, 'synthesis-001')
    assert.equal(res.authorized, true)
  })

  test('rejects cross-tenant operation (different workspace)', () => {
    const res = authorizeSynthesisOperation(synthesisA, workspace2, patientA, 'synthesis-001')
    assert.equal(res.authorized, false)
    assert.equal(res.reason, 'Cross-tenant access forbidden')
  })

  test('rejects intra-tenant cross-patient overwrite attempt (same workspace, wrong patient)', () => {
    // Workspace 1 tries to operate on Synthesis A (Patient A) under the route for Patient B
    const res = authorizeSynthesisOperation(synthesisA, workspace1, patientB, 'synthesis-001')
    assert.equal(res.authorized, false)
    assert.equal(res.reason, 'Intra-tenant cross-patient access forbidden')
  })

  test('rejects nonexistent synthesis', () => {
    const res = authorizeSynthesisOperation(null, workspace1, patientA, 'synthesis-001')
    assert.equal(res.authorized, false)
    assert.equal(res.reason, 'Synthesis not found')
  })
})
