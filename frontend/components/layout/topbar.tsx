export function Topbar() {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-700">Backend-connected frontend</p>
          <h2 className="text-xl font-semibold text-slate-900">
            Operations testing workspace
          </h2>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          API base URL:
          <span className="ml-2 font-mono text-slate-900">
            {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}
          </span>
        </div>
      </div>
    </header>
  );
}
