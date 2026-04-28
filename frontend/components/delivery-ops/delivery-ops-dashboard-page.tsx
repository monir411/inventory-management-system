'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  HandCoins,
  Search,
  Truck,
  Undo2,
} from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToast } from '@/components/ui/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { getDeliveryDashboard, getDispatchBatches } from '@/lib/api/delivery-ops';
import { useCompanies, useRoutes } from '@/hooks/use-common-queries';
import { batchStatusConfig, MetricCard, StatusBadge } from './delivery-ops-ui';
import type { DispatchBatch } from '@/types/api';

export function DeliveryOpsDashboardPage() {
  const { error: showErrorToast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [search, setSearch] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [batches, setBatches] = useState<DispatchBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dashboardData, batchData] = await Promise.all([
        getDeliveryDashboard(date),
        getDispatchBatches({
          dispatchDate: date,
          companyId: companyId ? Number(companyId) : undefined,
          routeId: routeId ? Number(routeId) : undefined,
          search: search || undefined,
        }),
      ]);

      setDashboard(dashboardData);
      setBatches(batchData);
    } catch (error) {
      showErrorToast('Failed to load delivery operations dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date, companyId, routeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Quick stats removed for simpler operational UI

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
            Premium Delivery ERP
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Dispatch Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            Track the full field-delivery cycle from assigned orders to return
            adjustment, cash collection, and final settlement.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/delivery-ops/orders"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Confirmed Orders
          </Link>
          <Link
            href="/delivery-ops/fast-track"
            className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-700 shadow-sm transition hover:bg-cyan-100"
          >
            Create Order & Dispatch
          </Link>
          <Link
            href="/delivery-ops/batches/new"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            Create Dispatch Batch
          </Link>
        </div>
      </div>

      <PageCard>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Dispatch Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Company
            </label>
            <select
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Route
            </label>
            <select
              value={routeId}
              onChange={(event) => setRouteId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">All Routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Batch no or delivery person"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm"
              />
            </div>
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6">
        <PageCard
          title="Dispatch Batches"
          description="Operational queue for the selected date. Open any batch to record returns, collections, and final settlement."
          action={
            <Link
              href="/delivery-ops/reports"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-white"
            >
              Reports
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Delivery</th>
                  <th className="px-6 py-4 text-right">Gross</th>
                  <th className="px-6 py-4 text-right">Final</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                      Loading dispatch batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16">
                      <StateMessage
                        title="No dispatch batches yet"
                        description="Create a new batch from confirmed orders to kick off the morning delivery workflow."
                      />
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const config = batchStatusConfig[batch.status];
                    return (
                      <tr key={batch.id} className="transition hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <Link
                            href={`/delivery-ops/batches/${batch.id}`}
                            className="block text-sm font-black text-slate-900 hover:text-cyan-700"
                          >
                            {batch.batchNo}
                          </Link>
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            {formatDate(batch.dispatchDate)} · {batch.totalOrders} order(s)
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">
                            {batch.deliveryPerson?.name}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            {batch.route?.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                          {formatCurrency(batch.grossDispatchedValue)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-700">
                          {formatCurrency(batch.finalSoldValue || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge {...config} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </PageCard>

      </div>
    </div>
  );
}
