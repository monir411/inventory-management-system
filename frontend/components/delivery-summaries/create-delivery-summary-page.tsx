'use client';

import Link from 'next/link';

export function CreateDeliverySummaryPage() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">
        Workflow Upgraded
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        Delivery summary creation moved to Dispatch Batches
      </h1>
      <p className="mt-4 max-w-2xl text-sm font-medium text-slate-500">
        The new ERP workflow uses dispatch batches, return entry, and final settlement instead of the old standalone delivery summary form.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/delivery-ops/batches/new"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
        >
          Open Dispatch Batch Builder
        </Link>
        <Link
          href="/delivery-ops"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Open Delivery Ops
        </Link>
      </div>
    </div>
  );
}
