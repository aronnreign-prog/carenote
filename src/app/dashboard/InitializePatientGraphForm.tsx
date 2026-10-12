'use client'

import { useState } from 'react'
import { initializePatientGraph } from './actions'

export default function InitializePatientGraphForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await initializePatientGraph(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto bg-white text-black font-mono text-[11px] font-semibold px-3.5 py-2.5 sm:py-2 rounded-lg hover:bg-white/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation focus-visible:ring-2 focus-visible:ring-white/60 outline-none shadow-sm"
      >
        + Initialize Patient Graph
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">New Patient Graph</p>
                <h2 className="text-[16px] font-semibold text-foreground mt-0.5">Initialize Patient Record</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground font-mono text-xs">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase block mb-1.5">Full Name</label>
                <input
                  name="name"
                  required
                  placeholder="Patient R.K."
                  className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-[16px] sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase block mb-1.5">Date of Birth</label>
                <input
                  name="date_of_birth"
                  type="date"
                  required
                  className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-[16px] sm:text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase block mb-1.5">Biological Sex</label>
                <select
                  name="biological_sex"
                  required
                  defaultValue=""
                  className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-[16px] sm:text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>Select biological sex...</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Intersex / Other">Intersex / Other</option>
                </select>
              </div>

              {error && (
                <div className="border border-alert/30 bg-alert-dim rounded px-3 py-2">
                  <p className="font-mono text-[11px] text-alert">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 min-h-[40px] border border-border font-mono text-[11px] text-muted-foreground py-2 rounded-lg hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[40px] bg-white text-black font-mono text-[11px] font-semibold py-2 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-white/60 outline-none shadow-sm"
                >
                  {loading ? 'Initializing...' : 'Initialize Graph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
