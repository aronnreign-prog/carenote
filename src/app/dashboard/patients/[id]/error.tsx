'use client'

import { useEffect } from 'react'

export default function PatientGraphError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Patient Graph] Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-border bg-surface rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-border bg-surface-raised/40">
          <h2 className="text-[16px] font-semibold text-foreground">Unable to load patient graph</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            An error occurred while loading this patient&apos;s temporal graph and clinical timeline.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-alert-dim border border-alert/30 rounded-md p-3.5">
            <p className="text-[12px] text-alert font-mono break-words">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="w-full bg-accent text-background font-mono text-[11px] font-semibold py-2.5 px-4 rounded-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            Reload Patient Graph
          </button>
        </div>
      </div>
    </div>
  )
}
