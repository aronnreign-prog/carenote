import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clinicalRecords } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getWorkspace } from '@/lib/auth-session'
import { isValidUUID } from '@/lib/validators'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid patient ID.' }, { status: 400 })
    }
    const workspace = await getWorkspace()
    if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await db
      .select()
      .from(clinicalRecords)
      .where(and(eq(clinicalRecords.patient_id, id), eq(clinicalRecords.workspace_id, workspace.id)))
    return NextResponse.json({ records: rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
