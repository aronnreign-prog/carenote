'use server'

import { db } from '@/lib/db'
import { patients, clinicalRecords, clinicalSyntheses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { purgePatientGraphMemory, pruneRecordFromGraph } from '@/lib/zep/ingest'
import { getWorkspace } from '@/lib/auth-session'
import { isValidUUID } from '@/lib/validators'
import { del } from '@vercel/blob'

export async function initializePatientGraph(formData: FormData): Promise<{ error?: string }> {
  try {
    const workspace = await getWorkspace()
    if (!workspace) return { error: 'Unauthorized' }

    const rawName = formData.get('name')
    const rawDob = formData.get('date_of_birth')
    const rawSex = formData.get('biological_sex')

    const name = typeof rawName === 'string' ? rawName.trim() : ''
    const date_of_birth = typeof rawDob === 'string' ? rawDob.trim() : ''
    const biological_sex = (typeof rawSex === 'string' && rawSex.trim()) ? rawSex.trim().slice(0, 50) : 'Unspecified'

    if (!name || name.length > 200) {
      return { error: 'Patient name is required and must be 200 characters or fewer.' }
    }
    if (!date_of_birth || date_of_birth.length > 50) {
      return { error: 'Patient date of birth is required.' }
    }

    await db.insert(patients).values({ workspace_id: workspace.id, name, date_of_birth, biological_sex })
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to initialize patient graph' }
  }
}

export async function purgePatientGraph(patientId: string): Promise<{ error?: string }> {
  if (!isValidUUID(patientId)) return { error: 'Invalid patient ID.' }
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
  if (!isValidUUID(patientId) || !isValidUUID(recordId)) {
    return { error: 'Invalid clinical record or patient ID.' }
  }
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
    .where(and(eq(clinicalRecords.id, recordId), eq(clinicalRecords.patient_id, patientId), eq(clinicalRecords.workspace_id, workspace.id)))

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
  if (!isValidUUID(patientId) || !isValidUUID(synthesisId)) {
    return { error: 'Invalid clinical synthesis or patient ID.' }
  }
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
