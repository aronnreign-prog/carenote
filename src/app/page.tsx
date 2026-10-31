import Link from 'next/link'
import type { Metadata } from 'next'
import { HeroClinicalProof } from '@/components/clinical'
import { DemoRequestModal, DemoRequestTrigger } from '@/components/marketing/DemoRequestModal'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'CareNote: Longitudinal Clinical Memory & Verifiable PaperTrail Synthesis',
  description:
    'CareNote is a research-stage prototype testing whether patient-specific graph memory helps reviewers reconstruct changing clinical state across fragmented records. It has no external pilot proof or clinical outcome evidence.',
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0A0E14] text-[#EDEDED] font-sans antialiased selection:bg-white/20 selection:text-white">
      {/* ━━━ Header ━━━ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0E14]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={22} priority />
            <span className="text-[13px] font-semibold tracking-tight text-white">
              CareNote
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/clinical-record-synthesis"
              className="text-[12px] text-white/60 hover:text-white transition-colors hidden sm:inline-block"
            >
              Synthesis vs. Summarization
            </Link>
            <DemoRequestTrigger
              className="text-[12px] font-medium bg-white text-black px-3.5 py-1.5 rounded hover:bg-white/90 transition-colors cursor-pointer"
            >
              Register for Demo
            </DemoRequestTrigger>
          </div>
        </div>
      </header>

      {/* ━━━ Hero Section: The Two Real Bets ━━━ */}
      <section className="relative pt-20 pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl mb-12">
            <h1 className="text-[38px] sm:text-[54px] font-semibold tracking-[-0.03em] leading-[1.1] text-white mb-5 text-balance">
              Medical history isn&apos;t a text chunk. <br />
              <span className="text-white/45">It&apos;s an evolving graph.</span>
            </h1>

            <p className="text-[17px] sm:text-[19px] text-white/65 leading-relaxed max-w-2xl mb-8">
              CareNote is a research-stage prototype testing whether a patient-specific graph helps reviewers reconstruct changing clinical state across fragmented records. Source record and page anchors are inspectable when available, but the system has not been clinically validated.
            </p>

            <div className="flex items-center gap-3">
              <DemoRequestTrigger
                className="text-[13px] font-medium bg-white text-black px-5 py-2.5 rounded hover:bg-white/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
              >
                Register for Demo Access
              </DemoRequestTrigger>
              <a
                href="#proof"
                className="text-[13px] text-white/70 border border-white/[0.12] bg-white/[0.02] px-5 py-2.5 rounded hover:text-white hover:border-white/30 transition-colors focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
              >
                Inspect Synthetic Demo ↓
              </a>
            </div>
          </div>

          {/* ━━━ Fictional Interface Demonstration ━━━ */}
          <div id="proof" className="scroll-mt-20">
            <HeroClinicalProof />
          </div>
        </div>
      </section>

      {/* ━━━ Research Question: Graph Memory and Document Search ━━━ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3 text-balance">
              Does graph memory help preserve context across encounters?
            </h2>
            <p className="text-[15px] sm:text-[16px] text-white/65 leading-[1.65] max-w-[65ch]">
              CareNote is exploring whether a patient-specific graph helps reviewers inspect dated records, changing states, and relationships across encounters. We have not yet measured whether it improves on ordinary document search or other clinical AI systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Old Way */}
            <div className="border border-white/[0.08] rounded-xl bg-white/[0.01] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-white/90 mb-2">
                  What a document-search approach may leave to the reviewer
                </h3>
                <p className="text-[13px] text-white/60 leading-[1.6] mb-6">
                  Search results may require reviewers to reconcile dates, status changes, contradictions, and source material across records. The extent of this challenge depends on the system and workflow.
                </p>

                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2 text-[12px] text-white/60">
                  <p className="text-white/80">&quot;Pedal edema: suspect HFpEF; start Furosemide 40mg&quot;</p>
                  <p className="text-white/80">&quot;PMH: HFpEF. K+ 3.1; start KCl 20mEq. Hold Empagliflozin&quot;</p>
                  <p className="text-white/80">&quot;LVEF 62%, NT-proBNP 58 pg/mL: no heart failure&quot;</p>
                </div>
                <p className="mt-2 text-[11px] text-amber-200/80">Illustrative excerpts from a fictional scenario, not retrieved product output.</p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] text-[12px] text-red-300/90 leading-relaxed">
                Illustrative document-search scenario, not a measured result from another product.
              </div>
            </div>

            {/* CareNote Way */}
            <div className="border border-emerald-500/30 rounded-xl bg-emerald-500/[0.02] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-white mb-2">
                  What CareNote currently implements
                </h3>
                <p className="text-[13px] text-white/70 leading-[1.6] mb-6">
                  Indexes PDF-derived facts into patient-specific graph memory and retrieves entities, dated episodes, and temporal relationships. Whether this reliably reconstructs state or adds value remains to be evaluated.
                </p>

                <div className="p-3.5 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/20 space-y-2 text-[12px] text-white/80">
                  <p className="text-white/80">Authored relationship: Amlodipine → edema → Furosemide → KCl</p>
                  <p className="text-white/80">Authored conflict: &quot;HFpEF&quot; label vs. normal echo/BNP (#p.2)</p>
                  <p className="text-white font-medium">Authored unresolved state: Empagliflozin hold after Cr recovery</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-emerald-500/20 text-[12px] text-emerald-300/90 leading-relaxed">
                Authored demonstration only. It does not show that CareNote detected these relationships in real records or that its interpretation is clinically accurate.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Bet 2: The PaperTrail Verification ━━━ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3 text-balance">
              Source anchors make claims easier to inspect, not automatically true.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-white/65 leading-[1.65] max-w-[65ch]">
              Source and page anchors can help a reviewer inspect a generated statement. They do not prove that the source was interpreted correctly, that a quotation entails a claim, or that important records were not missed.
            </p>
          </div>

          <div className="border border-white/[0.08] rounded-xl bg-[#0F141C] p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white">1. Fact Extraction</div>
                <p className="text-[13px] text-white/60 leading-[1.6]">
                  The current pipeline sends PDFs to a multimodal model and requests structured facts, including values, units, reference intervals, and page numbers when available.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white">2. Graph Synthesis</div>
                <p className="text-[13px] text-white/60 leading-[1.6]">
                  Extracted facts are serialized into graph episodes and combined with graph search results for synthesis. Accuracy and reviewer value remain to be evaluated.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white">3. Direct Audit Trail</div>
                <p className="text-[13px] text-white/60 leading-[1.6]">
                  PaperTrail renders source record and page anchors when supplied. A structural check tests claim-marker and anchor alignment, not semantic support or clinical correctness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Interactive Record Query ━━━ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3 text-balance">
                Query longitudinal clinical memory in plain language.
              </h2>
              <p className="text-[15px] sm:text-[16px] text-white/65 leading-[1.65] mb-6 max-w-[50ch]">
                CareNote queries accumulated clinical-record graph memory and renders source anchors when available. A structural check verifies marker and record/page alignment, but not whether a claim is clinically correct or semantically supported.
              </p>

              <div className="space-y-2.5 text-[13px] text-white/80">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  &ldquo;Why was Furosemide started, and did the echocardiogram ever confirm heart failure?&rdquo;
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  &ldquo;Is there a prescribing cascade behind his Jan 2025 AKI and potassium supplement?&rdquo;
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-colors">
                  &ldquo;Were any home medications held during admission that meet criteria to resume?&rdquo;
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 border border-white/[0.08] rounded-xl bg-[#0F141C] p-6">
              <div className="pb-3 border-b border-white/[0.08] mb-4 text-[11px] text-white/50 font-semibold flex items-center justify-between">
                <span>Illustrative Query Output · Patient R.K.</span>
                <span className="text-emerald-400">Synthetic demonstration</span>
              </div>

              <div className="space-y-3 text-[12px]">
                <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-white/50 font-mono text-[11px]">
                  User: &quot;Why was Furosemide started, and did the echo confirm heart failure?&quot;
                </div>
                <div className="p-4 rounded bg-black/20 border border-white/[0.06] space-y-2.5 leading-relaxed">
                  <p className="text-white font-medium">
                    Synthetic example only: this authored scenario illustrates how a reviewer might inspect an alleged medication sequence:
                  </p>
                  <ul className="space-y-2 list-disc pl-4 text-white/80">
                    <li>
                      <span className="text-white font-medium">Cascade Origin:</span> Bilateral ankle edema began 5 weeks after starting{' '}
                      <span className="text-white font-medium">Amlodipine 10 mg daily</span>{' '}
                      <span className="font-mono text-[10px] bg-white/10 text-white/90 px-1 py-0.5 rounded border border-white/15">
                        PCP_Annual_Oct2024.pdf #p.2
                      </span>
                      , and Urgent Care started <span className="text-white font-medium">Furosemide 40 mg</span> for suspected &ldquo;HFpEF&rdquo;{' '}
                      <span className="font-mono text-[10px] bg-white/10 text-white/90 px-1 py-0.5 rounded border border-white/15">
                        UrgentCare_Nov2024.pdf #p.1
                      </span>
                      .
                    </li>
                    <li>
                      <span className="text-white font-medium">Chart Lore Refuted:</span> Confirmatory TTE &amp; biomarker 6 days later showed <span className="text-white font-medium">LVEF 62%, normal diastolic filling, and NT-proBNP 58 pg/mL</span> (no heart failure){' '}
                      <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded border border-amber-500/30">
                        ⚡ Echo_Cardio_Nov2024.pdf #p.2
                      </span>
                      .
                    </li>
                    <li>
                      <span className="text-white font-medium">Unclosed Hold:</span> Subsequent diuretic-induced AKI prompted a temporary hold on <span className="text-white font-medium">Empagliflozin 10 mg</span> until Cr &lt;1.2 mg/dL{' '}
                      <span className="font-mono text-[10px] bg-white/10 text-white/90 px-1 py-0.5 rounded border border-white/15">
                        Hospital_Discharge_Jan2025.pdf #p.3
                      </span>
                      ; Cr recovered to <span className="text-white font-medium">1.12 mg/dL</span> in March 2025 without resumption{' '}
                      <span className="font-mono text-[10px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded border border-purple-500/30">
                        ∅ Outpatient_Labs_Mar2025.pdf #p.1
                      </span>
                      .
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Call To Action ━━━ */}
      <section id="demo" className="py-24 border-t border-white/[0.08] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-[28px] sm:text-[42px] font-semibold tracking-[-0.03em] text-white mb-4 text-balance">
            Register for Demo Access
          </h2>

          <p className="text-[15px] sm:text-[16px] text-white/60 max-w-md mx-auto mb-8">
            CareNote is a research-stage prototype. The homepage scenario is fictional and hard-coded, not a live product result. Qualified collaborators can help test whether graph-assisted review adds value.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <DemoRequestTrigger
              className="w-full sm:w-auto text-[13px] font-medium bg-white text-black px-6 py-3 rounded hover:bg-white/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
            >
              Request Demo Access
            </DemoRequestTrigger>
          </div>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/50">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span className="font-semibold text-white/80">CareNote</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-white/40">
            <Link href="/clinical-record-synthesis" className="hover:text-white transition-colors">
              Synthesis Guide
            </Link>
            <Link href="/architecture.md" className="hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="/pricing.md" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/collaborate.md" className="hover:text-white transition-colors">
              Collaborate
            </Link>
            <DemoRequestTrigger className="hover:text-white transition-colors cursor-pointer">
              Request Demo
            </DemoRequestTrigger>
            <span>© {new Date().getFullYear()} CareNote</span>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Request Access Modal */}
      <DemoRequestModal />
    </div>
  )
}
