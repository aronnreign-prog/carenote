'use client'

import React, { useState } from 'react'
import type { ClinicalRecord } from '@/types/database'
import type { Claim, FlaggedConcern } from './types'
import { FlaggedBanner } from './flagged-banner'

const RK_CLINICAL_RECORDS: ClinicalRecord[] = [
  {
    id: 'rec-5',
    patient_id: 'rk-01',
    workspace_id: 'clinical-proof',
    filename: 'Outpatient_Labs_Mar2025.pdf',
    record_type: 'Lab Result',
    record_date: '2025-03-04',
    status: 'extracted',
    uploaded_at: '2025-03-04T09:15:00Z',
  },
  {
    id: 'rec-4',
    patient_id: 'rk-01',
    workspace_id: 'clinical-proof',
    filename: 'Hospital_Discharge_Jan2025.pdf',
    record_type: 'Discharge Summary',
    record_date: '2025-01-18',
    status: 'extracted',
    uploaded_at: '2025-01-18T16:40:00Z',
  },
  {
    id: 'rec-3',
    patient_id: 'rk-01',
    workspace_id: 'clinical-proof',
    filename: 'Echo_Cardio_Nov2024.pdf',
    record_type: 'Diagnostic Report',
    record_date: '2024-11-25',
    status: 'extracted',
    uploaded_at: '2024-11-25T11:20:00Z',
  },
  {
    id: 'rec-2',
    patient_id: 'rk-01',
    workspace_id: 'clinical-proof',
    filename: 'UrgentCare_Nov2024.pdf',
    record_type: 'Clinic Note',
    record_date: '2024-11-19',
    status: 'extracted',
    uploaded_at: '2024-11-19T14:30:00Z',
  },
  {
    id: 'rec-1',
    patient_id: 'rk-01',
    workspace_id: 'clinical-proof',
    filename: 'PCP_Annual_Oct2024.pdf',
    record_type: 'Clinic Note',
    record_date: '2024-10-14',
    status: 'extracted',
    uploaded_at: '2024-10-14T10:00:00Z',
  },
]

const RK_CLAIMS: Record<string, Claim> = {
  c1: {
    claim_id: 'c1',
    claim_text: 'Amlodipine 10 mg daily initiated at Primary Care on 2024-10-14 alongside baseline Losartan 50 mg and Empagliflozin 10 mg',
    claim_type: 'source_record',
    flag: 'SUPPORTED',
    evidence: {
      source_record_id: 'rec-1',
      source_quote: 'Assessment/Plan: Home BP 148/82. Start Tab Amlodipine 10 mg PO QD. Continue Losartan 50 mg QD and Empagliflozin 10 mg QD (baseline eGFR 64, Cr 1.10 mg/dL, K+ 4.3 mEq/L).',
      source_page: 2,
    },
  },
  c2: {
    claim_id: 'c2',
    claim_text: 'Bilateral pedal edema 5 weeks post-Amlodipine attributed to suspected new-onset HFpEF at Urgent Care; Furosemide 40 mg daily initiated',
    claim_type: 'source_record',
    flag: 'SUPPORTED',
    evidence: {
      source_record_id: 'rec-2',
      source_quote: 'Impression: New bilateral lower-extremity pitting ankle edema: suspect new-onset Heart Failure (HFpEF). Start Furosemide 40 mg PO QD; order outpatient TTE and NT-proBNP.',
      source_page: 1,
    },
  },
  c3: {
    claim_id: 'c3',
    claim_text: 'Chart Lore Refuted: Copy-forwarded "HFpEF" diagnosis is directly contradicted by normal Transthoracic Echocardiogram (LVEF 62%, normal E/e\') and normal NT-proBNP (58 pg/mL)',
    claim_type: 'source_record',
    flag: 'CONFLICTING',
    evidence: {
      source_record_id: 'rec-3',
      source_quote: 'TTE & Biomarker Conclusion: LVEF 62%, normal LV diastolic filling (E/e\' 7.2), normal LA volume, NT-proBNP 58 pg/mL (ref <125). No evidence of heart failure; ankle edema consistent with dihydropyridine CCB vasodilation.',
      source_page: 2,
    },
  },
  c4: {
    claim_id: 'c4',
    claim_text: 'Prescribing Cascade Mechanism: Dihydropyridine CCB vasodilatory edema is non-cardiogenic; adding loop diuretics in euvolemic patients precipitates intravascular volume depletion, prerenal AKI, and hypokalemia',
    claim_type: 'medical_knowledge',
    flag: 'MEDICAL_KNOWLEDGE',
    evidence: {
      entry_text:
        'Rochon & Gurwitz Prescribing Cascade Framework (BMJ 1997; JAMA Intern Med 2020): Amlodipine causes pre-capillary arteriolar vasodilation without venodilation, producing dependent ankle edema unresponsive to loop diuresis. Prescribing Furosemide for CCB edema depletes intravascular volume, triggering prerenal acute kidney injury and hypokalemia.',
    },
  },
  c5: {
    claim_id: 'c5',
    claim_text: 'Hospital admission for prerenal AKI (eGFR 64 → 36 mL/min, Cr 1.9 mg/dL) and hypokalemia (K+ 3.1 mEq/L); KCl 20 mEq added and Empagliflozin 10 mg placed on conditional hold until Cr <1.2 mg/dL',
    claim_type: 'source_record',
    flag: 'SUPPORTED',
    evidence: {
      source_record_id: 'rec-4',
      source_quote: 'Discharge Plan: Admitted for orthostatic syncope, prerenal AKI (Cr 1.9 mg/dL, eGFR 36) & hypokalemia (K+ 3.1). Start Potassium Chloride 20 mEq PO QD. HOLD Empagliflozin 10 mg during acute AKI; resume at outpatient follow-up once serum Cr returns to <1.2 mg/dL.',
      source_page: 3,
    },
  },
  c6: {
    claim_id: 'c6',
    claim_text: 'Unclosed Therapeutic Hold: Serum creatinine recovered to 1.12 mg/dL (eGFR 61 mL/min) on 2025-03-04, meeting the <1.2 mg/dL discharge resumption threshold, yet nephroprotective Empagliflozin 10 mg has not been resumed',
    claim_type: 'notable_absence',
    flag: 'SUPPORTED',
    evidence: {
      source_record_id: 'rec-5',
      source_quote: 'Renal Panel (2025-03-04): Serum Creatinine 1.12 mg/dL (ref: 0.7-1.3) | eGFR 61 mL/min/1.73m2 | Serum Potassium 4.2 mEq/L. [Graph Audit: Conditional resumption criterion (Cr <1.2 mg/dL) met; zero resumption order for Empagliflozin 10 mg documented].',
      source_page: 1,
    },
  },
}

const RK_CONCERNS: FlaggedConcern[] = [
  {
    severity: 'high',
    concern: 'Active 3-Drug Prescribing Cascade & Chart Lore: Furosemide 40 mg + KCl 20 mEq ongoing for copy-forwarded "HFpEF" despite normal Echo/NT-proBNP (#p.2), triggered by Amlodipine 10 mg vasodilatory edema.',
  },
  {
    severity: 'high',
    concern: 'Unclosed Post-Discharge Hold (notable_absence): Temporary AKI hold on Empagliflozin 10 mg (#p.3) never closed despite renal recovery to baseline (Cr 1.12 mg/dL on 2025-03-04, #p.1).',
  },
]

export function HeroClinicalProof() {
  const [selectedClaimId, setSelectedClaimId] = useState<string>('c3')

  const selectedClaim = RK_CLAIMS[selectedClaimId] || RK_CLAIMS.c3
  const evidence = Array.isArray(selectedClaim.evidence)
    ? selectedClaim.evidence[0]
    : selectedClaim.evidence
  const sourceRecord = evidence?.source_record_id
    ? RK_CLINICAL_RECORDS.find((r) => r.id === evidence.source_record_id)
    : undefined

  const handleSelectClaim = (id: string) => {
    setSelectedClaimId(id)
  }

  return (
    <div className="text-left">
      <p className="mb-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
        Fictional, hard-coded demonstration scenario. Not a real patient, a live CareNote synthesis, or evidence of clinical performance. The displayed record labels and page references are illustrative placeholders.
      </p>
      <div className="border border-[#1F2937] rounded-xl bg-[#0D1117] shadow-2xl overflow-hidden">
      {/* Dossier Bar */}
      <div className="border-b border-[#1F2937] bg-[#0A0E14] px-4 py-3 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center font-mono text-[11px] font-semibold text-white">
            RK
          </div>
          <div>
            <span className="text-white font-semibold">Patient R.K.</span>
            <span className="font-mono text-[10px] text-slate-400 ml-2">74y · Male · 5 Clinical Records Indexed (2024–2025)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            3 supported
          </span>
          <span className="font-mono text-[9px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            1 conflicting
          </span>
          <span className="font-mono text-[9px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
            1 not documented
          </span>
          <span className="font-mono text-[10px] text-white/70 bg-white/[0.06] px-2.5 py-0.5 rounded border border-white/10 tracking-wider">
            SYNTHETIC DEMONSTRATION
          </span>
        </div>
      </div>

      {/* Flagged Alert Banner */}
      <FlaggedBanner concerns={RK_CONCERNS} />

      {/* Main Verification Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1F2937]">
        {/* Left Column: Longitudinal Synthesis Narrative & Regimen */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-6 bg-[#0D1117]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Longitudinal Clinical Synthesis · PaperTrail Verified
              </h3>
              <span className="font-mono text-[9px] text-slate-500">
                Click any citation badge to inspect source
              </span>
            </div>

            <p className="text-[13px] text-slate-200 leading-relaxed mb-3.5">
              Five weeks after Primary Care initiated{' '}
              <strong className="text-white font-medium">Amlodipine 10 mg daily</strong>{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c1')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                  selectedClaimId === 'c1'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/20 ring-1 ring-teal-400'
                    : 'border-teal-500/40 text-teal-400 bg-teal-500/10 hover:border-teal-400 hover:bg-teal-500/20'
                }`}
                title="Click to view Primary Care clinic note"
              >
                ↗ PCP Note · 14 Oct 24 · p.2
              </button>
              , Patient R.K. developed bilateral ankle edema that Urgent Care misattributed to new-onset heart failure (&ldquo;HFpEF&rdquo;) and treated with{' '}
              <strong className="text-white font-medium">Furosemide 40 mg daily</strong>{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c2')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                  selectedClaimId === 'c2'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/20 ring-1 ring-teal-400'
                    : 'border-teal-500/40 text-teal-400 bg-teal-500/10 hover:border-teal-400 hover:bg-teal-500/20'
                }`}
                title="Click to view Urgent Care note"
              >
                ↗ Urgent Care · 19 Nov 24 · p.1
              </button>
              . Although confirmatory echocardiography and NT-proBNP (58 pg/mL, LVEF 62%) ruled out heart failure 6 days later, the unverified &ldquo;HFpEF&rdquo; label was copy-pasted forward across subsequent encounters{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c3')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                  selectedClaimId === 'c3'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/20 ring-1 ring-amber-400'
                    : 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20'
                }`}
                title="Click to inspect Chart Lore conflict against Echo report"
              >
                ⚡ Conflicting · Echo p.2
              </button>
              .
            </p>

            <p className="text-[13px] text-slate-200 leading-relaxed">
              Unnecessary loop diuresis for dihydropyridine CCB vasodilatory edema{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c4')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                  selectedClaimId === 'c4'
                    ? 'border-amber-400 text-amber-300 bg-amber-500/20 ring-1 ring-amber-400'
                    : 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20'
                }`}
                title="Click to view Prescribing Cascade pharmacology"
              >
                ⚠ Medical Knowledge
              </button>{' '}
              precipitated orthostatic syncope, prerenal AKI (<strong className="text-white font-medium">eGFR 64 → 36 mL/min</strong>), and hypokalemia (<strong className="text-white font-medium">K+ 3.1 mEq/L</strong>), prompting inpatient addition of{' '}
              <strong className="text-white font-medium">KCl 20 mEq</strong> and a conditional hold on{' '}
              <strong className="text-white font-medium">Empagliflozin 10 mg</strong> until Cr &lt;1.2 mg/dL{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c5')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                  selectedClaimId === 'c5'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/20 ring-1 ring-teal-400'
                    : 'border-teal-500/40 text-teal-400 bg-teal-500/10 hover:border-teal-400 hover:bg-teal-500/20'
                }`}
                title="Click to view Hospital Discharge Summary"
              >
                ↗ Discharge · 18 Jan 25 · p.3
              </button>
              . Despite creatinine recovering to <strong className="text-white font-medium">1.12 mg/dL</strong> on 04 Mar 2025, Empagliflozin remains unresumed{' '}
              <button
                type="button"
                onClick={() => handleSelectClaim('c6')}
                className={`inline-flex items-center gap-1 font-mono text-[10px] border rounded px-1.5 py-0.5 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-purple-400 ${
                  selectedClaimId === 'c6'
                    ? 'border-purple-400 text-purple-200 bg-purple-500/20 ring-1 ring-purple-400'
                    : 'border-purple-500/50 text-purple-300 bg-purple-500/10 hover:border-purple-400 hover:bg-purple-500/20'
                }`}
                title="Click to inspect unclosed post-discharge hold"
              >
                ∅ Not Documented · Lab p.1
              </button>
              .
            </p>
          </div>

          {/* Reconciled Regimen & Causal State Machine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Reconciled Causal Regimen &amp; Loop State
              </h4>
              <span className="font-mono text-[9px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">
                Multi-Hop Graph State
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectClaim('c3')}
                className={`w-full text-left flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                  selectedClaimId === 'c3'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-[#0A0E14] border-[#1F2937] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shrink-0">
                    CHART LORE · CASCADE
                  </span>
                  <span className="text-[12px] text-white truncate">
                    Furosemide 40 mg + KCl 20 mEq (for refuted &ldquo;HFpEF&rdquo;)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber-400 shrink-0 ml-2">
                  ⚡ Echo · p.2
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectClaim('c6')}
                className={`w-full text-left flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-purple-400 ${
                  selectedClaimId === 'c6'
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-[#0A0E14] border-[#1F2937] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 shrink-0">
                    UNCLOSED HOLD
                  </span>
                  <span className="text-[12px] text-white truncate">
                    Empagliflozin 10 mg (held until Cr &lt;1.2; Cr now 1.12)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-purple-300 shrink-0 ml-2">
                  ∅ Lab · p.1
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectClaim('c1')}
                className={`w-full text-left flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                  selectedClaimId === 'c1'
                    ? 'bg-teal-500/10 border-teal-500/40'
                    : 'bg-[#0A0E14] border-[#1F2937] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30 shrink-0">
                    CASCADE ORIGIN
                  </span>
                  <span className="text-[12px] text-white truncate">
                    Amlodipine 10 mg daily (initiated 5 wks prior to edema)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-teal-400 shrink-0 ml-2">
                  ↗ PCP Note · p.2
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: The PaperTrail Inspector */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-[#0A0E14] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-3.5">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-teal-400 uppercase">
                  PaperTrail Inspector
                </p>
                <p className="font-mono text-[9px] text-slate-400">
                  Zero blind trust · Exact source anchor
                </p>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-[#1F2937] bg-[#0D1117] text-slate-300">
                Claim #{selectedClaimId}
              </span>
            </div>

            {selectedClaim.flag === 'MEDICAL_KNOWLEDGE' ? (
              <div className="border border-amber-500/30 rounded-lg bg-[#0D1117] p-4 space-y-3 shadow-sm">
                <div className="border-b border-amber-500/20 pb-2">
                  <p className="text-[12px] font-semibold text-amber-300">
                    Prescribing Cascade Pharmacology
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Rochon &amp; Gurwitz Framework · Clinical Pharmacology
                  </p>
                </div>
                <blockquote className="p-3 rounded-md border border-amber-500/30 bg-amber-500/10 text-[12px] text-slate-200 leading-relaxed font-sans">
                  {evidence?.entry_text || selectedClaim.claim_text}
                </blockquote>
                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Epistemic Class:</span>
                  <span className="text-amber-300 font-medium">⚠ MEDICAL_KNOWLEDGE</span>
                </div>
              </div>
            ) : selectedClaim.flag === 'CONFLICTING' && sourceRecord ? (
              <div className="border border-amber-500/40 rounded-lg bg-[#0D1117] p-4 space-y-3.5 shadow-sm">
                <div className="border-b border-[#1F2937] pb-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {sourceRecord.filename}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {sourceRecord.record_type} · {sourceRecord.record_date}
                    </p>
                  </div>
                  {evidence?.source_page && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                      Page {evidence.source_page}
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[9px] text-amber-300 uppercase tracking-wider mb-1">
                    Cross-Record Contradiction (Chart Lore vs. Echo):
                  </p>
                  <blockquote className="p-3 rounded-md border border-amber-500/30 bg-amber-500/10 font-mono text-[11px] text-slate-200">
                    &ldquo;{evidence?.source_quote || selectedClaim.claim_text}&rdquo;
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    ⚡ CONFLICTING (CHART LORE)
                  </span>
                </div>
              </div>
            ) : selectedClaim.claim_type === 'notable_absence' && sourceRecord ? (
              <div className="border border-purple-500/40 rounded-lg bg-[#0D1117] p-4 space-y-3.5 shadow-sm">
                <div className="border-b border-[#1F2937] pb-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {sourceRecord.filename}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {sourceRecord.record_type} · {sourceRecord.record_date}
                    </p>
                  </div>
                  {evidence?.source_page && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 shrink-0">
                      Page {evidence.source_page}
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[9px] text-purple-300 uppercase tracking-wider mb-1">
                    Unclosed Conditional Therapeutic Loop:
                  </p>
                  <blockquote className="p-3 rounded-md border border-purple-500/30 bg-purple-500/10 font-mono text-[11px] text-slate-200">
                    &ldquo;{evidence?.source_quote || selectedClaim.claim_text}&rdquo;
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className="text-purple-300 flex items-center gap-1 font-medium">
                    ∅ NOT DOCUMENTED (UNCLOSED HOLD)
                  </span>
                </div>
              </div>
            ) : sourceRecord ? (
              <div className="border border-[#1F2937] rounded-lg bg-[#0D1117] p-4 space-y-3.5 shadow-sm">
                <div className="border-b border-[#1F2937] pb-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {sourceRecord.filename}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {sourceRecord.record_type} · {sourceRecord.record_date}
                    </p>
                  </div>
                  {evidence?.source_page && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 shrink-0">
                      Page {evidence.source_page}
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                    Verbatim Record Excerpt:
                  </p>
                  <blockquote className="p-3 rounded-md border border-teal-500/30 bg-teal-500/5 font-mono text-[11px] text-slate-200">
                    &ldquo;{evidence?.source_quote || selectedClaim.claim_text}&rdquo;
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Demonstration label
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-3.5 rounded-lg border border-[#1F2937] bg-[#0D1117] text-[11px] text-slate-400 leading-relaxed">
            This fictional demonstration illustrates a proposed review pattern. It does not show a live CareNote result, prove a causal relationship, or establish that the system reliably detects contradictions or unresolved holds.
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
