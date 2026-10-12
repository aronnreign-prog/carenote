import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isValidVercelBlobUrl } from '../src/app/api/records/[id]/view/route.ts'

interface ClinicalRecordItem {
  id: string
  workspace_id: string
  blob_url: string
  filename: string
}

function authorizeRecordView(
  sessionWorkspace: { id: string } | null,
  record: ClinicalRecordItem | null
): { status: number; error?: string } {
  if (!sessionWorkspace) {
    return { status: 401, error: 'Unauthorized: Authentication required.' }
  }

  if (!record) {
    return { status: 404, error: 'Clinical record not found.' }
  }

  if (record.workspace_id !== sessionWorkspace.id) {
    return { status: 404, error: 'Clinical record not found or access denied.' }
  }

  if (!isValidVercelBlobUrl(record.blob_url)) {
    return { status: 400, error: 'Invalid clinical record storage URL.' }
  }

  return { status: 200 }
}

describe('Authenticated Clinical Record Streaming Proxy', () => {
  const workspace1 = { id: 'workspace-111' }
  const workspace2 = { id: 'workspace-222' }

  const validRecord: ClinicalRecordItem = {
    id: 'rec-001',
    workspace_id: 'workspace-111',
    blob_url: 'https://hebbkx1anhila5yf.blob.vercel-storage.com/prescriptions/rx-123.pdf',
    filename: 'rx-123.pdf',
  }

  const ssrfRecord: ClinicalRecordItem = {
    id: 'rec-002',
    workspace_id: 'workspace-111',
    blob_url: 'http://169.254.169.254/latest/meta-data/',
    filename: 'evil.pdf',
  }

  test('authorizes logged-in owner to stream valid clinical record', () => {
    const res = authorizeRecordView(workspace1, validRecord)
    assert.equal(res.status, 200)
  })

  test('blocks unauthenticated access with 401', () => {
    const res = authorizeRecordView(null, validRecord)
    assert.equal(res.status, 401)
    assert.equal(res.error, 'Unauthorized: Authentication required.')
  })

  test('blocks other workspaces from accessing another tenant clinical record with 404', () => {
    const res = authorizeRecordView(workspace2, validRecord)
    assert.equal(res.status, 404)
    assert.equal(res.error, 'Clinical record not found or access denied.')
  })

  test('rejects non-Vercel SSRF blob URLs with 400', () => {
    const res = authorizeRecordView(workspace1, ssrfRecord)
    assert.equal(res.status, 400)
    assert.equal(res.error, 'Invalid clinical record storage URL.')
  })
})

describe('Vercel Blob URL Validation & SSRF Prevention', () => {
  test('accepts valid HTTPS Vercel Blob store URLs', () => {
    assert.equal(isValidVercelBlobUrl('https://hebbkx1anhila5yf.blob.vercel-storage.com/doc.pdf'), true)
    assert.equal(isValidVercelBlobUrl('https://blob.vercel-storage.com/my-patient-record.pdf'), true)
    assert.equal(isValidVercelBlobUrl('https://custom-prefix.12345.blob.vercel-storage.com/folder/file.pdf'), true)
  })

  test('rejects insecure HTTP Vercel Blob URLs', () => {
    assert.equal(isValidVercelBlobUrl('http://hebbkx1anhila5yf.blob.vercel-storage.com/doc.pdf'), false)
    assert.equal(isValidVercelBlobUrl('http://blob.vercel-storage.com/file.pdf'), false)
  })

  test('rejects domain suffix spoofing SSRF attempts', () => {
    assert.equal(isValidVercelBlobUrl('https://hebbkx1anhila5yf.blob.vercel-storage.com.attacker.com/leak.pdf'), false)
    assert.equal(isValidVercelBlobUrl('https://blob.vercel-storage.com.attacker.com/evil'), false)
    assert.equal(isValidVercelBlobUrl('https://fake-blob.vercel-storage.com.evil.org/test'), false)
  })

  test('rejects cloud metadata and internal network endpoints', () => {
    assert.equal(isValidVercelBlobUrl('http://169.254.169.254/latest/meta-data/'), false)
    assert.equal(isValidVercelBlobUrl('https://169.254.169.254/'), false)
    assert.equal(isValidVercelBlobUrl('http://127.0.0.1:3000/api/admin'), false)
    assert.equal(isValidVercelBlobUrl('http://localhost:5432'), false)
  })

  test('rejects non-HTTP protocols and malformed inputs', () => {
    assert.equal(isValidVercelBlobUrl('file:///etc/passwd'), false)
    assert.equal(isValidVercelBlobUrl('javascript:alert(document.cookie)'), false)
    assert.equal(isValidVercelBlobUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false)
    assert.equal(isValidVercelBlobUrl(''), false)
    assert.equal(isValidVercelBlobUrl('not-a-valid-url'), false)
  })
})
