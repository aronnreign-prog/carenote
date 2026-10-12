import Link from 'next/link'
import { redirect } from 'next/navigation'
import InitializePatientGraphForm from './InitializePatientGraphForm'
import SignOutButton from './SignOutButton'
import PurgePatientGraphButton from './PurgePatientGraphButton'
import { db } from '@/lib/db'
import { patients as patientsTable, clinicalRecords as clinicalRecordsTable, clinicalSyntheses as clinicalSynthesesTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession, getWorkspace, isAdmin } from '@/lib/auth-session'
import { Logo } from '@/components/ui/Logo'

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default async function DashboardPage() {
  const session = await getSession()
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  const workspace = await getWorkspace()
  if (!workspace?.id) {
    redirect('/login')
  }

  const isUserAdmin = await isAdmin()

  const [patientRows, recordRows, synthesisRows] = await Promise.all([
    db.select({
      id: patientsTable.id,
      name: patientsTable.name,
      biological_sex: patientsTable.biological_sex,
      date_of_birth: patientsTable.date_of_birth,
    }).from(patientsTable).where(eq(patientsTable.workspace_id, workspace.id)).orderBy(patientsTable.created_at),

    db.select({
      id: clinicalRecordsTable.id,
      patient_id: clinicalRecordsTable.patient_id,
    }).from(clinicalRecordsTable).where(eq(clinicalRecordsTable.workspace_id, workspace.id)),

    db.select({
      id: clinicalSynthesesTable.id,
      patient_id: clinicalSynthesesTable.patient_id,
      status: clinicalSynthesesTable.status,
      flagged_concerns: clinicalSynthesesTable.flagged_concerns,
      created_at: clinicalSynthesesTable.created_at,
    }).from(clinicalSynthesesTable).where(eq(clinicalSynthesesTable.workspace_id, workspace.id)).orderBy(clinicalSynthesesTable.created_at),
  ])

  const patients = (patientRows || []).map((p) => {
    const patientRecords = (recordRows || []).filter((r) => r.patient_id === p.id)
    const patientSyntheses = (synthesisRows || []).filter((s) => s.patient_id === p.id)
    const latestSynthesis = patientSyntheses[patientSyntheses.length - 1]

    let flagCount = 0
    if (latestSynthesis?.flagged_concerns && Array.isArray(latestSynthesis.flagged_concerns)) {
      flagCount = latestSynthesis.flagged_concerns.length
    }

    return {
      ...p,
      indexedRecordCount: patientRecords.length,
      flagCount,
      synthesisStatus: latestSynthesis?.status,
    }
  })

  return (
    <div className="min-h-[100dvh] md:h-screen bg-[#0A0E14] text-[#EDEDED] flex flex-col md:flex-row overflow-x-hidden md:overflow-hidden">

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-[#1F2937] bg-[#0D1117] flex-col">

        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Logo size={20} priority />
            <span className="text-[13px] font-semibold tracking-tight text-white">CareNote</span>
          </Link>
        </div>

        {isUserAdmin && (
          <div className="px-4 py-2 border-b border-[#1F2937] bg-white/[0.02] flex items-center justify-between">
            <span className="font-mono text-[9px] text-emerald-400 font-semibold tracking-wider">ADMIN</span>
            <Link
              href="/admin"
              className="font-mono text-[10px] text-white/50 hover:text-white underline decoration-white/20 underline-offset-2 transition-colors"
            >
              Demo Accounts →
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <p className="font-mono text-[9px] tracking-widest text-white/40 uppercase px-3 mb-2">Patient Graphs</p>
          {patients.map((p) => (
            <div key={p.id} className="group relative flex items-center rounded-lg hover:bg-white/[0.04] transition-colors">
              <Link href={`/dashboard/patients/${p.id}`}
                className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold text-white">
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white truncate">{p.name}</p>
                  <p className="font-mono text-[10px] text-white/50">{p.biological_sex} · {calcAge(p.date_of_birth)}y</p>
                </div>
                {(p.flagCount ?? 0) > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                )}
              </Link>
              <div className="pr-2">
                <PurgePatientGraphButton patientId={p.id} patientName={p.name} />
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <p className="px-3 py-4 text-xs text-white/40">No patient graphs initialized.</p>
          )}
        </div>

        <div className="border-t border-[#1F2937] p-4 bg-[#0A0E14]/40">
          <InitializePatientGraphForm />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="shrink-0 border-b border-[#1F2937] bg-[#0A0E14]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={20} />
                <span className="text-[13px] font-semibold tracking-tight text-white">CareNote</span>
              </Link>
            </div>
            <div>
              <h1 className="text-[12px] sm:text-[13px] font-semibold text-foreground">
                {workspace?.name ?? 'Clinical Workspace'}
              </h1>
              <p className="font-mono text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                {`${patients.length} patient graph${patients.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUserAdmin && (
              <Link
                href="/admin"
                className="font-mono text-[10px] border border-accent/40 bg-accent/10 text-accent px-2.5 py-1.5 rounded hover:bg-accent/20 transition-colors"
              >
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">
          {/* Patient cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-8">
            {patients.map((p) => (
              <div key={p.id} className="group relative block">
                <Link href={`/dashboard/patients/${p.id}`} className="block h-full">
                  <article className="border border-[#1F2937] bg-[#0D1117] rounded-xl overflow-hidden hover:border-white/20 hover:bg-[#0F141C] transition-all h-full flex flex-col shadow-sm">
                    {(p.flagCount ?? 0) > 0 && <div className="h-0.5 bg-red-500 w-full" />}
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 font-mono text-[13px] font-bold text-white">
                          {initials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-[13px] font-semibold text-white truncate">{p.name}</h2>
                          <p className="font-mono text-[10px] text-white/50 mt-0.5">
                            {p.biological_sex} · DOB {p.date_of_birth} · Age {calcAge(p.date_of_birth)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-white/40">
                            <rect x="1" y="1.5" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                            <path d="M3.5 4.5h4M3.5 6.5h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                          </svg>
                          <span className="font-mono text-[10px] text-white/60">
                            {p.indexedRecordCount ?? 0} {p.indexedRecordCount === 1 ? 'record indexed' : 'records indexed'}
                          </span>
                        </div>
                        {(p.flagCount ?? 0) > 0 ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="font-mono text-[10px] text-red-300">{p.flagCount} concern{(p.flagCount ?? 0) !== 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="font-mono text-[10px] text-white/40">0 flags</span>
                          </div>
                        )}
                        <span className={`ml-auto font-mono text-[9px] px-2 py-0.5 rounded border ${
                          p.synthesisStatus === 'complete'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-medium'
                            : (p.indexedRecordCount && p.indexedRecordCount > 0)
                            ? 'text-accent border-accent/30 bg-accent-dim font-medium'
                            : 'text-white/40 border-white/10 bg-white/[0.02]'
                        }`}>
                          {p.synthesisStatus === 'complete'
                            ? 'LONGITUDINAL SYNTHESIS READY'
                            : (p.indexedRecordCount && p.indexedRecordCount > 0)
                            ? 'GRAPH CONNECTED'
                            : 'AWAITING RECORDS'}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-[#1F2937] px-5 py-2.5 flex items-center justify-between bg-[#0A0E14]/30">
                      <span className="font-mono text-[10px] text-white/50 group-hover:text-white transition-colors">Open Clinical Timeline &amp; Synthesis</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                        <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </article>
                </Link>
                {/* Purge button appears on card hover */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <PurgePatientGraphButton patientId={p.id} patientName={p.name} />
                </div>
              </div>
            ))}

            {patients.length === 0 && (
              <div className="col-span-full border border-dashed border-[#1F2937] rounded-xl p-8 sm:p-12 text-center bg-[#0D1117]/30">
                <p className="font-mono text-[9px] tracking-widest text-white/40 uppercase mb-2">No patient graphs initialized</p>
                <p className="text-[12px] text-white/50">Initialize a patient graph to connect prescriptions, lab trends, and doctor notes across time.</p>
              </div>
            )}
          </div>

          {/* Mobile Initialize Patient Graph Form */}
          <div className="md:hidden border border-[#1F2937] rounded-xl bg-[#0D1117] p-5 mb-8 shadow-sm">
            <InitializePatientGraphForm />
          </div>

          {/* Clinical Architecture Assurance */}
          <div className="border-t border-[#1F2937] pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-[#1F2937] rounded-xl bg-[#0D1117] p-4 space-y-1.5">
                <p className="text-[12px] font-semibold text-white">Temporal Graph Memory</p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Clinical entities are connected across encounters to maintain true active regimens and prevent vector chunk amnesia.
                </p>
              </div>
              <div className="border border-[#1F2937] rounded-xl bg-[#0D1117] p-4 space-y-1.5">
                <p className="text-[12px] font-semibold text-white">PaperTrail Provenance</p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Every extracted lab and synthesized claim links to an exact quote and page number in the original PDF.
                </p>
              </div>
              <div className="border border-[#1F2937] rounded-xl bg-[#0D1117] p-4 space-y-1.5">
                <p className="text-[12px] font-semibold text-white">Contraindication Auditing</p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Automated checks cross-reference new prescriptions against renal function and multi-provider regimens.
                </p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
