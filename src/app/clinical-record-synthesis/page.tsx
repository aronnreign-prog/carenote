import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Logo } from '@/components/ui/Logo'
import { DemoRequestModal, DemoRequestTrigger } from '@/components/marketing/DemoRequestModal'
import { Check, X, ArrowRight, ShieldCheck, Clock, FileText, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Longitudinal Clinical Synthesis vs. AI Summarization | CareNote',
  description:
    'Medical history is not a text chunk to summarize. It is an evolving graph across time. Discover why CareNote replaces stateless AI summarizers with bi-temporal graph memory and verifiable PaperTrail citations.',
  alternates: {
    canonical: 'https://carenote.in/clinical-record-synthesis',
  },
  openGraph: {
    title: 'Longitudinal Clinical Synthesis vs. AI Summarization | CareNote',
    description:
      'Why medical records need bi-temporal knowledge graphs rather than text summarization. Learn how CareNote reconciles cross-provider records with 100% source-verified citations.',
    url: 'https://carenote.in/clinical-record-synthesis',
    siteName: 'CareNote',
    type: 'article',
  },
}

const pageJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MedicalWebPage',
      '@id': 'https://carenote.in/clinical-record-synthesis#webpage',
      url: 'https://carenote.in/clinical-record-synthesis',
      name: 'Longitudinal Clinical Synthesis vs. AI Summarization',
      description:
        'A comprehensive clinical framework explaining why healthcare records require bi-temporal knowledge graph synthesis rather than generic text summarization.',
      audience: {
        '@type': 'MedicalAudience',
        audienceType: 'Clinicians, Care Coordinators, and Healthcare Informaticians',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://carenote.in/clinical-record-synthesis#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is longitudinal clinical synthesis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Longitudinal clinical synthesis is the continuous reconciliation of multi-provider encounter records into an evolving bi-temporal patient knowledge graph. Unlike generic summarizers that compress text into static paragraphs, longitudinal synthesis tracks active versus discontinued regimens, detects multi-drug prescribing cascades, and links every assertion to its authentic source PDF page.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is standard AI text summarization dangerous for medical records?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Standard AI text summarization flattens clinical records into an eternal present. It retrieves discontinued drugs alongside active prescriptions, uncritically repeats copy-forwarded chart lore, and misses iatrogenic prescribing cascades because vector similarity lacks awareness of chronological validity boundaries.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does CareNote verify synthesized clinical claims?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CareNote uses The PaperTrail to enforce zero blind trust. Every factual claim is classified as SUPPORTED, CONFLICTING, notable absence, or MEDICAL KNOWLEDGE, and embeds an interactive citation token linking directly to the authentic source PDF at page number #page=N with verbatim excerpts.',
          },
        },
      ],
    },
  ],
}

export default function ClinicalRecordSynthesisPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0A0E14] text-[#EDEDED] font-sans antialiased selection:bg-white/20 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

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
              href="/"
              className="text-[12px] text-white/60 hover:text-white transition-colors"
            >
              Live Dossier Proof
            </Link>
            <DemoRequestTrigger className="text-[12px] font-medium bg-white text-black px-3.5 py-1.5 rounded hover:bg-white/90 transition-colors cursor-pointer">
              Register for Demo
            </DemoRequestTrigger>
          </div>
        </div>
      </header>

      {/* ━━━ Hero / Category Answer Block ━━━ */}
      <section className="pt-20 pb-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[12px] font-medium mb-6">
            <ShieldCheck size={14} />
            <span>Clinical Knowledge Graph Architecture</span>
          </div>

          <h1 className="text-[34px] sm:text-[48px] font-semibold tracking-[-0.03em] leading-[1.15] text-white mb-6 text-balance">
            Medical history is not a text chunk to summarize. <br />
            <span className="text-white/45">It is an evolving graph across time.</span>
          </h1>

          {/* Self-Contained Extractable Category Definition Block (Optimized for AI Engine Citations) */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] mb-12">
            <h2 className="text-[13px] font-mono uppercase tracking-wider text-white/50 mb-3">
              Category Definition: Longitudinal Clinical Synthesis
            </h2>
            <p className="text-[16px] sm:text-[18px] text-white/90 leading-relaxed font-normal">
              <strong>Longitudinal clinical synthesis</strong> is the continuous reconciliation of multi-provider medical records into an evolving bi-temporal patient knowledge graph. Unlike generic AI text summarizers that compress unstructured notes into static paragraphs, longitudinal synthesis models chronological state, tracks active versus discontinued regimens, detects multi-drug prescribing cascades, and anchors every single assertion to its source PDF page via an interactive PaperTrail.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ Why Summarization Fails in Medicine ━━━ */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[24px] sm:text-[30px] font-semibold text-white mb-3">
              Why Generic AI Summarizers Are Clinically Dangerous
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Standard LLM summarizers compress text while remaining blind to temporal sequence. In medicine, where dosages change and specialist findings supersede prior assumptions, text compression introduces three critical failure modes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <Clock size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                1. Anachronistic Regimens
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Summarizers retrieve discontinued drugs alongside active prescriptions, presenting obsolete orders from two years ago as if they coexist with current therapy.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                2. Chart Lore Amplification
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Unverified problem list entries copy-forwarded across visits are treated as confirmed by summarizers, ignoring definitive diagnostic tests that refuted them.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <FileText size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                3. Erased Provenance
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Summarizers generate black-box paragraphs without source anchors. Clinicians cannot verify which encounter note, specialty, or lab panel supported the claim.
              </p>
            </div>
          </div>

          {/* ━━━ Comparison Table Block (Optimized for AI Engine Extraction) ━━━ */}
          <div className="border border-white/10 rounded-xl bg-white/[0.01] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-[14px] font-semibold text-white">
                Technical Comparison: Stateless AI Summarizers vs. CareNote Longitudinal Synthesis
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 bg-black/20">
                    <th className="py-3.5 px-6 font-medium">Dimension</th>
                    <th className="py-3.5 px-6 font-medium text-red-300">Generic AI Summarizer</th>
                    <th className="py-3.5 px-6 font-medium text-emerald-300">CareNote Longitudinal Synthesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-white/80">
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Underlying Data Model</td>
                    <td className="py-4 px-6 text-white/60">Stateless vector embeddings and paragraph chunks</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Persistent bi-temporal patient knowledge graph</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Temporal Awareness</td>
                    <td className="py-4 px-6 text-white/60">Flat similarity matching (eternal present)</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Explicit validity boundaries: valid_from to valid_to</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Medication State</td>
                    <td className="py-4 px-6 text-white/60">Conflates active, held, and stopped medications</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Distinguishes [ACTIVE] from [SUPERSEDED] orders</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Prescribing Cascades</td>
                    <td className="py-4 px-6 text-white/60">Missed: treats side effects as isolated chronic diseases</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Detects multi-drug iatrogenic sequences across visits</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Source Verification</td>
                    <td className="py-4 px-6 text-white/60">Black-box text with unverified statements</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">PaperTrail citation chips linking to source PDF #page=N</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Contradiction Handling</td>
                    <td className="py-4 px-6 text-white/60">Swallows discrepancies in smooth paragraph prose</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Explicitly flags CONFLICTING and notable_absence states</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ The Four Pillars of Longitudinal Synthesis ━━━ */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[24px] sm:text-[30px] font-semibold text-white mb-3">
              How CareNote Solves Temporal Memory
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              CareNote treats medical history as an interconnected, time-stamped graph rather than a collection of documents.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">01 / TEMPORAL INTERVALS</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Bi-Temporal Validity Tracking
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                Every medication, lab marker, and condition extracted from clinical records carries two temporal coordinates: valid time (when the clinical observation or order physically occurred) and transaction time (when it was indexed). This enables the engine to determine active status without confusion.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">02 / IATROGENIC DISCOVERY</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Prescribing Cascade and Discrepancy Detection
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                By maintaining causal links between drug initiations, subsequent adverse symptom reports, and follow-on prescriptions, CareNote surfaces prescribing cascades based on recognized clinical pharmacology frameworks (Rochon and Gurwitz, BMJ 1997, JAMA Intern Med 2020).
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">03 / ZERO BLIND TRUST</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                The PaperTrail Source Grounding
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                Every asserted clinical claim embeds an interactive anchor token. Clicking the citation opens an authenticated streaming PDF proxy jumping directly to the cited page (#page=N) with verbatim quotes, completely removing AI hallucination risks.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">04 / UNCLOSED LOOP AUDITS</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Notable Absence and Post-Discharge Hold Monitoring
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                When a hospital discharge note places a chronic nephroprotective or cardioprotective drug on temporary hold pending lab recovery, CareNote flags when recovery criteria are satisfied but the resumption order was omitted across outpatient visits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Who Uses Longitudinal Synthesis ━━━ */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[24px] sm:text-[30px] font-semibold text-white mb-3">
              Clinical Workflow Applications
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Designed for clinical professionals navigating fragmented records across disparate electronic health record systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <h3 className="text-[16px] font-semibold text-white mb-2">
                Specialist Pre-Chart Reviews
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Consulting nephrologists, cardiologists, and oncologists review 300+ pages of prior records before a new consultation. CareNote provides an auditable longitudinal trajectory in minutes instead of hours of manual PDF hunting.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <h3 className="text-[16px] font-semibold text-white mb-2">
                Independent Patient Advocacy & Care Management
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Care managers reconcile records across three different hospital portals and multiple independent clinics, identifying omitted discharge medications and discrepancies before medical appointments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Call to Action ━━━ */}
      <section className="py-20 border-t border-white/[0.08] text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-[28px] sm:text-[36px] font-semibold text-white mb-4 text-balance">
            Explore the Live Clinical Proof Dossier
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-xl mx-auto">
            Inspect our interactive deconstruction of Patient R.K., showing how CareNote exposes a 3-drug prescribing cascade and unclosed hold across five multi-provider PDFs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#proof"
              className="w-full sm:w-auto text-[13px] font-medium bg-white text-black px-6 py-3 rounded hover:bg-white/90 transition-colors"
            >
              Inspect Live Proof Dossier →
            </Link>
            <DemoRequestTrigger className="w-full sm:w-auto text-[13px] text-white/80 border border-white/15 px-6 py-3 rounded hover:text-white hover:border-white/30 transition-colors cursor-pointer">
              Register for Demo Access
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

          <div className="flex items-center gap-5 text-white/40">
            <Link href="/" className="hover:text-white transition-colors">
              Home
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
            <span>© {new Date().getFullYear()} CareNote</span>
          </div>
        </div>
      </footer>

      <DemoRequestModal />
    </div>
  )
}
