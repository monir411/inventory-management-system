'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Search } from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToast } from '@/components/ui/toast-provider';
import { useCompanies, useRoutes } from '@/hooks/use-common-queries';
import {
  createDispatchBatch,
  getDeliveryPeople,
  getEligibleDispatchOrders,
} from '@/lib/api/delivery-ops';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import type { DeliveryPerson, Order } from '@/types/api';

export function DispatchBatchCreatePage() {
  const router = useRouter();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [deliveryPersonId, setDeliveryPersonId] = useState('');
  const [marketArea, setMarketArea] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [people, eligibleOrders] = await Promise.all([
        getDeliveryPeople(),
        getEligibleDispatchOrders({
          dispatchDate,
          companyId: companyId ? Number(companyId) : undefined,
          routeId: routeId ? Number(routeId) : undefined,
          search: search || undefined,
        }),
      ]);
      setDeliveryPeople(people);
      setOrders(eligibleOrders);
    } catch (error) {
      showErrorToast('Failed to load dispatch creation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatchDate, companyId, routeId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [orders, selectedOrderIds],
  );

  const totals = useMemo(() => {
    return selectedOrders.reduce(
      (acc, order) => {
        acc.amount += Number(order.grandTotal);
        acc.quantity += order.items.reduce(
          (sum, item) => sum + Number(item.quantity) + Number(item.freeQuantity || 0),
          0,
        );
        return acc;
      },
      { amount: 0, quantity: 0 },
    );
  }, [selectedOrders]);

  const toggleOrder = (orderId: number) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const handleCreateBatch = async () => {
    if (!routeId || !deliveryPersonId || selectedOrderIds.length === 0) {
      showErrorToast('Select route, delivery person, and at least one order');
      return;
    }

    try {
      setIsSaving(true);
      const batch = await createDispatchBatch({
        dispatchDate,
        companyId: companyId ? Number(companyId) : undefined,
        routeId: Number(routeId),
        deliveryPersonId: Number(deliveryPersonId),
        marketArea: marketArea || undefined,
        note: note || undefined,
        orderIds: selectedOrderIds,
      });
      showSuccessToast('Dispatch batch created successfully');
      router.push(`/delivery-ops/batches/${batch.id}`);
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to create dispatch batch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-700">
          Dispatch Builder
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Create Morning Dispatch Batch
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Group confirmed orders into one controlled batch for the delivery man and market route.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <PageCard title="Batch Filters" description="Define the morning run before selecting orders.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(event) => setDispatchDate(event.target.value)}
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
                  <option value="">Select route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Delivery Man
                </label>
                <select
                  value={deliveryPersonId}
                  onChange={(event) => setDeliveryPersonId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="">Select delivery person</option>
                  {deliveryPeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Market Area
                </label>
                <input
                  value={marketArea}
                  onChange={(event) => setMarketArea(event.target.value)}
                  placeholder="Optional market zone / block"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Batch Note
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Morning loading notes, route caution, or batch remarks"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </div>
            </div>
          </PageCard>

          <PageCard
            title="Eligible Orders"
            description="Only confirmed or assigned orders not already locked in another active batch appear here."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOrderIds.length === orders.length && orders.length > 0) {
                      setSelectedOrderIds([]);
                    } else {
                      setSelectedOrderIds(orders.map((o) => o.id));
                    }
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {selectedOrderIds.length === orders.length && orders.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search shop or note"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm"
                  />
                </div>
              </div>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-6 py-4">Pick</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16">
                        <StateMessage
                          title="No orders ready for dispatch"
                          description="Try another company, route, or date. Orders already dispatched stay hidden."
                        />
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const selected = selectedOrderIds.includes(order.id);
                      const qty = order.items.reduce(
                        (sum, item) => sum + Number(item.quantity) + Number(item.freeQuantity || 0),
                        0,
                      );
                      return (
                        <tr
                          key={order.id}
                          className={`transition ${selected ? 'bg-cyan-50/60' : 'hover:bg-slate-50/60'}`}
                        >
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleOrder(order.id)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl border ${
                                selected
                                  ? 'border-cyan-600 bg-cyan-600 text-white'
                                  : 'border-slate-200 bg-white text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-900">
                              #{String(order.id).padStart(6, '0')}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {formatDate(order.orderDate)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700">
                              {order.shop?.name || 'Direct Order'}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {order.marketArea || order.route?.name || 'Area not tagged'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-black text-slate-900">
                            {formatNumber(qty)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                            {formatCurrency(order.grandTotal)}
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

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Batch Summary
            </p>
            <div className="mt-8 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">Selected Orders</span>
                <span className="text-2xl font-black">{selectedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">Dispatch Qty</span>
                <span className="text-2xl font-black">{formatNumber(totals.quantity)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-sm font-bold text-slate-300">Estimated Value</span>
                <span className="text-3xl font-black text-cyan-300">
                  {formatCurrency(totals.amount)}
                </span>
              </div>
            </div>
          </div>

          <PageCard title="Selected Orders">
            <div className="space-y-3">
              {selectedOrders.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">
                  Pick at least one order to prepare the batch.
                </p>
              ) : (
                selectedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-black text-slate-900">
                      #{String(order.id).padStart(6, '0')}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {order.shop?.name || 'Direct Order'} · {formatCurrency(order.grandTotal)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleCreateBatch}
              disabled={isSaving}
              className="mt-6 w-full rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-cyan-200 transition hover:bg-cyan-800 disabled:opacity-50"
            >
              {isSaving ? 'Creating Batch...' : 'Create Dispatch Batch'}
            </button>
          </PageCard>
        </div>
      </div>
    </div>
  );
}
