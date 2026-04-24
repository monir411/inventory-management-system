'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileBarChart2 } from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { useToast } from '@/components/ui/toast-provider';
import { useCompanies, useRoutes } from '@/hooks/use-common-queries';
import { getDeliveryPeople, getDispatchReports } from '@/lib/api/delivery-ops';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { DeliveryPerson } from '@/types/api';

export function DeliveryReportsPage() {
  const { error: showErrorToast } = useToast();
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [deliveryPersonId, setDeliveryPersonId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([]);

  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();

  const fetchReport = async () => {
    try {
      const [people, reportData] = await Promise.all([
        getDeliveryPeople(),
        getDispatchReports({
          dispatchDate,
          companyId: companyId ? Number(companyId) : undefined,
          routeId: routeId ? Number(routeId) : undefined,
          deliveryPersonId: deliveryPersonId ? Number(deliveryPersonId) : undefined,
        }),
      ]);
      setDeliveryPeople(people);
      setReport(reportData);
    } catch (error) {
      showErrorToast('Failed to load delivery reports');
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dispatchDate, companyId, routeId, deliveryPersonId]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">
          Delivery Reporting
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Dispatch, Return & Settlement Reports
        </h1>
      </div>

      <PageCard>
        <div className="grid gap-4 lg:grid-cols-4">
          <input
            type="date"
            value={dispatchDate}
            onChange={(event) => setDispatchDate(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <select
            value={routeId}
            onChange={(event) => setRouteId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <option value="">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
          <select
            value={deliveryPersonId}
            onChange={(event) => setDeliveryPersonId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <option value="">All Delivery Men</option>
            {deliveryPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
      </PageCard>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Dispatch</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(report?.totals?.grossDispatchedValue || 0)}</h3>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Final Sold</p>
          <h3 className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(report?.totals?.finalSoldValue || 0)}</h3>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collected</p>
          <h3 className="mt-2 text-2xl font-black text-cyan-700">{formatCurrency(report?.totals?.totalCollectedAmount || 0)}</h3>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Due</p>
          <h3 className="mt-2 text-2xl font-black text-amber-700">{formatCurrency(report?.totals?.totalDueAmount || 0)}</h3>
        </div>
      </div>

      <PageCard noPadding title="Batch Report Rows" description="Each row summarizes the operational and financial result of one dispatch batch.">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Delivery Man</th>
                <th className="px-6 py-4 text-right">Gross</th>
                <th className="px-6 py-4 text-right">Final</th>
                <th className="px-6 py-4 text-right">Collected</th>
                <th className="px-6 py-4 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(report?.rows || []).map((row: any) => (
                <tr key={row.id} className="transition hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <Link href={`/delivery-ops/batches/${row.id}`} className="text-sm font-black text-slate-900 hover:text-cyan-700">
                      {row.batchNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(row.dispatchDate)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{row.deliveryPerson}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{formatCurrency(row.grossDispatchedValue)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-emerald-700">{formatCurrency(row.finalSoldValue)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-cyan-700">{formatCurrency(row.totalCollectedAmount)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-amber-700">{formatCurrency(row.totalDueAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!report?.rows?.length ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-slate-400">
            <FileBarChart2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            No batch report rows for the selected filters.
          </div>
        ) : null}
      </PageCard>
    </div>
  );
}
