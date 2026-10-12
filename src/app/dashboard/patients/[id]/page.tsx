export const maxDuration = 60

import { isValidUUID } from '@/lib/validators'
import PatientDetailClient from './PatientDetailClient'
import { redirect } from 'next/navigation'
import type { Patient, ClinicalRecord, ClinicalSynthesis } from '@/types/database'
import { db } from '@/lib/db'
import { patients as patientsTable, clinicalRecords as clinicalRecordsTable, clinicalSyntheses as clinicalSynthesesTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession, getWorkspace } from '@/lib/auth-session'

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params

  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  if (!isValidUUID(patientId)) {
    redirect('/dashboard')
  }

  const workspace = await getWorkspace()
  if (!workspace) {
    redirect('/login')
  }

  const [patientRow, recordRows, synthesisRows] = await Promise.all([
    db.select().from(patientsTable).where(
      and(
        eq(patientsTable.id, patientId),
        eq(patientsTable.workspace_id, workspace.id)
      )
    ).limit(1),
    db.select({
      id: clinicalRecordsTable.id,
      patient_id: clinicalRecordsTable.patient_id,
      workspace_id: clinicalRecordsTable.workspace_id,
      filename: clinicalRecordsTable.filename,
      blob_url: clinicalRecordsTable.blob_url,
      file_size: clinicalRecordsTable.file_size,
      mime_type: clinicalRecordsTable.mime_type,
      status: clinicalRecordsTable.status,
      uploaded_at: clinicalRecordsTable.uploaded_at,
      processed_at: clinicalRecordsTable.processed_at,
      record_date: clinicalRecordsTable.record_date,
      record_type: clinicalRecordsTable.record_type,
      error_message: clinicalRecordsTable.error_message,
    }).from(clinicalRecordsTable).where(
      and(
        eq(clinicalRecordsTable.patient_id, patientId),
        eq(clinicalRecordsTable.workspace_id, workspace.id)
      )
    ).orderBy(clinicalRecordsTable.uploaded_at),

    db.select({
      id: clinicalSynthesesTable.id,
      patient_id: clinicalSynthesesTable.patient_id,
      workspace_id: clinicalSynthesesTable.workspace_id,
      status: clinicalSynthesesTable.status,
      synthesis_text: clinicalSynthesesTable.synthesis_text,
      claims: clinicalSynthesesTable.claims,
      flagged_concerns: clinicalSynthesesTable.flagged_concerns,
      source_record_ids: clinicalSynthesesTable.source_record_ids,
      created_at: clinicalSynthesesTable.created_at,
      completed_at: clinicalSynthesesTable.completed_at,
      error_message: clinicalSynthesesTable.error_message,
    }).from(clinicalSynthesesTable).where(
      and(
        eq(clinicalSynthesesTable.patient_id, patientId),
        eq(clinicalSynthesesTable.workspace_id, workspace.id)
      )
    ).orderBy(clinicalSynthesesTable.created_at),
  ])

  const patient = patientRow[0] as unknown as Patient | undefined
  if (!patient) redirect('/dashboard')

  const records = (recordRows || []) as unknown as ClinicalRecord[]
  const syntheses = (synthesisRows || []) as unknown as ClinicalSynthesis[]

  return (
    <div className="min-h-[100dvh] bg-background p-3 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <PatientDetailClient
          patient={patient}
          initialRecords={records}
          initialSyntheses={syntheses}
        />
      </div>
    </div>
  )
}
