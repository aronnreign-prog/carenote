'use client'

import React, { useState, useEffect } from 'react'
import type { Patient, ClinicalRecord, ClinicalSynthesis } from '@/types/database'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import ClinicalTimeline from './ClinicalTimeline'
import { createSynthesisRecord, askPatientClinicalQuery } from './pipeline-actions'
import { deleteClinicalSynthesis } from '@/app/dashboard/actions'
import { FlaggedBanner } from '@/components/clinical'

type EvidenceItem = {
  source_record_id?: string
  source_doc_id?: string
  source_page?: number
  source_quote?: string
  entry_text?: string
}

type Claim = {
  claim_id?: string
  claim_text: string
  claim_type?: string
  flag?: string
  evidence?: EvidenceItem | EvidenceItem[] | null
}

type FlaggedConcern = { severity: 'high' | 'medium' | 'low'; description?: string; concern?: string }

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'null') return 'Undated'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}

export function CitationChip({
  claim,
  onRecordClick,
  records = [],
}: {
  claim: Claim
  onRecordClick: (e: React.MouseEvent, id: string, page?: number) => void
  records?: ClinicalRecord[]
}) {
  const isDrug = claim.flag === 'MEDICAL_KNOWLEDGE' || claim.claim_type === 'medical_knowledge'
  const isConflicting = claim.flag === 'CONFLICTING'
  const isAbsence = claim.claim_type === 'notable_absence'

  if (isConflicting) {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-0.5 sm:px-1.5 sm:py-0.5 ml-1 sm:ml-1.5 align-middle border-amber-500/50 text-amber-400 bg-amber-500/10 cursor-help"
        title={claim.claim_text || 'Conflicting findings across records'}
      >
        ⚡ Conflicting
      </span>
    )
  }

  if (isAbsence) {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-0.5 sm:px-1.5 sm:py-0.5 ml-1 sm:ml-1.5 align-middle border-purple-500/50 text-purple-300 bg-purple-500/10 cursor-help"
        title={claim.claim_text || 'Notable absence in medical documentation'}
      >
        ∅ Not Documented
      </span>
    )
  }

  if (isDrug) {
    const title = (Array.isArray(claim.evidence) ? claim.evidence[0]?.entry_text : claim.evidence?.entry_text) || claim.claim_text || ''
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-0.5 sm:px-1.5 sm:py-0.5 ml-1 sm:ml-1.5 align-middle border-warning/40 text-warning bg-warning-dim cursor-default"
        title={title}
      >
        ⚠ Medical Knowledge
      </span>
    )
  }

  const evidenceList: EvidenceItem[] = Array.isArray(claim.evidence)
    ? claim.evidence
    : (claim.evidence ? [claim.evidence] : [])

  if (evidenceList.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-0.5 sm:px-1.5 sm:py-0.5 ml-1 sm:ml-1.5 align-middle border-muted text-muted-foreground bg-muted/20 cursor-default"
        title={claim.claim_text}
      >
        ? Unverified
      </span>
    )
  }

  return (
    <>
      {evidenceList.map((ev, idx) => {
        const recordId = ev.source_record_id ?? ev.source_doc_id
        const page = ev.source_page
        const record = recordId ? records.find((r) => r.id === recordId) : undefined

        // If recordId is missing/invalid or record is not in patient timeline, show honest unverified badge rather than broken dead button
        if (!recordId || !record) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-0.5 sm:px-1.5 sm:py-0.5 ml-1 align-middle border-muted text-muted-foreground bg-muted/20 cursor-default"
              title={ev.source_quote || ev.entry_text || claim.claim_text || 'Source record not found in timeline'}
            >
              ? Unverified
            </span>
          )
        }

        const typeLabel = record.record_type || 'Record'
        const dateLabel = record.record_date ? formatShortDate(record.record_date) : 'Undated'
        const pageLabel = page && page > 1 ? ` · p.${page}` : ''
        const label = `${typeLabel} · ${dateLabel}${pageLabel}`
        const title = ev.source_quote || ev.entry_text || claim.claim_text || ''

        return (
          <button
            key={idx}
            onClick={(e) => onRecordClick(e, recordId, page ?? 1)}
            className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[9px] border rounded px-2 py-1 sm:px-1.5 sm:py-0.5 ml-1 align-middle transition-colors border-accent/40 text-accent bg-accent-dim hover:border-accent hover:bg-accent/20 cursor-pointer touch-manipulation my-0.5"
            title={title}
          >
            ↗ {label}
          </button>
        )
      })}
    </>
  )
}

export function renderContentWithClaims(
  node: React.ReactNode,
  claimsMap: Record<string, Claim>,
  onRecordClick: (e: React.MouseEvent, id: string, page?: number) => void,
  records: ClinicalRecord[] = []
): React.ReactNode {
  if (typeof node === 'string') {
    const parts = node.split(/(\[claim:[^\]]+\])/g)
    if (parts.length === 1) return node
    return parts.map((part, i) => {
      const match = part.match(/^\[claim:([^\]]+)\]$/)
      if (match) {
        const rawContent = match[1]
        const idMatches = rawContent.match(/[a-zA-Z0-9_-]+/g) ?? []
        const validChips: React.ReactNode[] = []

        idMatches.forEach((rawId, subIdx) => {
          const claimId = rawId.replace(/^claim:/, '')
          const claim = claimsMap[claimId] ?? {
            claim_id: claimId,
            claim_text: `Unverified citation [${claimId}]`,
            flag: 'UNVERIFIED',
          }
          validChips.push(
            <CitationChip key={`${i}-${subIdx}`} claim={claim} onRecordClick={onRecordClick} records={records} />
          )
        })

        if (validChips.length > 0) {
          return <React.Fragment key={i}>{validChips}</React.Fragment>
        }
        return null
      }
      return part
    })
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>
        {renderContentWithClaims(child, claimsMap, onRecordClick, records)}
      </React.Fragment>
    ))
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    if (element.props && element.props.children) {
      return React.cloneElement(
        element,
        element.props,
        renderContentWithClaims(element.props.children, claimsMap, onRecordClick, records)
      )
    }
  }

  return node
}

interface Props {
  patient: Patient
  initialRecords: ClinicalRecord[]
  initialSyntheses: ClinicalSynthesis[]
}

export default function PatientDetailClient({ patient, initialRecords, initialSyntheses }: Props) {
  const [records, setRecords] = useState<ClinicalRecord[]>(initialRecords)
  const [syntheses, setSyntheses] = useState<ClinicalSynthesis[]>(initialSyntheses)
  const [activeSynthesisId, setActiveSynthesisId] = useState<string | null>(initialSyntheses[0]?.id ?? null)
  const [synthesizing, setSynthesizing] = useState(false)
  const [indexingRecord, setIndexingRecord] = useState(false)
  const [activeView, setActiveView] = useState<'synthesis' | 'query'>('synthesis')
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false)

  // On-demand temporal memory query state
  const [queryInput, setQueryInput] = useState('')
  const [queryRunning, setQueryRunning] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<Array<{
    id: string
    question: string
    answer: string
    claims: Claim[]
    timestamp: string
  }>>([])

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    synthesisId: string
  } | null>(null)

  const activeSynthesis = syntheses.find(s => s.id === activeSynthesisId) ?? syntheses[0] ?? null

  // Dismiss context menu on outside click, scroll, or Escape key
  useEffect(() => {
    if (!contextMenu) return
    const handleClose = () => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  // Adaptive polling for in-progress clinical records and syntheses
  useEffect(() => {
    const hasPendingRecord = records.some(r => ['uploaded', 'processing', 'extracting'].includes(r.status))
    const hasPendingSynthesis = syntheses.some(s => s.status === 'queued' || s.status === 'processing')
    if (!hasPendingSynthesis && !hasPendingRecord) return

    let interval = 3000
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      if (document.visibilityState === 'hidden') { timer = setTimeout(poll, interval * 2); return }
      try {
        const [recordsRes, synthesesRes] = await Promise.all([
          fetch(`/api/patients/${patient.id}/records`).then(r => r.json()),
          fetch(`/api/patients/${patient.id}/syntheses`).then(r => r.json()),
        ])
        const updatedRecords = recordsRes.records
        const updatedSyntheses = synthesesRes.syntheses

        if (updatedRecords) setRecords(updatedRecords as ClinicalRecord[])
        if (updatedSyntheses) setSyntheses(updatedSyntheses as ClinicalSynthesis[])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stillPending = ((updatedRecords || []) as any[]).some((r: any) => ['uploaded', 'processing', 'extracting'].includes(r.status)) ||
                             // eslint-disable-next-line @typescript-eslint/no-explicit-any
                             ((updatedSyntheses || []) as any[]).some((s: any) => s.status === 'queued' || s.status === 'processing')
        interval = stillPending ? Math.min(interval * 1.5, 30000) : 3000
      } catch (err) {
        console.error('Polling error', err)
      }
      timer = setTimeout(poll, interval)
    }
    timer = setTimeout(poll, interval)
    return () => clearTimeout(timer)
  }, [patient.id, syntheses, records])

  const handleSynthesizePatientGraph = async () => {
    setSynthesizing(true)
    try {
      const result = await createSynthesisRecord(patient.id, records.map(r => r.id))
      if (result.error || !result.id) throw new Error(result.error ?? 'No synthesis ID')

      const newSynthesis: ClinicalSynthesis = {
        id: result.id,
        patient_id: patient.id,
        workspace_id: patient.workspace_id,
        status: 'queued',
        source_record_ids: records.map(r => r.id),
        created_at: new Date().toISOString()
      }

      setSyntheses(prev => [newSynthesis, ...prev])
      setActiveSynthesisId(result.id)

      fetch(`/api/patients/${patient.id}/syntheses/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ synthesisId: result.id }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            console.error('[Synthesis Stream] Failed:', data.error)
            setSyntheses(prev => prev.map(s => s.id === result.id ? {
              ...s,
              status: 'failed',
              error_message: data.error || 'Failed to synthesize patient graph.',
            } : s))
            return
          }
          if (res.body) {
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value) {
                accumulated += decoder.decode(value, { stream: true })
              }
            }
            try {
              const parsed = JSON.parse(accumulated)
              const rawText = parsed?.synthesis_text
              if (rawText) {
                setSyntheses(prev => prev.map(s => s.id === result.id ? {
                  ...s,
                  status: 'complete',
                  synthesis_text: rawText.replace(/^[0-9]+\s+/, '').trim(),
                  claims: parsed.claims || [],
                  flagged_concerns: parsed.flagged_concerns || [],
                  completed_at: new Date().toISOString(),
                } : s))
              }
            } catch {
              // Non-fatal: if JSON parsing of full stream text is incomplete, background onFinish & polling keep state in sync
            }
          }
        })
        .catch(err => {
          console.error('[Synthesis Stream] Error:', err)
          setSyntheses(prev => prev.map(s => s.id === result.id ? {
            ...s,
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Network stream error',
          } : s))
        })
    } catch (err: unknown) {
      alert('Failed to start clinical synthesis: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSynthesizing(false)
    }
  }

  const handleDeleteSynthesis = async (synthesisId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to delete this clinical synthesis?')) return

    try {
      const res = await deleteClinicalSynthesis(patient.id, synthesisId)
      if (res.error) {
        alert('Failed to delete synthesis: ' + res.error)
        return
      }
      setSyntheses(prev => prev.filter(s => s.id !== synthesisId))
      if (activeSynthesisId === synthesisId) {
        const remaining = syntheses.filter(s => s.id !== synthesisId)
        setActiveSynthesisId(remaining[0]?.id ?? null)
      }
    } catch (err) {
      alert('Error deleting synthesis: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleRunQuery = async (customQuestion?: string) => {
    const q = (customQuestion || queryInput).trim()
    if (!q) return
    if (records.length === 0) {
      alert('Please index at least one medical record before querying.')
      return
    }

    setQueryRunning(true)
    setQueryError(null)

    try {
      const lastTurn = queryHistory[0]
        ? { question: queryHistory[0].question, answer: queryHistory[0].answer }
        : undefined

      const res = await askPatientClinicalQuery(patient.id, q, lastTurn)
      if (res.error || !res.answer) {
        setQueryError(res.error || 'Failed to retrieve answer from temporal memory.')
      } else {
        setQueryHistory(prev => [
          {
            id: 'q-' + Date.now(),
            question: q,
            answer: res.answer!,
            claims: (res.claims as Claim[]) || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ])
        setQueryInput('')
      }
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Unknown query error')
    } finally {
      setQueryRunning(false)
    }
  }

  const handleRecordClick = async (e: React.MouseEvent, recordId: string, page?: number) => {
    e.preventDefault()
    const record = records.find(r => r.id === recordId)
    if (!record) { alert('Clinical record not available.'); return }
    const url = page ? `/api/records/${record.id}/view#page=${page}` : `/api/records/${record.id}/view`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleRecordPruned = (id: string) => setRecords(prev => prev.filter(r => r.id !== id))
  const handleRecordIndexed = (record: ClinicalRecord) => setRecords(prev => [record, ...prev])
  const handleRecordStatusUpdate = (id: string, status: ClinicalRecord['status']) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status, error_message: null } : r))
  }

  const concerns: FlaggedConcern[] = (activeSynthesis?.flagged_concerns as FlaggedConcern[] | null) ?? []
  const claimsArray: Claim[] = (activeSynthesis?.claims as Claim[] | null) ?? []
  const supported = claimsArray.filter(c => c.flag === 'SUPPORTED').length
  const partial = claimsArray.filter(c => c.flag === 'PARTIALLY SUPPORTED').length
  const unsupported = claimsArray.filter(c => c.flag === 'UNSUPPORTED').length
  const conflicting = claimsArray.filter(c => c.flag === 'CONFLICTING').length
  const absences = claimsArray.filter(c => c.claim_type === 'notable_absence').length
  const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden flex flex-col min-h-[600px]">
      <header className="shrink-0 border-b border-border bg-surface flex flex-wrap items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9.5 6H2.5M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="font-mono text-[10px]">Patient Graphs</span>
          </Link>
          <span className="text-border">/</span>
          <span className="font-mono text-[10px] sm:text-[11px] text-foreground font-semibold truncate">{patient.name}</span>
          {concerns.length > 0 && (
            <div className="flex items-center gap-1 bg-alert-dim border border-alert/30 rounded px-1.5 py-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-alert" />
              <span className="font-mono text-[9px] text-alert">{concerns.length} flag{concerns.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTimelineDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1.5 rounded border border-border bg-surface-raised text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors shrink-0 touch-manipulation"
            aria-label="Open clinical timeline drawer"
          >
            <span>📄 Timeline</span>
            <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {records.length}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Clinical Timeline Drawer */}
      {isTimelineDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setIsTimelineDrawerOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-surface border-r border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          isTimelineDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-surface-raised/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-accent">
              {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-foreground truncate">{patient.name}</h2>
              <p className="font-mono text-[9px] text-muted-foreground">{patient.biological_sex} · {age}y · DOB {patient.date_of_birth}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTimelineDrawerOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0 font-mono text-xs px-2 border border-border"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ClinicalTimeline
            patientId={patient.id}
            records={records}
            indexing={indexingRecord}
            onIndexingChange={setIndexingRecord}
            onRecordIndexed={handleRecordIndexed}
            onRecordPruned={handleRecordPruned}
            onRecordStatusUpdate={handleRecordStatusUpdate}
            onRecordClick={(e, id, page) => {
              setIsTimelineDrawerOpen(false)
              handleRecordClick(e, id, page)
            }}
          />
        </div>

        <div className="border-t border-border p-3 shrink-0 bg-surface-raised/40">
          <button
            onClick={() => {
              setIsTimelineDrawerOpen(false)
              handleSynthesizePatientGraph()
              setActiveView('synthesis')
            }}
            disabled={synthesizing || records.length === 0 || records.some(r => r.status === 'uploaded' || r.status === 'extracting')}
            className="w-full min-h-[40px] bg-white text-black font-mono text-[11px] font-semibold py-2.5 px-3 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-white/60 outline-none shadow-sm"
          >
            {synthesizing
              ? 'Traversing patient graph...'
              : records.some(r => r.status === 'uploaded' || r.status === 'extracting')
              ? 'Indexing into temporal memory...'
              : 'Synthesize Patient Graph'}
          </button>
        </div>
      </div>

      <FlaggedBanner concerns={concerns} />

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Desktop Sidebar (Persistent) */}
        <aside className="hidden md:flex w-72 shrink-0 border-r border-border bg-surface flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-dim border border-accent/20 flex items-center justify-center shrink-0 font-mono text-[14px] font-bold text-accent">
                {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-[14px] font-semibold text-foreground leading-tight">{patient.name}</h1>
                <p className="font-mono text-[10px] text-muted-foreground">{patient.biological_sex} · {age}y · DOB {patient.date_of_birth}</p>
              </div>
            </div>
          </div>

          <ClinicalTimeline
            patientId={patient.id}
            records={records}
            indexing={indexingRecord}
            onIndexingChange={setIndexingRecord}
            onRecordIndexed={handleRecordIndexed}
            onRecordPruned={handleRecordPruned}
            onRecordStatusUpdate={handleRecordStatusUpdate}
            onRecordClick={handleRecordClick}
          />

          <div className="border-t border-border p-4 shrink-0">
            <button
              onClick={() => {
                handleSynthesizePatientGraph()
                setActiveView('synthesis')
              }}
              disabled={synthesizing || records.length === 0 || records.some(r => r.status === 'uploaded' || r.status === 'extracting')}
              className="w-full min-h-[40px] bg-white text-black font-mono text-[11px] font-semibold py-2.5 px-3 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-white/60 outline-none shadow-sm"
            >
              {synthesizing
                ? 'Traversing patient graph...'
                : records.some(r => r.status === 'uploaded' || r.status === 'extracting')
                ? 'Indexing into temporal memory...'
                : 'Synthesize Patient Graph'}
            </button>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex flex-1 overflow-y-auto flex-col min-w-0">
          {/* Mode Switcher Bar */}
          <div className="flex border-b border-border px-3 sm:px-8 py-2 sm:py-2.5 items-center justify-between bg-surface sticky top-0 z-10 shrink-0 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
              <button
                onClick={() => setActiveView('synthesis')}
                className={`flex-1 sm:flex-initial font-mono text-[11px] px-3 sm:px-3.5 py-1.5 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${
                  activeView === 'synthesis'
                    ? 'bg-accent text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised border border-border'
                }`}
              >
                <span>📋</span> Longitudinal Synthesis
              </button>
              <button
                onClick={() => setActiveView('query')}
                className={`flex-1 sm:flex-initial font-mono text-[11px] px-3 sm:px-3.5 py-1.5 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${
                  activeView === 'query'
                    ? 'bg-accent text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised border border-border'
                }`}
              >
                <span>🔍</span> <span className="hidden sm:inline">Temporal Memory</span> Query
                {queryHistory.length > 0 && (
                  <span className="ml-1 text-[9px] bg-background/20 px-1.5 py-0.2 rounded-full">
                    {queryHistory.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTimelineDrawerOpen(true)}
              className="md:hidden inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1.5 rounded border border-border bg-surface-raised text-muted-foreground hover:text-foreground shrink-0 touch-manipulation"
              title="Open clinical records timeline drawer"
            >
              <span>Clinical Records</span>
              <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {records.length}
              </span>
            </button>
          </div>

          {activeView === 'query' ? (
            <div className="px-4 sm:px-8 py-5 sm:py-6 max-w-3xl flex-1">
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] sm:text-[16px] font-semibold text-foreground">Temporal Memory Query</h2>
                  <span className="font-mono text-[9px] border border-accent/40 text-accent bg-accent-dim px-2 py-0.5 rounded">ZEP GRAPH MEMORY</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Query years of accumulated clinical records for {patient.name}. Facts, dose adjustments, and lab trajectories are resolved across time with interactive PaperTrail citations.
                </p>
              </div>

              {/* Query Input Box */}
              <div className="border border-border rounded-lg bg-surface-raised p-3.5 sm:p-4 mb-6 shadow-sm">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleRunQuery()
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder={`Ask a longitudinal question (e.g., "How has renal function trended across visits?", "Track all dose adjustments for Olanzapine")`}
                      disabled={queryRunning}
                      className="w-full bg-background border border-border rounded-md px-3.5 py-2.5 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] text-muted-foreground uppercase mr-1">Quick Prompts:</span>
                      {[
                        'Medication adjustments across timeline',
                        'Longitudinal lab trends & biomarkers',
                        'Cross-doctor prescription conflicts',
                        'Discontinued treatments & rationale',
                      ].map((promptText, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setQueryInput(promptText)
                            handleRunQuery(promptText)
                          }}
                          disabled={queryRunning}
                          className="font-mono text-[9px] border border-border bg-surface px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors disabled:opacity-50 touch-manipulation"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={queryRunning || !queryInput.trim()}
                      className="bg-accent text-background font-mono text-[11px] font-semibold px-4 py-2.5 sm:py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto ml-auto flex items-center justify-center gap-1.5 touch-manipulation"
                    >
                      {queryRunning ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
                          Traversing temporal memory...
                        </>
                      ) : (
                        'Query Graph Memory ↗'
                      )}
                    </button>
                  </div>
                </form>

                {queryError && (
                  <div className="mt-3 border border-alert/30 bg-alert-dim rounded px-3 py-2 text-[12px] text-alert">
                    {queryError}
                  </div>
                )}
              </div>

              {/* Query Running Progress */}
              {queryRunning && (
                <div className="border border-accent/20 bg-accent-dim rounded-md px-5 py-6 text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <p className="font-mono text-[11px] text-accent">Querying Zep graph memory &amp; verifying PaperTrail citations...</p>
                </div>
              )}

              {/* Query History Answers */}
              {queryHistory.length > 0 ? (
                <div className="space-y-6">
                  {queryHistory.map((item) => {
                    const claimsMap = item.claims.reduce<Record<string, Claim>>((acc, c) => {
                      if (c.claim_id) acc[c.claim_id] = c
                      return acc
                    }, {})

                    return (
                      <div key={item.id} className="border border-border rounded-lg bg-surface overflow-hidden">
                        <div className="bg-surface-raised px-4 py-2.5 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-accent font-bold">Q:</span>
                            <span className="text-[13px] font-semibold text-foreground">{item.question}</span>
                          </div>
                          <span className="font-mono text-[9px] text-muted-foreground">{item.timestamp}</span>
                        </div>
                        <div className="p-4 text-[13px] text-foreground leading-relaxed">
                          <ReactMarkdown
                            components={{
                              img: () => null,
                              h2: ({ children }) => (
                                <h2 className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mt-4 mb-2 pb-1 border-b border-border">
                                  {renderContentWithClaims(children, claimsMap, handleRecordClick, records)}
                                </h2>
                              ),
                              p: ({ children }) => (
                                <p className="text-[13px] text-foreground leading-relaxed mb-3">
                                  {renderContentWithClaims(children, claimsMap, handleRecordClick, records)}
                                </p>
                              ),
                              li: ({ children }) => (
                                <li className="flex items-baseline gap-2 text-[13px] text-foreground mb-1.5">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                  <span>{renderContentWithClaims(children, claimsMap, handleRecordClick, records)}</span>
                                </li>
                              ),
                              ul: ({ children }) => <ul className="list-none pl-0 my-2 space-y-0">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-[13px] text-foreground">{children}</ol>,
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">
                                  {renderContentWithClaims(children, claimsMap, handleRecordClick, records)}
                                </strong>
                              ),
                              code: ({ children }) => (
                                <code className="font-mono text-[11px] bg-surface-raised border border-border px-1.5 py-0.5 rounded text-accent">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {item.answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : !queryRunning && (
                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-2">No queries executed yet</p>
                  <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                    Type any clinical question above or select a quick prompt to query {patient.name}&apos;s temporal memory graph and clinical records timeline.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 relative">
              {/* Context Menu for Synthesis Tab Right-Click */}
              {contextMenu && (
                <div
                  style={{
                    position: 'fixed',
                    top: contextMenu.y,
                    left: contextMenu.x,
                    zIndex: 100,
                  }}
                  className="bg-surface-raised border border-border rounded-md shadow-xl py-1 min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const id = contextMenu.synthesisId
                      setContextMenu(null)
                      handleDeleteSynthesis(id)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-alert hover:bg-alert-dim hover:text-alert flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 3h9M4.5 3V2h3v1M3 3l.5 7.5h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete Synthesis
                  </button>
                </div>
              )}

              {syntheses.length > 0 && (
                <div className="border-b border-border px-6 py-2 flex items-center gap-2 overflow-x-auto">
                  {syntheses.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSynthesisId(s.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          synthesisId: s.id,
                        })
                      }}
                      title="Right-click for options"
                      className={`font-mono text-[10px] px-3 py-1.5 rounded border whitespace-nowrap transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                        s.id === activeSynthesisId
                          ? 'bg-accent-dim border-accent/40 text-accent font-semibold'
                          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      {s.status === 'complete' && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />}
                      {s.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0" />}
                      {(s.status === 'processing' || s.status === 'queued') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                      )}
                      <span>
                        LONGITUDINAL · {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeSynthesis ? (
                <div className="px-4 sm:px-8 py-5 sm:py-6 max-w-3xl">
                  <div className="flex items-start justify-between mb-5 gap-2">
                    <div>
                      <h2 className="text-[15px] sm:text-[16px] font-semibold text-foreground">
                        Longitudinal Clinical Synthesis
                      </h2>
                      <p className="font-mono text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Synthesized {new Date(activeSynthesis.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono text-[9px] px-2 py-0.5 sm:py-1 rounded border ${
                        activeSynthesis.status === 'complete' ? 'text-success border-success/30 bg-success-dim' :
                        activeSynthesis.status === 'processing' || activeSynthesis.status === 'queued' ? 'text-accent border-accent/30 bg-accent-dim' :
                        activeSynthesis.status === 'failed' ? 'text-alert border-alert/30 bg-alert-dim' : 'text-muted-foreground border-border'}`}>
                        {activeSynthesis.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {claimsArray.length > 0 && (
                    <div className="border border-border rounded-md bg-surface-raised p-3 sm:px-4 sm:py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] text-accent tracking-widest uppercase mb-0.5">PaperTrail</p>
                        <p className="font-mono text-[9px] text-muted-foreground">Every claim traced to source record</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:justify-end w-full sm:w-auto">
                        {supported > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success" /><span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">{supported} supported</span></div>}
                        {conflicting > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">{conflicting} conflicting</span></div>}
                        {absences > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">{absences} not documented</span></div>}
                        {partial > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-warning" /><span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">{partial} partial</span></div>}
                        {unsupported > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-alert" /><span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">{unsupported} unsupported</span></div>}
                      </div>
                    </div>
                  )}

                  {(activeSynthesis.status === 'processing' || activeSynthesis.status === 'queued') && (
                    <div className="border border-accent/20 bg-accent-dim rounded-md px-5 py-8 text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{animationDelay: '0.2s'}} />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{animationDelay: '0.4s'}} />
                      </div>
                      <p className="font-mono text-[11px] text-accent">Traversing temporal graph and synthesizing longitudinal clinical state...</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Streaming structured synthesis and binding PaperTrail citations.</p>
                    </div>
                  )}

                  {activeSynthesis.status === 'failed' && (
                    <div className="border border-alert/30 bg-alert-dim rounded-md px-4 py-3 mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] text-alert font-semibold mb-1">SYNTHESIS FAILED</p>
                        <p className="text-[12px] text-foreground">{activeSynthesis.error_message || 'Clinical synthesis encountered an issue. Please retry or delete this synthesis.'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSynthesis(activeSynthesis.id, e)}
                        className="font-mono text-[10px] px-2.5 py-1 rounded bg-alert text-background font-semibold hover:opacity-90 transition-opacity shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {activeSynthesis.synthesis_text && (
                    <div className="space-y-0">
                      {(() => {
                        const claimsMap = claimsArray.reduce<Record<string, Claim>>((acc, c) => {
                          if (c.claim_id) acc[c.claim_id] = c
                          return acc
                        }, {})

                        return (
                          <ReactMarkdown components={{
                            img: () => null,
                            h2: ({ children }) => <h2 className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mt-8 mb-3 pb-2 border-b border-border">{renderContentWithClaims(children, claimsMap, handleRecordClick, records)}</h2>,
                            p: ({ children }) => <p className="text-[13px] text-foreground leading-relaxed mb-4">{renderContentWithClaims(children, claimsMap, handleRecordClick, records)}</p>,
                            li: ({ children }) => (
                              <li className="flex items-baseline gap-2 text-[13px] text-foreground mb-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                <span>{renderContentWithClaims(children, claimsMap, handleRecordClick, records)}</span>
                              </li>
                            ),
                            ul: ({ children }) => <ul className="list-none pl-0 my-3 space-y-0">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1 text-[13px] text-foreground">{children}</ol>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{renderContentWithClaims(children, claimsMap, handleRecordClick, records)}</strong>,
                            code: ({ children }) => <code className="font-mono text-[11px] bg-surface-raised border border-border px-1.5 py-0.5 rounded text-accent">{children}</code>,
                          }}>{activeSynthesis.synthesis_text}</ReactMarkdown>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center px-8 py-16">
                  <div className="text-center max-w-sm">
                    <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase mb-3">Longitudinal Synthesis Not Yet Generated</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">Index clinical records into the timeline to build the patient&apos;s evolving temporal graph, then synthesize a longitudinal clinical synthesis.</p>
                    {records.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setIsTimelineDrawerOpen(true)}
                        className="md:hidden border border-border bg-surface-raised font-mono text-[11px] px-3.5 py-2 rounded text-foreground hover:border-accent/40 transition-colors mb-3 inline-flex items-center gap-1.5 touch-manipulation"
                      >
                        <span>📄</span> Open Timeline to Index Records
                      </button>
                    )}
                    {records.length > 0 && (
                      <button onClick={handleSynthesizePatientGraph} disabled={synthesizing} className="bg-accent text-background font-mono text-[11px] font-semibold px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                        {synthesizing ? 'Traversing patient graph...' : 'Synthesize Patient Graph'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
