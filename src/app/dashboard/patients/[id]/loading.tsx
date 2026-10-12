export default function PatientGraphLoading() {
  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto border border-border rounded-lg bg-surface overflow-hidden min-h-[600px] flex flex-col">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="h-4 w-40 bg-surface-raised rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface-raised rounded animate-pulse" />
        </div>
        <div className="flex flex-1">
          <div className="hidden md:flex w-72 border-r border-border p-5 flex-col gap-4">
            <div className="h-10 w-full bg-surface-raised rounded animate-pulse" />
            <div className="h-16 w-full bg-surface-raised rounded animate-pulse" />
            <div className="h-16 w-full bg-surface-raised rounded animate-pulse" />
            <div className="h-16 w-full bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="h-8 w-56 bg-surface-raised rounded animate-pulse" />
            <div className="h-12 w-full bg-surface-raised rounded animate-pulse" />
            <div className="h-64 w-full bg-surface-raised rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
