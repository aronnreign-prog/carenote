import Link from 'next/link'
import type { Metadata } from 'next'
import { Logo } from '@/components/ui/Logo'
import { DemoRequestModal, DemoRequestTrigger } from '@/components/marketing/DemoRequestModal'

export const metadata: Metadata = {
  title: 'Temporal Clinical Memory for Longitudinal Record Review | CareNote',
  description:
    'CareNote builds a patient-specific temporal memory graph from clinical-record PDFs, then produces longitudinal syntheses and clinical answers with inspectable source evidence.',
  alternates: {
    canonical: 'https://carenote.in/clinical-record-synthesis',
  },
  openGraph: {
    title: 'Temporal Clinical Memory for Longitudinal Record Review | CareNote',
    description:
      'Reconcile changing clinical state across fragmented records, then inspect the source record and page behind the result.',
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
      name: 'Temporal Clinical Memory for Longitudinal Record Review',
      description:
        'CareNote builds a patient-specific temporal memory graph from clinical-record PDFs and produces longitudinal clinical syntheses and temporal answers with source evidence.',
      audience: {
        '@type': 'MedicalAudience',
        audienceType: 'Clinicians, Care Coordinators, Patient Advocates, and Families',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://carenote.in/clinical-record-synthesis#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is CareNote?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CareNote is a clinical workspace that builds a patient-specific temporal memory graph from clinical-record PDFs. It produces longitudinal clinical syntheses and answers temporal questions across the patient record, with claim evidence that can point to a source record and physical page.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does CareNote differ from a document summarizer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A document summarizer compresses text from files. CareNote is designed to reconcile changing clinical state across encounters, including medication status, lab trajectories, cross-provider contradictions, and unresolved actions, then present the result with explicit evidence states.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does CareNote show evidence for a clinical claim?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CareNote attaches claim evidence to source record identifiers, physical page numbers, and excerpts when available. The PaperTrail interface lets an authorized reviewer open the source PDF through the workspace and inspect the cited page. Claims without a usable source are shown as unverified rather than as ordinary citations.',
          },
        },
        {
          '@type': 'Question',
          name: 'What records does CareNote accept?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The current product indexes clinical-record PDFs such as discharge summaries, outpatient notes, laboratory panels, prescriptions, diagnostic reports, and specialist consultations. It is not presented as a direct EHR integration.',
          },
        },
      ],
    },
  ],
}

const evidenceStates = [
  {
    label: 'Supported',
    text: 'The claim is backed by source clinical records in the retrieved context.',
    color: 'border-emerald-500/30 bg-emerald-500/[0.03] text-emerald-300',
  },
  {
    label: 'Conflicting',
    text: 'The record contains findings that disagree across visits or sources.',
    color: 'border-amber-500/30 bg-amber-500/[0.03] text-amber-300',
  },
  {
    label: 'Not documented',
    text: 'An expected test, action, or follow-up is missing from the available timeline.',
    color: 'border-purple-500/30 bg-purple-500/[0.03] text-purple-300',
  },
  {
    label: 'Medical knowledge',
    text: 'The explanation comes from clinical pharmacology or pathology rather than a patient record.',
    color: 'border-sky-500/30 bg-sky-500/[0.03] text-sky-300',
  },
  {
    label: 'Unverified',
    text: 'The system cannot establish enough evidence for the claim.',
    color: 'border-white/15 bg-white/[0.02] text-white/65',
  },
]

export default function ClinicalRecordSynthesisPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0A0E14] text-[#EDEDED] font-sans antialiased selection:bg-white/20 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0E14]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={22} priority />
            <span className="text-[13px] font-semibold tracking-tight text-white">CareNote</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#proof" className="text-[12px] text-white/60 hover:text-white transition-colors">
              Live proof dossier
            </Link>
            <DemoRequestTrigger className="text-[12px] font-medium bg-white text-black px-3.5 py-1.5 rounded hover:bg-white/90 transition-colors cursor-pointer">
              Request demo access
            </DemoRequestTrigger>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-20 pb-16">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-[12px] font-mono uppercase tracking-wider text-emerald-400 mb-5">
              Temporal clinical memory
            </p>
            <h1 className="text-[34px] sm:text-[52px] font-semibold tracking-[-0.03em] leading-[1.12] text-white mb-6 text-balance">
              CareNote reconciles a patient&apos;s changing clinical state across records.
            </h1>
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-[17px] sm:text-[19px] text-white/90 leading-relaxed">
                CareNote builds a patient-specific temporal memory graph from fragmented clinical-record PDFs. It connects encounters, medications, labs, conditions, and source pages, then produces a Longitudinal Clinical Synthesis or answers a Temporal Memory Query with evidence states that show what is supported, conflicting, not documented, medical knowledge, or unverified.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <DemoRequestTrigger className="text-[13px] font-medium bg-white text-black px-5 py-2.5 rounded hover:bg-white/90 transition-colors cursor-pointer">
                Request demo access
              </DemoRequestTrigger>
              <Link
                href="/#proof"
                className="text-[13px] text-white/75 border border-white/[0.14] bg-white/[0.02] px-5 py-2.5 rounded hover:text-white hover:border-white/30 transition-colors"
              >
                Inspect the live proof dossier
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3">
                A patient graph keeps the record&apos;s sequence intact.
              </h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">
                Clinical records are written by different people, at different times, for different encounters. A text-only summary can place a discontinued medication beside an active order or repeat a diagnosis that a later report contradicts. CareNote keeps the encounter date, medication state, lab value, condition, and provenance connected while the record is indexed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-3">01 / Intake</p>
                <h3 className="text-[16px] font-semibold text-white mb-2">Index the clinical records.</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Upload encounter PDFs such as discharge summaries, outpatient notes, laboratory panels, prescriptions, diagnostic reports, and specialist consultations.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-3">02 / Memory</p>
                <h3 className="text-[16px] font-semibold text-white mb-2">Connect facts across time.</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  The graph retrieves entity summaries, chronological episodes, and temporal edges so active and superseded states can be considered together.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-3">03 / Review</p>
                <h3 className="text-[16px] font-semibold text-white mb-2">Inspect the resulting answer.</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Read the synthesis or ask a temporal question, then follow a claim to its source record and page when usable evidence is available.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3">
                The output is a reconciliation, not a shorter document.
              </h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">
                CareNote&apos;s Longitudinal Clinical Synthesis is structured around the questions a reviewer needs to resolve: what was true at baseline, how the trajectory changed, what appears active now, and which discrepancies or missing actions deserve attention.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Longitudinal trajectory</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Follow symptoms, diagnoses, medication changes, and lab trends through chronological episodes instead of treating each note as a separate present.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Active pharmacotherapy and multi-system context</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  See medication names, doses, frequency, route, and extracted status, alongside conditions, labs, vitals, imaging findings, and follow-up observations when documented.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Flagged discrepancies and unresolved actions</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Surface cross-provider conflicts, possible prescribing sequences, abrupt changes, and expected tests or follow-up actions that are not documented in the available timeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3">
                PaperTrail makes the evidence visible.
              </h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">
                A clinical answer is easier to review when its evidence is close at hand. CareNote carries source record identifiers, physical page numbers, and excerpts into its claim model. If a claim cannot be tied to a usable source, the interface keeps that limitation visible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidenceStates.map((state) => (
                <div key={state.label} className={`p-5 rounded-xl border ${state.color}`}>
                  <h3 className="text-[15px] font-semibold mb-2">{state.label}</h3>
                  <p className="text-[13px] text-white/60 leading-[1.6]">{state.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3">
                Ask questions that depend on time and context.
              </h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">
                The Temporal Memory Query is for questions that cross encounters, providers, and dates. The product retrieves the patient graph, answers in chronological context, and returns claim evidence with the answer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'How has renal function changed across visits?',
                'Track all dose adjustments for this medication.',
                'Which prescriptions conflict across providers?',
                'What was held at discharge, and was the follow-up action documented?',
              ].map((question) => (
                <div key={question} className="p-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
                  “{question}”
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/[0.08]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white mb-3">
                CareNote supports review. It does not replace clinical judgment.
              </h2>
              <p className="text-[15px] text-white/65 leading-[1.7]">
                The current product is a curated private pilot for people managing complex, multi-provider records. It accepts clinical-record PDFs and organizes their evidence for review. It is not a diagnosis engine, prescription service, or direct EHR integration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Specialist pre-chart review</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Organize prior records before a consultation and inspect the evidence behind the resulting trajectory.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Care coordination</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Reconcile records collected from different providers and keep unresolved actions visible across the timeline.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-[16px] font-semibold text-white mb-2">Patient advocacy and family review</h3>
                <p className="text-[13px] text-white/60 leading-[1.65]">
                  Build a clearer record of what changed, what is supported, and what still needs a human answer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-white/[0.08] text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[28px] sm:text-[38px] font-semibold text-white mb-4 text-balance">
              See temporal clinical memory in the live proof dossier.
            </h2>
            <p className="text-[15px] text-white/60 mb-8 max-w-xl mx-auto">
              Inspect how CareNote connects five encounter records, labels evidence states, and lets a reviewer follow claims back to source pages.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/#proof"
                className="w-full sm:w-auto text-[13px] font-medium bg-white text-black px-6 py-3 rounded hover:bg-white/90 transition-colors"
              >
                Inspect live proof dossier
              </Link>
              <DemoRequestTrigger className="w-full sm:w-auto text-[13px] text-white/80 border border-white/15 px-6 py-3 rounded hover:text-white hover:border-white/30 transition-colors cursor-pointer">
                Request demo access
              </DemoRequestTrigger>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/50">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span className="font-semibold text-white/80">CareNote</span>
          </div>
          <div className="flex items-center gap-5 text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/architecture.md" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/pricing.md" className="hover:text-white transition-colors">Access</Link>
            <Link href="/collaborate.md" className="hover:text-white transition-colors">Collaborate</Link>
            <span>© {new Date().getFullYear()} CareNote</span>
          </div>
        </div>
      </footer>

      <DemoRequestModal />
    </div>
  )
}