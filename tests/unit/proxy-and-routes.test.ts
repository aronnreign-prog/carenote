import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const routeMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getWorkspace: vi.fn(),
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  queryPatientMemory: vi.fn(),
  streamObject: vi.fn(),
  getClinicalModel: vi.fn(() => 'mock-gemini-model'),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: routeMocks.getSession,
    },
  },
}))

vi.mock('@/lib/auth-session', () => ({
  getWorkspace: routeMocks.getWorkspace,
  getSession: routeMocks.getSession,
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: routeMocks.dbSelect,
    update: routeMocks.dbUpdate,
  },
}))

vi.mock('@/lib/zep/ingest', () => ({
  queryPatientMemory: routeMocks.queryPatientMemory,
}))

vi.mock('@/lib/ai/model', () => ({
  getClinicalModel: routeMocks.getClinicalModel,
}))

vi.mock('ai', () => ({
  streamObject: routeMocks.streamObject,
}))

import { proxy, normalizePath } from '@/proxy'
import { GET as viewRecordGET, isValidVercelBlobUrl } from '@/app/api/records/[id]/view/route'
import { GET as recordsGET } from '@/app/api/patients/[id]/records/route'
import { GET as synthesesGET } from '@/app/api/patients/[id]/syntheses/route'
import { POST as streamSynthesisPOST } from '@/app/api/patients/[id]/syntheses/stream/route'

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => Object.assign(Promise.resolve(rows), { limit }))
  const from = vi.fn(() => ({ where }))
  routeMocks.dbSelect.mockReturnValueOnce({ from })
}

function mockUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn(() => ({ where }))
  routeMocks.dbUpdate.mockReturnValueOnce({ set })
  return { set, where }
}

describe('Edge Proxy & API Route Handlers', () => {
  const validWorkspaceId = '11111111-1111-4111-8111-111111111111'
  const validPatientId = '22222222-2222-4222-8222-222222222222'
  const validRecordId = '33333333-3333-4333-8333-333333333333'
  const validSynthesisId = '44444444-4444-4444-8444-444444444444'

  beforeEach(() => {
    routeMocks.getSession.mockReset()
    routeMocks.getWorkspace.mockReset()
    routeMocks.dbSelect.mockReset()
    routeMocks.dbUpdate.mockReset()
    routeMocks.queryPatientMemory.mockReset()
    routeMocks.streamObject.mockReset()
  })

  describe('normalizePath & proxy (src/proxy.ts)', () => {
    test('normalizePath collapses duplicate slashes, decodes percent-encoding, and handles malformed URI sequences', () => {
      expect(normalizePath('//API//AUTH//%73ign-Up')).toBe('/api/auth/sign-up')
      expect(normalizePath('/%E0%A4%A//Admin')).toBe('/%e0%a4%a/admin')
    })

    test('blocks public sign-up API requests and encoded evasion variants with HTTP 403', async () => {
      const req1 = new NextRequest('http://localhost:3000/api/auth/sign-up/email', { method: 'POST' })
      const res1 = await proxy(req1)
      expect(res1.status).toBe(403)
      expect(await res1.json()).toEqual({
        error: 'Public registration is closed. Please register for demo access.',
      })

      const req2 = new NextRequest('http://localhost:3000//api/auth/%73ign-up/email', { method: 'POST' })
      const res2 = await proxy(req2)
      expect(res2.status).toBe(403)
    })

    test('redirects /signup and encoded variants to /#demo', async () => {
      const req = new NextRequest('http://localhost:3000//%53ignUp')
      const res = await proxy(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/#demo')
    })

    test('redirects unauthenticated /dashboard and /admin requests to /login', async () => {
      routeMocks.getSession.mockResolvedValue(null)

      const dashRes = await proxy(new NextRequest('http://localhost:3000/dashboard/patients'))
      expect(dashRes.status).toBe(307)
      expect(dashRes.headers.get('location')).toBe('http://localhost:3000/login')

      const adminRes = await proxy(new NextRequest('http://localhost:3000/admin'))
      expect(adminRes.status).toBe(307)
      expect(adminRes.headers.get('location')).toBe('http://localhost:3000/login')
    })

    test('redirects non-admin users away from /admin to /dashboard, and permits admin role or ADMIN_EMAIL', async () => {
      vi.stubEnv('ADMIN_EMAIL', 'chief@carenote.in')

      // Standard non-admin user blocked from /admin
      routeMocks.getSession.mockResolvedValueOnce({
        user: { id: 'u1', email: 'clinician@carenote.in', role: 'user' },
      })
      const nonAdminRes = await proxy(new NextRequest('http://localhost:3000/admin'))
      expect(nonAdminRes.status).toBe(307)
      expect(nonAdminRes.headers.get('location')).toBe('http://localhost:3000/dashboard')

      // User matching ADMIN_EMAIL allowed through
      routeMocks.getSession.mockResolvedValueOnce({
        user: { id: 'u2', email: 'CHIEF@carenote.in', role: 'user' },
      })
      const adminEmailRes = await proxy(new NextRequest('http://localhost:3000/admin'))
      expect(adminEmailRes.status).toBe(200)
    })

    test('redirects already authenticated users away from /login to /dashboard', async () => {
      routeMocks.getSession.mockResolvedValueOnce({
        user: { id: 'u1', email: 'clinician@carenote.in', role: 'user' },
      })
      const res = await proxy(new NextRequest('http://localhost:3000/login'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })
  })

  describe('GET /api/records/[id]/view (src/app/api/records/[id]/view/route.ts)', () => {
    test('isValidVercelBlobUrl validates HTTPS Vercel Blob hostnames and blocks SSRF origins', () => {
      expect(isValidVercelBlobUrl('https://store123.blob.vercel-storage.com/record.pdf')).toBe(true)
      expect(isValidVercelBlobUrl('https://blob.vercel-storage.com/record.pdf')).toBe(true)
      expect(isValidVercelBlobUrl('http://store123.blob.vercel-storage.com/record.pdf')).toBe(false)
      expect(isValidVercelBlobUrl('https://blob.vercel-storage.com.attacker.org/record.pdf')).toBe(false)
      expect(isValidVercelBlobUrl('http://169.254.169.254/latest/meta-data/')).toBe(false)
    })

    test('returns 401 when unauthenticated and 400 when record ID is not a valid UUID v4', async () => {
      routeMocks.getWorkspace.mockResolvedValueOnce(null)
      const unauthRes = await viewRecordGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validRecordId }),
      })
      expect(unauthRes.status).toBe(401)

      routeMocks.getWorkspace.mockResolvedValueOnce({ id: validWorkspaceId })
      const badUuidRes = await viewRecordGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: 'not-a-uuid' }),
      })
      expect(badUuidRes.status).toBe(400)
      expect(await badUuidRes.json()).toEqual({ error: 'Invalid clinical record ID.' })
    })

    test('returns 404 when record does not exist in caller workspace and 400 when blob_url fails SSRF check', async () => {
      routeMocks.getWorkspace.mockResolvedValue({ id: validWorkspaceId })
      mockSelectChain([])

      const notFoundRes = await viewRecordGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validRecordId }),
      })
      expect(notFoundRes.status).toBe(404)

      mockSelectChain([
        {
          id: validRecordId,
          workspace_id: validWorkspaceId,
          filename: 'ssrf.pdf',
          blob_url: 'http://169.254.169.254/latest/meta-data',
        },
      ])
      const ssrfRes = await viewRecordGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validRecordId }),
      })
      expect(ssrfRes.status).toBe(400)
      expect(await ssrfRes.json()).toEqual({ error: 'Invalid clinical record storage URL.' })
    })

    test('streams PDF bytes with strict CSP sandbox and nosniff headers for authorized record owner', async () => {
      routeMocks.getWorkspace.mockResolvedValueOnce({ id: validWorkspaceId })
      mockSelectChain([
        {
          id: validRecordId,
          workspace_id: validWorkspaceId,
          filename: 'Discharge Summary 2025.pdf',
          blob_url: 'https://teststore.blob.vercel-storage.com/discharge.pdf',
        },
      ])

      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(
          new Response(pdfBytes, {
            status: 200,
            headers: { 'Content-Type': 'application/pdf' },
          })
        )
      )

      const res = await viewRecordGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validRecordId }),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(res.headers.get('Content-Security-Policy')).toBe("sandbox; default-src 'none'")
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('Content-Disposition')).toBe(
        'inline; filename="Discharge%20Summary%202025.pdf"'
      )
      const bodyBuffer = new Uint8Array(await res.arrayBuffer())
      expect(Array.from(bodyBuffer)).toEqual([0x25, 0x50, 0x44, 0x46])
    })
  })

  describe('Polling Routes: GET /api/patients/[id]/records & /syntheses', () => {
    test('rejects invalid patient UUID with 400 and unauthenticated requests with 401', async () => {
      const badRecRes = await recordsGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: 'undefined' }),
      })
      expect(badRecRes.status).toBe(400)

      const badSynRes = await synthesesGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: 'invalid-uuid' }),
      })
      expect(badSynRes.status).toBe(400)

      routeMocks.getWorkspace.mockResolvedValue(null)
      const unauthRec = await recordsGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validPatientId }),
      })
      expect(unauthRec.status).toBe(401)
    })

    test('returns workspace-scoped records and syntheses when authorized', async () => {
      routeMocks.getWorkspace.mockResolvedValue({ id: validWorkspaceId })
      mockSelectChain([{ id: validRecordId, filename: 'labs.pdf', status: 'extracted' }])
      const recRes = await recordsGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validPatientId }),
      })
      expect(recRes.status).toBe(200)
      expect(await recRes.json()).toEqual({
        records: [{ id: validRecordId, filename: 'labs.pdf', status: 'extracted' }],
      })

      mockSelectChain([{ id: validSynthesisId, status: 'complete' }])
      const synRes = await synthesesGET(new Request('http://localhost:3000'), {
        params: Promise.resolve({ id: validPatientId }),
      })
      expect(synRes.status).toBe(200)
      expect(await synRes.json()).toEqual({
        syntheses: [{ id: validSynthesisId, status: 'complete' }],
      })
    })
  })

  describe('POST /api/patients/[id]/syntheses/stream (src/app/api/patients/[id]/syntheses/stream/route.ts)', () => {
    test('marks synthesis failed and returns 400 when Zep temporal memory is empty', async () => {
      routeMocks.getWorkspace.mockResolvedValueOnce({ id: validWorkspaceId })
      // 1st select: patient lookup
      mockSelectChain([
        {
          id: validPatientId,
          workspace_id: validWorkspaceId,
          name: 'Asha Rao',
          date_of_birth: '1965-09-12',
          biological_sex: 'Female',
        },
      ])
      // 2nd select: synthesis lookup
      mockSelectChain([{ id: validSynthesisId, patient_id: validPatientId, workspace_id: validWorkspaceId }])
      // 1st update: status -> processing
      mockUpdateChain()
      // 2nd update: status -> failed
      const failedUpdate = mockUpdateChain()

      routeMocks.queryPatientMemory.mockResolvedValueOnce('')

      const req = new Request(`http://localhost:3000/api/patients/${validPatientId}/syntheses/stream`, {
        method: 'POST',
        body: JSON.stringify({ synthesisId: validSynthesisId }),
      })
      const res = await streamSynthesisPOST(req, { params: Promise.resolve({ id: validPatientId }) })

      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Clinical memory unavailable.' })
      expect(failedUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      )
    })

    test('streams synthesis with req.signal abort propagation and persists completed object onFinish', async () => {
      routeMocks.getWorkspace.mockResolvedValueOnce({ id: validWorkspaceId })
      mockSelectChain([
        {
          id: validPatientId,
          workspace_id: validWorkspaceId,
          name: 'Asha Rao',
          date_of_birth: '1965-09-12',
          biological_sex: 'Female',
        },
      ])
      mockSelectChain([{ id: validSynthesisId, patient_id: validPatientId, workspace_id: validWorkspaceId }])
      mockUpdateChain() // processing update
      const completeUpdate = mockUpdateChain() // onFinish complete update

      routeMocks.queryPatientMemory.mockResolvedValueOnce('<FACTS>\n- Lisinopril 10mg [ACTIVE]\n</FACTS>')

      let capturedOptions: Record<string, any> = {}
      routeMocks.streamObject.mockImplementationOnce((opts: Record<string, any>) => {
        capturedOptions = opts
        return {
          toTextStreamResponse: () => new Response('streamed-chunk', { status: 200 }),
        }
      })

      const abortController = new AbortController()
      const req = new Request(`http://localhost:3000/api/patients/${validPatientId}/syntheses/stream`, {
        method: 'POST',
        body: JSON.stringify({ synthesisId: validSynthesisId }),
        signal: abortController.signal,
      })

      const res = await streamSynthesisPOST(req, { params: Promise.resolve({ id: validPatientId }) })
      expect(res.status).toBe(200)
      expect(await res.text()).toBe('streamed-chunk')
      expect(capturedOptions.abortSignal).toBeDefined()

      // Verify onFinish callback strips leading numeric prefix and saves claims/concerns to DB
      await capturedOptions.onFinish({
        object: {
          synthesis_text: '12 Longitudinal synthesis text [claim:c1].',
          claims: [{ claim_id: 'c1', claim_text: 'Lisinopril active', claim_type: 'source_record' }],
          flagged_concerns: [],
        },
      })

      expect(completeUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'complete',
          synthesis_text: 'Longitudinal synthesis text [claim:c1].',
        })
      )
    })
  })
})
