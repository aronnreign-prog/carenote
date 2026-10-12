'use client'

import { useState } from 'react'
import { purgePatientGraph } from './actions'

export default function PurgePatientGraphButton({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const [purging, setPurging] = useState(false)

  const handlePurge = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Purge patient graph for ${patientName} and all associated clinical records and syntheses? This cannot be undone.`)) {
      return
    }
    setPurging(true)
    const res = await purgePatientGraph(patientId)
    if (res?.error) {
      alert(`Failed to purge patient graph: ${res.error}`)
      setPurging(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePurge}
      disabled={purging}
      title="Purge patient graph and all clinical records"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-alert hover:bg-alert-dim rounded cursor-pointer disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
        <path
          d="M1.5 3h9M4.5 3V2h3v1M3 3l.5 7.5h5L9 3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
