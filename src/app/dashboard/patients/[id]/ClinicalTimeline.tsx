'use client'

import React, { useState } from 'react'
import type { ClinicalRecord } from '@/types/database'
import { pruneClinicalRecord } from '@/app/dashboard/actions'
import { PipelineBar } from './PipelineBar'
import ClinicalRecordIndexer from './ClinicalRecordIndexer'
import { indexClinicalRecord } from './pipeline-actions'

interface Props {
  patientId: string
  records: ClinicalRecord[]
  indexing: boolean
  onIndexingChange: (v: boolean) => void
  onRecordIndexed: (record: ClinicalRecord) => void
  onRecordPruned: (id: string) => void
  onRecordStatusUpdate?: (id: string, status: ClinicalRecord['status']) => void
  onRecordClick: (e: React.MouseEvent, recordId: string, page?: number) => void
}

/** Deep module: renders chronological clinical records timeline with index, prune, and retry. */
export default function ClinicalTimeline({
  patientId, records, indexing,
  onIndexingChange, onRecordIndexed, onRecordPruned, onRecordStatusUpdate, onRecordClick,
}: Props) {
  const [retryingId, setRetryingId] = useState<string | null>(null)
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Clinical Records Timeline</p>
        {records.length > 0 && (
          <ClinicalRecordIndexer
            patientId={patientId}
            indexing={indexing}
            variant="compact"
            onIndexingChange={onIndexingChange}
            onRecordIndexed={onRecordIndexed}
          />
        )}
      </div>

      {records.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center bg-surface/50">
          <p className="text-[12px] font-medium text-foreground">No records in timeline yet</p>
          <ClinicalRecordIndexer
            patientId={patientId}
            indexing={indexing}
            variant="dropzone"
            onIndexingChange={onIndexingChange}
            onRecordIndexed={onRecordIndexed}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div key={record.id}
              className={`group relative border border-border rounded-md px-3 py-2.5 bg-surface-raised ${record.blob_url ? 'hover:border-accent/40 cursor-pointer transition-colors' : ''}`}
              onClick={(e) => record.blob_url ? onRecordClick(e, record.id) : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="text-muted-foreground shrink-0 mt-0.5">
                    <path d="M2 1h6l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1"/>
                    <path d="M8 1v3h3" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[11px] text-foreground font-mono truncate">{record.filename}</p>
                    <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                      {record.record_date ? `Encounter: ${record.record_date}` : new Date(record.uploaded_at).toLocaleDateString()}
                      {record.record_type ? ` · ${record.record_type}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm(`Delete record ${record.filename}? This will prune its facts from the patient graph.`)) {
                      const result = await pruneClinicalRecord(patientId, record.id)
                      if (result?.error) { alert(`Failed to delete: ${result.error}`); return }
                      onRecordPruned(record.id)
                    }
                  }}
                  title="Delete record and prune from patient graph"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-alert rounded"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 3h9M4.5 3V2h3v1M3 3l.5 7.5h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <PipelineBar status={record.status} />
                {record.status === 'failed' && (
                  <button
                    disabled={retryingId === record.id}
                    onClick={async (e) => {
                      e.stopPropagation()
                      setRetryingId(record.id)
                      onRecordStatusUpdate?.(record.id, 'extracting')
                      const res = await indexClinicalRecord(record.id)
                      if (res?.error) {
                        onRecordStatusUpdate?.(record.id, 'failed')
                      }
                      setRetryingId(null)
                    }}
                    title={record.error_message ? `Error: ${record.error_message} (Click to retry)` : 'Retry extraction'}
                    className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-alert/40 text-alert hover:bg-alert/10 hover:border-alert transition-all flex items-center gap-1 shrink-0"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={retryingId === record.id ? 'animate-spin' : ''}
                    >
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    <span>{retryingId === record.id ? 'Retrying...' : 'Retry'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
