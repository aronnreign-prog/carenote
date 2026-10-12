'use client'

import type { ClinicalRecord } from '@/types/database'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { indexClinicalRecord, createClinicalRecord } from './pipeline-actions'

interface Props {
  patientId: string
  indexing: boolean
  variant?: 'compact' | 'dropzone'
  onIndexingChange: (indexing: boolean) => void
  onRecordIndexed: (record: ClinicalRecord) => void
}

export default function ClinicalRecordIndexer({
  patientId,
  indexing,
  variant = 'compact',
  onIndexingChange,
  onRecordIndexed,
}: Props) {
  const router = useRouter()

  const handleIndexRecords = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const pdfs = files.filter(f => f.type === 'application/pdf')
    if (pdfs.length < files.length) alert('Skipping non-PDF files.')
    if (pdfs.length === 0) return

    const oversized = pdfs.filter(f => f.size > 10 * 1024 * 1024)
    if (oversized.length > 0) { alert(`${oversized.length} file(s) exceed 10MB.`); return }

    onIndexingChange(true)
    let indexedCount = 0
    let failedCount = 0

    for (const file of pdfs) {
      try {
        const blob = await upload(`${patientId}/${Date.now()}_${file.name}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })

        const result = await createClinicalRecord(patientId, file.name, blob.url, file.size, file.type)
        if (result.error || !result.id) throw new Error(result.error ?? 'No clinical record ID')

        const clinicalRecord: ClinicalRecord = {
          id: result.id,
          patient_id: patientId,
          workspace_id: '',
          filename: file.name,
          blob_url: blob.url,
          file_size: String(file.size),
          mime_type: file.type,
          status: 'uploaded',
          uploaded_at: new Date().toISOString(),
        }
        onRecordIndexed(clinicalRecord)
        indexedCount++

        indexClinicalRecord(result.id).catch(err => {
          console.error('[Index] Graph ingestion failed for', result.id, err)
        })
      } catch (e: unknown) {
        failedCount++
        console.error(file.name, e)
      }
    }

    if (failedCount > 0) alert(`Indexed ${indexedCount} of ${pdfs.length}. ${failedCount} failed.`)
    router.refresh()
    onIndexingChange(false)
    e.target.value = ''
  }

  if (variant === 'dropzone') {
    return (
      <div className="mt-3">
        <label className="inline-flex flex-col items-center justify-center cursor-pointer">
          <input type="file" accept=".pdf" multiple className="hidden" onChange={handleIndexRecords} disabled={indexing} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-background font-mono text-[11px] font-semibold hover:opacity-90 transition-opacity">
            {indexing ? (
              'Indexing records...'
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Index Clinical Records (PDF)
              </>
            )}
          </span>
        </label>
        <p className="font-mono text-[9px] text-muted-foreground mt-2">
          One record per encounter · Connects across time into patient graph
        </p>
      </div>
    )
  }

  return (
    <label className="cursor-pointer inline-flex items-center">
      <input type="file" accept=".pdf" multiple className="hidden" onChange={handleIndexRecords} disabled={indexing} />
      <span className="font-mono text-[10px] text-accent hover:text-foreground transition-colors font-medium">
        {indexing ? 'Indexing...' : '+ Index Record'}
      </span>
    </label>
  )
}
