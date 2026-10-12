import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clinicalSyntheses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getWorkspace } from '@/lib/auth-session'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workspace = await getWorkspace()
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db
    .select()
    .from(clinicalSyntheses)
    .where(and(eq(clinicalSyntheses.patient_id, id), eq(clinicalSyntheses.workspace_id, workspace.id)))
  return NextResponse.json({ syntheses: rows })
}
