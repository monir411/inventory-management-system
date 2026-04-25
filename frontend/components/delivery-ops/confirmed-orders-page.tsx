'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Search, Store, Truck } from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToast } from '@/components/ui/toast-provider';
import { useCompanies, useRoutes } from '@/hooks/use-common-queries';
import { getEligibleDispatchOrders } from '@/lib/api/delivery-ops';
import { formatCurrency, formatDate, formatNumber, getTodayBDDate } from '@/lib/utils/format';
import type { Order } from '@/types/api';
import { orderStatusConfig, StatusBadge } from './delivery-ops-ui';

export function ConfirmedOrdersPage() {
  const { error: showErrorToast } = useToast();
  const [date, setDate] = useState(() => getTodayBDDate());
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getEligibleDispatchOrders({
        dispatchDate: date,
        companyId: companyId ? Number(companyId) : undefined,
        routeId: routeId ? Number(routeId) : undefined,
        search: search || undefined,
      });
      setOrders(data);
    } catch (error) {
      showErrorToast('Failed to load dispatch-ready orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [date, companyId, routeId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const summaries = useMemo(() => {
    const totalValue = orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
    const totalQty = orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + Number(item.quantity) + Number(item.freeQuantity || 0),
          0,
        ),
      0,
    );

    return {
      totalValue,
      totalQty,
    };
  }, [orders]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">
            Dispatch Preparation
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Confirmed Orders Queue
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Review dispatch-eligible orders before grouping them into a single morning batch.
          </p>
        </div>
        <Link
          href="/delivery-ops/batches/new"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
        >
          Create Batch
        </Link>
      </div>

      <PageCard>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Order Date
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
                placeholder="Shop, area, note"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm"
              />
            </div>
          </div>
        </div>
      </PageCard>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Orders Ready
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{orders.length}</h3>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Dispatch Quantity
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {formatNumber(summaries.totalQty)}
          </h3>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Estimated Value
          </p>
          <h3 className="mt-2 text-2xl font-black text-emerald-700">
            {formatCurrency(summaries.totalValue)}
          </h3>
        </div>
      </div>

      <PageCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Network</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Dispatch Qty</th>
                <th className="px-6 py-4 text-right">Value</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <StateMessage
                      title="No confirmed orders"
                      description="No eligible orders are available for the selected filters or date."
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const config = orderStatusConfig[order.status];
                  const totalQty = order.items.reduce(
                    (sum, item) => sum + Number(item.quantity) + Number(item.freeQuantity || 0),
                    0,
                  );

                  return (
                    <tr key={order.id} className="transition hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">
                          #{String(order.id).padStart(6, '0')}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {formatDate(order.orderDate)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Building2 className="h-4 w-4 text-slate-300" />
                          {order.company?.name}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                          <MapPin className="h-4 w-4 text-slate-300" />
                          {order.route?.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Store className="h-4 w-4 text-slate-300" />
                          {order.shop?.name || 'Direct Order'}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Truck className="h-4 w-4 text-slate-300" />
                          {order.marketArea || 'Market area not tagged'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-black text-slate-900">
                        {formatNumber(totalQty)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                        {formatCurrency(order.grandTotal)}
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
  );
}
