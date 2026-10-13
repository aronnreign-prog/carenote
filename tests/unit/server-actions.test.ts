import { describe, test, expect, vi, beforeEach } from 'vitest'

const actionMocks = vi.hoisted(() => ({
  getWorkspace: vi.fn(),
  getSession: vi.fn(),
  isAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  headers: vi.fn(async () => new Headers()),
  blobDel: vi.fn(),
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  extractClinicalFacts: vi.fn(),
  indexClinicalRecordFacts: vi.fn(),
  queryPatientMemory: vi.fn(),
  pruneRecordFromGraph: vi.fn(),
  purgePatientGraphMemory: vi.fn(),
  generateObject: vi.fn(),
  getClinicalModel: vi.fn(() => 'mock-gemini-model'),
  authCreateUser: vi.fn(),
  authRemoveUser: vi.fn(),
  authBanUser: vi.fn(),
  authUnbanUser: vi.fn(),
}))

vi.mock('@/lib/auth-session', () => ({
  getWorkspace: actionMocks.getWorkspace,
  getSession: actionMocks.getSession,
  isAdmin: actionMocks.isAdmin,
}))

vi.mock('next/cache', () => ({
  revalidatePath: actionMocks.revalidatePath,
}))

vi.mock('next/headers', () => ({
  headers: actionMocks.headers,
}))

vi.mock('@vercel/blob', () => ({
  del: actionMocks.blobDel,
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: actionMocks.dbSelect,
    insert: actionMocks.dbInsert,
    update: actionMocks.dbUpdate,
    delete: actionMocks.dbDelete,
  },
}))

vi.mock('@/lib/ai/extract', () => ({
  extractClinicalFacts: actionMocks.extractClinicalFacts,
}))

vi.mock('@/lib/zep/ingest', () => ({
  indexClinicalRecordFacts: actionMocks.indexClinicalRecordFacts,
  queryPatientMemory: actionMocks.queryPatientMemory,
  pruneRecordFromGraph: actionMocks.pruneRecordFromGraph,
  purgePatientGraphMemory: actionMocks.purgePatientGraphMemory,
}))

vi.mock('@/lib/ai/model', () => ({
  getClinicalModel: actionMocks.getClinicalModel,
}))

vi.mock('ai', () => ({
  generateObject: actionMocks.generateObject,
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      createUser: actionMocks.authCreateUser,
      removeUser: actionMocks.authRemoveUser,
      banUser: actionMocks.authBanUser,
      unbanUser: actionMocks.authUnbanUser,
    },
  },
}))

import { submitDemoRequest } from '@/app/actions/demo'
import {
  initializePatientGraph,
  purgePatientGraph,
  pruneClinicalRecord,
  deleteClinicalSynthesis,
} from '@/app/dashboard/actions'
import {
  createClinicalRecord,
  indexClinicalRecord,
  createSynthesisRecord,
  synthesizePatientGraph,
  askPatientClinicalQuery,
} from '@/app/dashboard/patients/[id]/pipeline-actions'
import {
  createDemoUser,
  deleteDemoUser,
  banDemoUser,
  unbanDemoUser,
  approveDemoRequest,
  rejectDemoRequest,
} from '@/app/admin/actions'
import { computeAdminUserList } from '@/app/admin/page'

function queueSelect(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => Object.assign(Promise.resolve(rows), { limit }))
  const from = vi.fn(() => ({ where }))
  actionMocks.dbSelect.mockReturnValueOnce({ from })
}

function queueInsert(returningRows: unknown[] = []) {
  const returning = vi.fn().mockResolvedValue(returningRows)
  const values = vi.fn(() => Object.assign(Promise.resolve(returningRows), { returning }))
  actionMocks.dbInsert.mockReturnValueOnce({ values })
  return { values, returning }
}

function queueUpdate() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn(() => ({ where }))
  actionMocks.dbUpdate.mockReturnValueOnce({ set })
  return { set, where }
}

function queueDelete() {
  const where = vi.fn().mockResolvedValue(undefined)
  actionMocks.dbDelete.mockReturnValueOnce({ where })
  return { where }
}

describe('Server Actions (Demo Intake, Dashboard, Clinical Pipeline, Admin)', () => {
  const workspaceId = '11111111-1111-4111-8111-111111111111'
  const patientId = '22222222-2222-4222-8222-222222222222'
  const recordId = '33333333-3333-4333-8333-333333333333'
  const synthesisId = '44444444-4444-4444-8444-444444444444'

  beforeEach(() => {
    vi.clearAllMocks()
    actionMocks.blobDel.mockResolvedValue(undefined)
    actionMocks.pruneRecordFromGraph.mockResolvedValue(undefined)
    actionMocks.purgePatientGraphMemory.mockResolvedValue(undefined)
  })

  describe('submitDemoRequest (src/app/actions/demo.ts)', () => {
    test('validates payload bounds, normalizes email to lowercase, and deduplicates pending requests', async () => {
      const badForm = new FormData()
      badForm.set('name', '   ')
      badForm.set('email', 'dr@hospital.org')
      const badRes = await submitDemoRequest(badForm)
      expect(badRes).toEqual({ error: 'Name is required' })

      // Deduplication check: when pending request already exists, skips insert
      queueSelect([{ id: 'existing-req-uuid' }])
      const dupForm = new FormData()
      dupForm.set('name', 'Dr. Asha')
      dupForm.set('email', 'ASHA@Hospital.org')
      const dupRes = await submitDemoRequest(dupForm)
      expect(dupRes).toEqual({ success: true })
      expect(actionMocks.dbInsert).not.toHaveBeenCalled()

      // Fresh request inserts normalized lowercase email
      queueSelect([])
      const insertSpy = queueInsert()
      const freshForm = new FormData()
      freshForm.set('name', 'Dr. Vikram')
      freshForm.set('email', 'Vikram@Clinic.org')
      freshForm.set('role', 'Cardiologist')
      freshForm.set('useCase', 'Multi-hospital heart failure reconciliation')
      const freshRes = await submitDemoRequest(freshForm)
      expect(freshRes).toEqual({ success: true })
      expect(insertSpy.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dr. Vikram',
          email: 'vikram@clinic.org',
          role: 'Cardiologist',
          use_case: 'Multi-hospital heart failure reconciliation',
          status: 'pending',
        })
      )
    })
  })

  describe('Dashboard Actions (src/app/dashboard/actions.ts)', () => {
    test('initializePatientGraph rejects empty name/DOB and inserts valid patient into caller workspace', async () => {
      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })

      const emptyNameForm = new FormData()
      emptyNameForm.set('name', '   ')
      emptyNameForm.set('date_of_birth', '1980-01-01')
      expect(await initializePatientGraph(emptyNameForm)).toEqual({
        error: 'Patient name is required and must be 200 characters or fewer.',
      })

      const emptyDobForm = new FormData()
      emptyDobForm.set('name', 'Rohan Mehta')
      emptyDobForm.set('date_of_birth', '')
      expect(await initializePatientGraph(emptyDobForm)).toEqual({
        error: 'Patient date of birth is required.',
      })

      const insertSpy = queueInsert()
      const validForm = new FormData()
      validForm.set('name', '  Rohan Mehta  ')
      validForm.set('date_of_birth', '1972-04-19')
      validForm.set('biological_sex', 'Male')
      expect(await initializePatientGraph(validForm)).toEqual({})
      expect(insertSpy.values).toHaveBeenCalledWith({
        workspace_id: workspaceId,
        name: 'Rohan Mehta',
        date_of_birth: '1972-04-19',
        biological_sex: 'Male',
      })
    })

    test('purgePatientGraph, pruneClinicalRecord, and deleteClinicalSynthesis enforce UUID validation and clean up Blob + Zep', async () => {
      expect(await purgePatientGraph('not-a-uuid')).toEqual({ error: 'Invalid patient ID.' })
      expect(await pruneClinicalRecord('bad', recordId)).toEqual({
        error: 'Invalid clinical record or patient ID.',
      })
      expect(await deleteClinicalSynthesis(patientId, 'bad')).toEqual({
        error: 'Invalid clinical synthesis or patient ID.',
      })

      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })
      queueSelect([{ blob_url: 'https://store.blob.vercel-storage.com/r1.pdf' }])
      queueDelete()

      const purgeRes = await purgePatientGraph(patientId)
      expect(purgeRes).toEqual({})
      expect(actionMocks.blobDel).toHaveBeenCalledWith(['https://store.blob.vercel-storage.com/r1.pdf'])
      expect(actionMocks.purgePatientGraphMemory).toHaveBeenCalledWith(workspaceId, patientId)

      queueSelect([
        {
          id: recordId,
          patient_id: patientId,
          workspace_id: workspaceId,
          blob_url: 'https://store.blob.vercel-storage.com/r2.pdf',
        },
      ])
      queueDelete()
      const pruneRes = await pruneClinicalRecord(patientId, recordId)
      expect(pruneRes).toEqual({})
      expect(actionMocks.blobDel).toHaveBeenCalledWith('https://store.blob.vercel-storage.com/r2.pdf')
      expect(actionMocks.pruneRecordFromGraph).toHaveBeenCalledWith(workspaceId, patientId, recordId)
    })
  })

  describe('Pipeline Actions (src/app/dashboard/patients/[id]/pipeline-actions.ts)', () => {
    test('createClinicalRecord blocks SSRF blob URLs and inserts valid Vercel Blob records', async () => {
      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })
      queueSelect([{ id: patientId, workspace_id: workspaceId }])

      const ssrfRes = await createClinicalRecord(
        patientId,
        'evil.pdf',
        'http://169.254.169.254/latest/meta-data',
        1024,
        'application/pdf'
      )
      expect(ssrfRes).toEqual({ error: 'Invalid clinical record storage URL origin.' })

      queueSelect([{ id: patientId, workspace_id: workspaceId }])
      queueInsert([{ id: recordId }])
      const okRes = await createClinicalRecord(
        patientId,
        'consult.pdf',
        'https://store.blob.vercel-storage.com/consult.pdf',
        2048,
        'application/pdf'
      )
      expect(okRes).toEqual({ id: recordId })
    })

    test('indexClinicalRecord downloads PDF, extracts facts, indexes into Zep, and updates record metadata', async () => {
      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })
      queueSelect([
        {
          id: recordId,
          patient_id: patientId,
          workspace_id: workspaceId,
          filename: 'cardio.pdf',
          blob_url: 'https://store.blob.vercel-storage.com/cardio.pdf',
        },
      ])
      queueUpdate() // status: extracting
      const finalUpdate = queueUpdate() // status: extracted

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 }))
      )

      const extractedPayload = {
        recordDate: '2025-07-01',
        recordType: 'Cardiology Clinic Note',
        medications: [],
        lab_values: [],
        conditions: [],
        otherObservations: [],
      }
      actionMocks.extractClinicalFacts.mockResolvedValueOnce(extractedPayload)
      actionMocks.indexClinicalRecordFacts.mockResolvedValueOnce({ success: true })

      const res = await indexClinicalRecord(recordId)
      expect(res).toEqual({})
      expect(actionMocks.indexClinicalRecordFacts).toHaveBeenCalledWith(
        workspaceId,
        patientId,
        recordId,
        'cardio.pdf',
        extractedPayload
      )
      expect(finalUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'extracted',
          record_date: '2025-07-01',
          record_type: 'Cardiology Clinic Note',
        })
      )
    })

    test('synthesizePatientGraph generates longitudinal synthesis and strips leading number prefixes', async () => {
      using logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })
      queueSelect([
        {
          id: patientId,
          workspace_id: workspaceId,
          name: 'Meera Nair',
          date_of_birth: '1958-11-03',
          biological_sex: 'Female',
        },
      ])
      queueSelect([{ id: synthesisId, patient_id: patientId, workspace_id: workspaceId }])
      queueUpdate() // status: processing
      const completeUpdate = queueUpdate() // status: complete

      actionMocks.queryPatientMemory.mockResolvedValueOnce('<FACTS>\n- Warfarin 5mg [ACTIVE]\n</FACTS>')
      actionMocks.generateObject.mockResolvedValueOnce({
        object: {
          synthesis_text: '1 Patient maintained on Warfarin 5mg [claim:c1].',
          claims: [{ claim_id: 'c1', claim_text: 'Warfarin 5mg daily', claim_type: 'source_record', flag: 'SUPPORTED' }],
          flagged_concerns: [],
        },
      })

      const res = await synthesizePatientGraph(patientId, synthesisId)
      expect(res).toEqual({})
      expect(completeUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'complete',
          synthesis_text: 'Patient maintained on Warfarin 5mg [claim:c1].',
        })
      )
      expect(logSpy).toHaveBeenCalled()
    })

    test('askPatientClinicalQuery bounds question to 1000 chars, self-heals empty Zep memory from Blob PDFs, and isolates prior turn in messages array', async () => {
      using logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      actionMocks.getWorkspace.mockResolvedValue({ id: workspaceId })
      queueSelect([
        {
          id: patientId,
          workspace_id: workspaceId,
          name: 'Meera Nair',
          date_of_birth: '1958-11-03',
          biological_sex: 'Female',
        },
      ])

      // 1st queryPatientMemory returns empty -> triggers self-heal rebuild from extracted clinicalRecords
      actionMocks.queryPatientMemory
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('<FACTS>\n- Rebuilt fact from PDF [record_id: rec-1] [page: 2]\n</FACTS>')

      queueSelect([
        {
          id: recordId,
          patient_id: patientId,
          workspace_id: workspaceId,
          filename: 'rebuilt.pdf',
          blob_url: 'https://store.blob.vercel-storage.com/rebuilt.pdf',
          status: 'extracted',
        },
      ])

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(new Response(new Uint8Array([9, 9, 9]), { status: 200 }))
      )
      actionMocks.extractClinicalFacts.mockResolvedValueOnce({
        medications: [],
        lab_values: [],
        conditions: [],
        otherObservations: [],
      })
      actionMocks.indexClinicalRecordFacts.mockResolvedValueOnce({ success: true })

      actionMocks.generateObject.mockResolvedValueOnce({
        object: {
          answer: 'Lisinopril was discontinued on page 2 [claim:c1].',
          claims: [
            {
              claim_id: 'c1',
              claim_text: 'Lisinopril stopped',
              flag: 'SUPPORTED',
              evidence: [{ source_record_id: recordId, source_page: 2 }],
            },
          ],
        },
      })

      const oversizedQuestion = 'Q'.repeat(1500)
      const res = await askPatientClinicalQuery(patientId, oversizedQuestion, {
        question: 'What was she taking before?',
        answer: 'She was taking Lisinopril 10mg.',
      })

      expect(res.answer).toBe('Lisinopril was discontinued on page 2 [claim:c1].')
      expect(actionMocks.indexClinicalRecordFacts).toHaveBeenCalledTimes(1)

      const callArgs = actionMocks.generateObject.mock.calls[0][0]
      expect(callArgs.messages).toHaveLength(3)
      expect(callArgs.messages[0]).toEqual({ role: 'user', content: 'What was she taking before?' })
      expect(callArgs.messages[1]).toEqual({ role: 'assistant', content: 'She was taking Lisinopril 10mg.' })
      expect(callArgs.messages[2].content).toContain('Question to answer: ' + 'Q'.repeat(1000))
      expect(callArgs.messages[2].content).not.toContain('Q'.repeat(1001))
      expect(logSpy).toHaveBeenCalled()
    })
  })

  describe('Admin Actions & Aggregation (src/app/admin/actions.ts & page.tsx)', () => {
    test('computeAdminUserList maps workspace patient and record counts accurately', () => {
      const list = computeAdminUserList(
        [{ id: 'u1', name: 'Dr. A', email: 'a@carenote.in', role: 'admin', banned: false }],
        [{ id: workspaceId, user_id: 'u1' }],
        [{ workspace_id: workspaceId, count: '5' }],
        [{ workspace_id: workspaceId, count: '14' }]
      )
      expect(list).toHaveLength(1)
      expect(list[0].patientCount).toBe(5)
      expect(list[0].indexedRecordCount).toBe(14)
    })

    test('deleteDemoUser prevents admin from deleting their own active session and cleans up tenant resources for other users', async () => {
      actionMocks.isAdmin.mockResolvedValue(true)
      actionMocks.getSession.mockResolvedValue({ user: { id: 'admin-self-id' } })

      const selfDel = await deleteDemoUser('admin-self-id')
      expect(selfDel).toEqual({ error: 'Cannot delete your own active admin account.' })

      // Deleting another demo user cleans up their Blobs, Zep graphs, workspace, and auth user
      queueSelect([{ id: workspaceId, user_id: 'demo-user-2' }])
      queueSelect([{ id: patientId }])
      queueSelect([{ blob_url: 'https://store.blob.vercel-storage.com/demo.pdf' }])
      queueDelete()
      actionMocks.authRemoveUser.mockResolvedValueOnce({})

      const okDel = await deleteDemoUser('demo-user-2')
      expect(okDel).toEqual({ success: true })
      expect(actionMocks.blobDel).toHaveBeenCalledWith(['https://store.blob.vercel-storage.com/demo.pdf'])
      expect(actionMocks.purgePatientGraphMemory).toHaveBeenCalledWith(workspaceId, patientId)
      expect(actionMocks.authRemoveUser).toHaveBeenCalled()
    })

    test('approveDemoRequest provisions Better Auth user, creates workspace, and returns CareNote-XXXXXX temp password', async () => {
      actionMocks.isAdmin.mockResolvedValue(true)
      queueSelect([
        {
          id: 'req-1',
          name: 'Dr. Priya Nair',
          email: 'priya@hospital.org',
          status: 'pending',
        },
      ])
      actionMocks.authCreateUser.mockResolvedValueOnce({
        user: { id: 'new-user-id', email: 'priya@hospital.org' },
      })
      queueSelect([]) // no existing workspace
      queueInsert() // insert workspace
      queueUpdate() // update demoRequests -> approved

      const res = await approveDemoRequest('req-1')
      expect(res.success).toBe(true)
      expect(res.email).toBe('priya@hospital.org')
      expect(res.password).toMatch(/^CareNote-[A-Za-z0-9]{6}$/)
    })

    test('createDemoUser, banDemoUser, unbanDemoUser, and rejectDemoRequest enforce admin authorization', async () => {
      actionMocks.isAdmin.mockResolvedValue(false)
      expect(await createDemoUser(new FormData())).toEqual({
        error: 'Unauthorized: Admin privileges required.',
      })
      expect(await banDemoUser('u1')).toEqual({ error: 'Unauthorized: Admin privileges required.' })
      expect(await unbanDemoUser('u1')).toEqual({ error: 'Unauthorized: Admin privileges required.' })
      expect(await rejectDemoRequest('r1')).toEqual({ error: 'Unauthorized' })
    })
  })
})
