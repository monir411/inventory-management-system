'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getRoutes } from '@/lib/api/routes';
import { createShop, getShops, updateShop } from '@/lib/api/shops';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency } from '@/lib/utils/format';
import type { Route, Shop } from '@/types/api';

const shopsPageSize = 12;
const initialFormState = {
  routeId: '',
  name: '',
  ownerName: '',
  phone: '',
  address: '',
  isActive: true,
};

export function ShopsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load shops',
    tone: 'error',
  });
  useToastNotification({
    message: formError,
    title: 'Could not save shop',
    tone: 'error',
  });
  useToastNotification({
    message: successMessage,
    title: 'Saved',
    tone: 'success',
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);
        const routeData = await getRoutes();
        setRoutes(routeData);
        setSelectedRouteId(routeData[0]?.id ?? null);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load routes.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    async function loadShops() {
      try {
        setIsLoading(true);
        setError(null);
        const shopData = await getShops(selectedRouteId ?? undefined, searchTerm);
        setShops(shopData);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load shops.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadShops();
  }, [searchTerm, selectedRouteId]);

  useEffect(() => {
    if (editingShop) {
      setFormState({
        routeId: String(editingShop.routeId),
        name: editingShop.name,
        ownerName: editingShop.ownerName ?? '',
        phone: editingShop.phone ?? '',
        address: editingShop.address ?? '',
        isActive: editingShop.isActive,
      });
      return;
    }

    setFormState({
      ...initialFormState,
      routeId: selectedRouteId ? String(selectedRouteId) : '',
    });
  }, [editingShop, selectedRouteId]);

  const paginatedShops = useMemo(() => {
    const startIndex = (currentPage - 1) * shopsPageSize;
    return shops.slice(startIndex, startIndex + shopsPageSize);
  }, [currentPage, shops]);

  const shopSummary = useMemo(
    () => ({
      totalOrders: shops.reduce(
        (sum, shop) => sum + (shop.totalOrders ?? 0),
        0,
      ),
      totalDue: shops.reduce((sum, shop) => sum + (shop.totalDue ?? 0), 0),
    }),
    [shops],
  );

  async function refreshShops() {
    const shopData = await getShops(selectedRouteId ?? undefined, searchTerm);
    setShops(shopData);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!formState.routeId) {
      setFormError('Please select a route.');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        routeId: Number(formState.routeId),
        name: formState.name,
        ownerName: formState.ownerName || undefined,
        phone: formState.phone || undefined,
        address: formState.address || undefined,
        isActive: formState.isActive,
      };

      if (editingShop) {
        await updateShop(editingShop.id, payload);
        setSuccessMessage(`Shop "${payload.name}" updated successfully.`);
      } else {
        await createShop(payload);
        setSuccessMessage(`Shop "${payload.name}" created successfully.`);
      }

      setEditingShop(null);
      setFormState({
        ...initialFormState,
        routeId: formState.routeId,
      });
      setCurrentPage(1);
      await refreshShops();
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Failed to save shop.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_400px]">
      <PageCard
        title="Shops"
        description="Manage shops under routes and verify route ownership clearly from the browser."
        action={
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => {
                setCurrentPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder="Search by shop, owner, or route"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
            <select
              value={selectedRouteId ?? ''}
              onChange={(event) => {
                setEditingShop(null);
                setCurrentPage(1);
                setSelectedRouteId(event.target.value ? Number(event.target.value) : null);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            >
              <option value="">All routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isLoading ? <LoadingBlock label="Loading shops..." /> : null}
        {!isLoading && !error ? (
          <div>
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Displayed shops</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {shops.length}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-900">
                <p className="text-sm">Total orders</p>
                <p className="mt-2 text-2xl font-semibold">
                  {shopSummary.totalOrders}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                <p className="text-sm">Total due</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(shopSummary.totalDue)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Shop</th>
                  <th className="px-3 py-3 font-medium">Route</th>
                  <th className="px-3 py-3 font-medium">Owner</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Total orders</th>
                  <th className="px-3 py-3 font-medium">Total due</th>
                  <th className="px-3 py-3 font-medium">Address</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedShops.map((shop) => (
                  <tr key={shop.id} className="align-top">
                    <td className="px-3 py-4 font-medium text-slate-900">{shop.name}</td>
                    <td className="px-3 py-4 text-slate-700">
                      {shop.route?.name ?? `Route #${shop.routeId}`}
                    </td>
                    <td className="px-3 py-4 text-slate-700">{shop.ownerName || 'No owner'}</td>
                    <td className="px-3 py-4 text-slate-700">{shop.phone || 'No phone'}</td>
                    <td className="px-3 py-4 text-slate-700">
                      {shop.totalOrders ?? 0}
                    </td>
                    <td className="px-3 py-4 font-medium text-amber-700">
                      {formatCurrency(shop.totalDue ?? 0)}
                    </td>
                    <td className="px-3 py-4 text-slate-700">{shop.address || 'No address'}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          shop.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingShop(shop)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/sales/shops/${shop.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Due ledger
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shops.length === 0 ? (
              <div className="pt-4">
                <StateMessage
                  title="No shops found"
                  description="Create a shop under a route to begin route-based shop testing."
                />
              </div>
            ) : null}
              <Pagination
                currentPage={currentPage}
                totalItems={shops.length}
                pageSize={shopsPageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title={editingShop ? 'Edit Shop' : 'Add Shop'}
        description="Use this form to create a shop under a route or update shop details. Route selection stays in place for faster repeated entry."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Route</span>
            <select
              value={formState.routeId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  routeId: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Shop name</span>
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Shop name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Owner name</span>
            <input
              value={formState.ownerName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  ownerName: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Optional owner name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, phone: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Optional phone"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Address</span>
            <textarea
              value={formState.address}
              onChange={(event) =>
                setFormState((current) => ({ ...current, address: event.target.value }))
              }
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Optional address"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Shop is active
          </label>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
            If you are adding many shops under the same route, choose the route once and keep adding. The route stays selected after each save.
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingShop ? 'Update shop' : 'Add shop'}
            </button>
            {editingShop ? (
              <button
                type="button"
                onClick={() => setEditingShop(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </PageCard>
    </div>
  );
}
