'use client';

import Link from 'next/link';

export function PrintDeliverySummaryPage({ id }: { id: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">
        Legacy Print Route
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        Delivery printing is now handled from the dispatch workflow
      </h1>
      <p className="mt-4 max-w-2xl text-sm font-medium text-slate-500">
        Use the morning or final print layouts inside the new dispatch batch module for the upgraded ERP flow.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/delivery-ops/batches/${id}`}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
        >
          Open Dispatch Batch
        </Link>
        <Link
          href={`/delivery-ops/batches/${id}/morning-print`}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Morning Print
        </Link>
      </div>
    </div>
  );
}
