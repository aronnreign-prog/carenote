'use server'

import { db } from '@/lib/db'
import { patients, clinicalRecords, clinicalSyntheses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { purgePatientGraphMemory, pruneRecordFromGraph } from '@/lib/zep/ingest'
import { getWorkspace } from '@/lib/auth-session'
import { del } from '@vercel/blob'

export async function initializePatientGraph(formData: FormData): Promise<{ error?: string }> {
  try {
    const workspace = await getWorkspace()
    if (!workspace) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const date_of_birth = formData.get('date_of_birth') as string
    const biological_sex = (formData.get('biological_sex') as string) || 'Unspecified'

    await db.insert(patients).values({ workspace_id: workspace.id, name, date_of_birth, biological_sex })
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to initialize patient graph' }
  }
}

export async function purgePatientGraph(patientId: string): Promise<{ error?: string }> {
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  try {
    // 1. Fetch record blob URLs before deleting from DB so we can remove them from Vercel Blob
    const patientRecords = await db
      .select({ blob_url: clinicalRecords.blob_url })
      .from(clinicalRecords)
      .where(and(eq(clinicalRecords.patient_id, patientId), eq(clinicalRecords.workspace_id, workspace.id)))

    const blobUrls = patientRecords.map((r) => r.blob_url).filter(Boolean) as string[]
    if (blobUrls.length > 0) {
      await del(blobUrls).catch((err) => console.warn('[Blob] Bulk delete error on patient graph purge:', err))
    }

    // 2. Delete patient from Neon Postgres (cascades to clinical records and syntheses)
    await db.delete(patients).where(and(eq(patients.id, patientId), eq(patients.workspace_id, workspace.id)))

    // 3. Purge Zep Cloud memory graph for this patient
    await purgePatientGraphMemory(workspace.id, patientId)

    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to purge patient graph' }
  }
}

export async function pruneClinicalRecord(patientId: string, recordId: string): Promise<{ error?: string }> {
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  const [record] = await db
    .select()
    .from(clinicalRecords)
    .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.patient_id, patientId), eq(clinicalRecords.workspace_id, workspace.id)))
    .limit(1)
  if (!record) return { error: 'Clinical record not found or unauthorized' }

  await db
    .delete(clinicalRecords)
    .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.workspace_id, workspace.id)))

  if (record.blob_url) {
    await del(record.blob_url).catch(() => {})
  }

  // Prune Zep Cloud memory graph episodes for this clinical record
  await pruneRecordFromGraph(workspace.id, patientId, recordId).catch((err) => {
    console.warn('[Zep] Non-fatal clinical record memory prune error:', err)
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return {}
}

export async function deleteClinicalSynthesis(patientId: string, synthesisId: string): Promise<{ error?: string }> {
  const workspace = await getWorkspace()
  if (!workspace) return { error: 'Unauthorized' }

  try {
    await db
      .delete(clinicalSyntheses)
      .where(
        and(
          eq(clinicalSyntheses.id, synthesisId),
          eq(clinicalSyntheses.patient_id, patientId),
          eq(clinicalSyntheses.workspace_id, workspace.id)
        )
      )

    revalidatePath(`/dashboard/patients/${patientId}`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete clinical synthesis' }
  }
}
