'use client'

import React, { useState, useEffect, useCallback, useId } from 'react'
import { submitDemoRequest } from '@/app/actions/demo'
import { Logo } from '@/components/ui/Logo'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'

export interface DemoRequestModalProps {
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Global helper to trigger the Demo Request Modal from anywhere
 */
export function openDemoModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('carenote:open-demo-modal'))
  }
}

/**
 * Clickable trigger button that opens the Demo Request Modal
 */
export function DemoRequestTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={() => openDemoModal()}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Clinical Dark "Request Demo Access" Interactive Modal
 */
export function DemoRequestModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: DemoRequestModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [useCase, setUseCase] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalOpen

  const titleId = useId()
  const descId = useId()

  const handleClose = useCallback(() => {
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setInternalOpen(false)
    }
  }, [isControlled, controlledOnClose])

  const handleReset = useCallback(() => {
    setName('')
    setEmail('')
    setRole('')
    setOrganization('')
    setUseCase('')
    setError(null)
    setSuccess(false)
  }, [])

  // Listen to custom open event and hash updates
  useEffect(() => {
    const handleOpenEvent = () => {
      setInternalOpen(true)
    }

    const handleHash = () => {
      if (
        window.location.hash === '#demo' ||
        window.location.hash === '#demo-request'
      ) {
        setInternalOpen(true)
      }
    }

    window.addEventListener('carenote:open-demo-modal', handleOpenEvent)
    window.addEventListener('hashchange', handleHash)

    if (window.location.hash === '#demo' || window.location.hash === '#demo-request') {
      setInternalOpen(true)
    }

    return () => {
      window.removeEventListener('carenote:open-demo-modal', handleOpenEvent)
      window.removeEventListener('hashchange', handleHash)
    }
  }, [])

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      if (role.trim()) formData.append('role', role.trim())
      if (organization.trim()) formData.append('organization', organization.trim())
      if (useCase.trim()) formData.append('useCase', useCase.trim())

      const result = await submitDemoRequest(formData)

      if ('error' in result && result.error) {
        setError(result.error)
      } else if ('success' in result && result.success) {
        setSuccess(true)
      } else {
        setError('Failed to submit demo request. Please try again.')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop overlay */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-[#0A0E14]/85 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-[#0D1117] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden my-auto text-[#EDEDED] z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Subtle clinical accent top border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent shrink-0" />

        <div className="p-5 sm:p-7 overflow-y-auto">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {success ? (
            /* Confirmation State */
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <h3
                id={titleId}
                className="text-xl sm:text-2xl font-semibold text-white tracking-tight"
              >
                Demo Access Request Received
              </h3>

              <p
                id={descId}
                className="text-[13px] text-white/70 leading-relaxed max-w-md mx-auto mt-2.5 mb-6"
              >
                Access is provisioned in curated batches to protect compute quotas. We will review
                your clinical workspace request and deliver your credentials directly to your inbox.
              </p>

              <div className="bg-[#0A0E14] border border-[#1F2937] rounded-lg p-4 mb-6 text-left space-y-2.5 text-[12px]">
                <div className="flex items-center justify-between text-white/50">
                  <span>Workspace Account:</span>
                  <span className="text-white font-medium truncate max-w-[220px]">
                    {email}
                  </span>
                </div>
                {role.trim() && (
                  <div className="flex items-center justify-between text-white/50">
                    <span>Clinical Role:</span>
                    <span className="text-emerald-400 font-medium truncate max-w-[220px]">
                      {role}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-white/50">
                  <span>Review Status:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Priority Review Queue
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleReset()
                  handleClose()
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-white text-black font-medium text-[13px] hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 outline-none transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* Request Form State */
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <Logo size={24} priority />
                  <h3
                    id={titleId}
                    className="text-xl sm:text-2xl font-semibold text-white tracking-tight"
                  >
                    Request Demo Access
                  </h3>
                </div>
                <p id={descId} className="text-[13px] text-white/65 leading-relaxed mt-1.5">
                  Experience persistent patient knowledge graphs and source-grounded clinical syntheses with clickable PaperTrail citations.
                </p>
              </div>

              {/* Inline Error Alert Box */}
              {error && (
                <div
                  aria-live="polite"
                  className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-[12px] flex items-start gap-2.5 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Contact Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="demo-name"
                      className="block text-[12px] font-medium text-white/80 mb-1.5"
                    >
                      Full Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      id="demo-name"
                      type="text"
                      required
                      maxLength={100}
                      autoComplete="name"
                      autoCapitalize="words"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[40px] bg-[#0A0E14] border border-[#1F2937] focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="demo-email"
                      className="block text-[12px] font-medium text-white/80 mb-1.5"
                    >
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      id="demo-email"
                      type="email"
                      required
                      maxLength={255}
                      autoComplete="email"
                      spellCheck={false}
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@institution.org"
                      className="w-full min-h-[40px] bg-[#0A0E14] border border-[#1F2937] focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Role & Institution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="demo-role"
                      className="block text-[12px] font-medium text-white/80 mb-1.5"
                    >
                      Clinical Role / Perspective{' '}
                      <span className="text-white/40 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      id="demo-role"
                      type="text"
                      maxLength={100}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Nephrologist, Care Coordinator"
                      className="w-full min-h-[40px] bg-[#0A0E14] border border-[#1F2937] focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="demo-organization"
                      className="block text-[12px] font-medium text-white/80 mb-1.5"
                    >
                      Institution / Practice{' '}
                      <span className="text-white/40 text-[11px] font-normal">(Optional)</span>
                    </label>
                    <input
                      id="demo-organization"
                      type="text"
                      maxLength={200}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Subspecialty Clinic, Health System"
                      className="w-full min-h-[40px] bg-[#0A0E14] border border-[#1F2937] focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Clinical Synthesis Context */}
                <div>
                  <label
                    htmlFor="demo-usecase"
                    className="block text-[12px] font-medium text-white/80 mb-1.5"
                  >
                    Clinical Records &amp; Synthesis Context{' '}
                    <span className="text-white/40 text-[11px] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="demo-usecase"
                    rows={3}
                    maxLength={2000}
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="Describe the clinical encounter records or longitudinal trajectories you are synthesizing (e.g. multi-provider consult notes, serial lab panels, discharge medication reconciliation)..."
                    className="w-full bg-[#0A0E14] border border-[#1F2937] focus:border-white/40 focus:ring-1 focus:ring-white/30 rounded-lg px-3.5 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* 4. Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-white text-black font-medium text-[13px] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Request Demo Access</span>
                        <Sparkles className="w-3.5 h-3.5 opacity-70" />
                      </span>
                    )}
                  </button>
                </div>

                {/* Privacy & Quota Note */}
                <p className="text-[11px] text-white/40 text-center leading-relaxed">
                  Access is provisioned in curated batches to protect compute quotas. Invitations are delivered via email.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
