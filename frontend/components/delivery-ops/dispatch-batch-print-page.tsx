'use client';

import { useEffect, useState } from 'react';
import { getFinalDispatchReport, getMorningDispatchReport } from '@/lib/api/delivery-ops';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

import { DispatchBatchPrintable } from './dispatch-batch-printable';

export function DispatchBatchPrintPage({
  id,
  mode,
}: {
  id: string;
  mode: 'morning' | 'final';
}) {
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data =
          mode === 'morning'
            ? await getMorningDispatchReport(Number(id))
            : await getFinalDispatchReport(Number(id));
        setReport(data);
        setTimeout(() => {
          window.print();
        }, 800);
      } catch (err: any) {
        setError(err.message || 'Failed to load print report');
      }
    }

    load();
  }, [id, mode]);

  if (error) {
    return <div className="p-8 text-center text-sm font-medium text-rose-600">{error}</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-sm font-medium text-slate-400">Preparing report...</div>;
  }

  return <DispatchBatchPrintable report={report} mode={mode} />;
}
