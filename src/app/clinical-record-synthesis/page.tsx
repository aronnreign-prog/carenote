import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Logo } from '@/components/ui/Logo'
import { DemoRequestModal, DemoRequestTrigger } from '@/components/marketing/DemoRequestModal'
import { Check, X, ArrowRight, ShieldCheck, Clock, FileText, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Longitudinal Clinical Synthesis vs. AI Summarization | CareNote',
  description:
    'CareNote is a research-stage prototype testing whether a patient-specific graph helps reviewers reconstruct changing clinical state from fragmented records.',
  alternates: {
    canonical: 'https://carenote.in/clinical-record-synthesis',
  },
  openGraph: {
    title: 'Longitudinal Clinical Synthesis vs. AI Summarization | CareNote',
    description:
      'A description of CareNote’s graph-based approach to longitudinal record review, its structural PaperTrail check, and the limits that still require evaluation.',
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
        'CareNote is a research-stage prototype testing graph-based longitudinal clinical-record review. The page describes its current implementation, structural source-anchor checks, and evaluation limits.',
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
            text: 'Longitudinal clinical synthesis is an approach to organizing records from multiple encounters into a dated account of changing clinical state, relationships, and source evidence. CareNote is testing whether a patient-specific graph helps a knowledgeable reviewer inspect that history. Comparative performance and clinical usefulness have not been established.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is CareNote testing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CareNote is testing whether a patient-specific graph helps reviewers reconstruct changing clinical state across fragmented records. It has not established that graph-based review is more accurate or useful than ordinary document search or other systems.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does CareNote verify synthesized clinical claims?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CareNote’s structural PaperTrail check matches inline claim markers to claim records and checks that source-backed claims cite record/page anchors present in retrieved context. It does not verify semantic support or clinical correctness.',
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
            <span>Research-stage prototype</span>
          </div>

          <h1 className="text-[34px] sm:text-[48px] font-semibold tracking-[-0.03em] leading-[1.15] text-white mb-6 text-balance">
            CareNote tests a graph-based approach to longitudinal record review. <br />
            <span className="text-white/45">The clinical value remains to be evaluated.</span>
          </h1>

          {/* Self-Contained Extractable Category Definition Block (Optimized for AI Engine Citations) */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] mb-12">
            <h2 className="text-[13px] font-mono uppercase tracking-wider text-white/50 mb-3">
              Category Definition: Longitudinal Clinical Synthesis
            </h2>
            <p className="text-[16px] sm:text-[18px] text-white/90 leading-relaxed font-normal">
              <strong>Longitudinal clinical synthesis</strong> is an approach to organizing records from multiple encounters into a dated account of changing clinical state, relationships, and source evidence. CareNote is testing whether a patient-specific graph helps a knowledgeable reviewer inspect that history. Comparative performance and clinical usefulness have not been established.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ Longitudinal Review Questions ━━━ */}
      <section className="py-16 border-t border-white/[0.08]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-[24px] sm:text-[30px] font-semibold text-white mb-3">
              What a longitudinal review needs to preserve
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              CareNote's research question starts with a reviewer's need to inspect changes across time. The product has not been independently evaluated against other summarizers or graph systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <Clock size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                1. Changing states
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Records from different encounters may describe different states. A reviewer needs dated source evidence before judging what is current.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                2. Contradictory records
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                A repeated statement and a later conflicting record should remain inspectable. CareNote has not yet measured how reliably it detects or characterizes conflicts.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                <FileText size={16} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">
                3. Relationships and follow-up
              </h3>
              <p className="text-[13px] text-white/60 leading-[1.6]">
                Links among treatments, findings, and follow-up are candidates for review, not proof of causality or a guarantee that every unresolved action is found.
              </p>
            </div>
          </div>

          {/* ━━━ Comparison Table Block (Optimized for AI Engine Extraction) ━━━ */}
          <div className="border border-white/10 rounded-xl bg-white/[0.01] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-[14px] font-semibold text-white">
                Current implementation and evaluation boundaries
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 bg-black/20">
                    <th className="py-3.5 px-6 font-medium">Dimension</th>
                    <th className="py-3.5 px-6 font-medium text-red-300">What remains unverified</th>
                    <th className="py-3.5 px-6 font-medium text-emerald-300">What the current code does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-white/80">
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Underlying Data Model</td>
                    <td className="py-4 px-6 text-white/60">Whether graph-assisted review improves on ordinary search or competing graph/RAG systems</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Indexes PDF-derived facts into patient-specific graph memory</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Temporal Awareness</td>
                    <td className="py-4 px-6 text-white/60">Per-claim valid-time and transaction-time correctness</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Uses encounter dates and graph-service temporal metadata</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Medication State</td>
                    <td className="py-4 px-6 text-white/60">Accuracy of active, held, stopped, or superseded states</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Serializes medication status and retrieves temporal graph edges</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Prescribing Cascades</td>
                    <td className="py-4 px-6 text-white/60">Whether candidate relationships are accurate or useful</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Retrieves multi-domain temporal edges for model synthesis</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Source Verification</td>
                    <td className="py-4 px-6 text-white/60">Whether a cited source semantically supports a generated claim</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Checks claim markers and record/page anchors structurally</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">Contradiction Handling</td>
                    <td className="py-4 px-6 text-white/60">How reliably conflicts and missing documentation are identified</td>
                    <td className="py-4 px-6 text-emerald-400 font-medium">Supports conflict and notable-absence claim labels</td>
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
              How CareNote currently represents record history
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              The current implementation organizes PDF-derived facts in a patient-specific graph. The hypothesis that this improves review remains open.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">01 / ENCOUNTER DATES</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Encounter dates and graph validity
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                CareNote attaches a valid encounter date as the graph episode timestamp when available and reads temporal validity metadata from graph search results. The application does not maintain explicit valid-time and transaction-time fields for every extracted fact.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">02 / RELATIONSHIPS</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Candidate relationships for review
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                The graph retrieves temporal relationships among clinical records. It does not establish causality or prove that a medication sequence is a prescribing cascade.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">03 / PAPERTRAIL STRUCTURAL CHECK</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                The PaperTrail source-anchor check
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                The check matches claim markers to claim records and verifies record/page anchors against retrieved context. It does not verify semantic support, quote entailment, or clinical correctness.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.01]">
              <div className="text-[12px] font-mono text-emerald-400 mb-2">04 / UNCLOSED LOOP AUDITS</div>
              <h3 className="text-[17px] font-semibold text-white mb-2">
                Notable-absence labels
              </h3>
              <p className="text-[14px] text-white/65 leading-relaxed">
                The model can label a notable absence when prompted, but systematic detection of missing closure across records has not been independently evaluated.
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
            Explore the Synthetic Demonstration
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-xl mx-auto">
            This fictional, hard-coded scenario demonstrates the PaperTrail interface. It is not a real patient case, a live synthesis, or evidence of clinical performance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#proof"
              className="w-full sm:w-auto text-[13px] font-medium bg-white text-black px-6 py-3 rounded hover:bg-white/90 transition-colors"
            >
              Inspect Synthetic Demo →
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
