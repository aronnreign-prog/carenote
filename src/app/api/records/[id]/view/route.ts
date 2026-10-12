import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clinicalRecords } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getWorkspace } from '@/lib/auth-session'

export function isValidVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.blob.vercel-storage.com') ||
        parsed.hostname === 'blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
    }

    const { id: recordId } = await params
    if (!recordId) {
      return NextResponse.json({ error: 'Missing clinical record ID.' }, { status: 400 })
    }

    // Tenant-isolated query: clinical record MUST belong to this workspace
    const [record] = await db
      .select()
      .from(clinicalRecords)
      .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))
      .limit(1)

    if (!record || !record.blob_url) {
      return NextResponse.json({ error: 'Clinical record not found or access denied.' }, { status: 404 })
    }

    if (!isValidVercelBlobUrl(record.blob_url)) {
      return NextResponse.json({ error: 'Invalid clinical record storage URL.' }, { status: 400 })
    }

    const blobRes = await fetch(record.blob_url)
    if (!blobRes.ok || !blobRes.body) {
      return NextResponse.json({ error: 'Failed to retrieve clinical record from storage.' }, { status: 502 })
    }

    return new Response(blobRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'Content-Disposition': `inline; filename="${encodeURIComponent(record.filename)}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
