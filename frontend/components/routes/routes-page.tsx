'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoute, getRoutes, updateRoute } from '@/lib/api/routes';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import type { Route } from '@/types/api';

const routesPageSize = 10;
const initialFormState = {
  name: '',
  area: '',
  isActive: true,
};

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
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
    title: 'Could not load routes',
    tone: 'error',
  });
  useToastNotification({
    message: formError,
    title: 'Could not save route',
    tone: 'error',
  });
  useToastNotification({
    message: successMessage,
    title: 'Saved',
    tone: 'success',
  });

  useEffect(() => {
    async function loadRoutes() {
      try {
        setIsLoading(true);
        setError(null);
        const routeData = await getRoutes(searchTerm);
        setRoutes(routeData);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load routes.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadRoutes();
  }, [searchTerm]);

  useEffect(() => {
    if (editingRoute) {
      setFormState({
        name: editingRoute.name,
        area: editingRoute.area ?? '',
        isActive: editingRoute.isActive,
      });
      return;
    }

    setFormState(initialFormState);
  }, [editingRoute]);

  const paginatedRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * routesPageSize;
    return routes.slice(startIndex, startIndex + routesPageSize);
  }, [currentPage, routes]);

  async function refreshRoutes() {
    const routeData = await getRoutes(searchTerm);
    setRoutes(routeData);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      setIsSaving(true);

      const payload = {
        name: formState.name,
        area: formState.area || undefined,
        isActive: formState.isActive,
      };

      if (editingRoute) {
        await updateRoute(editingRoute.id, payload);
        setSuccessMessage(`Route "${payload.name}" updated successfully.`);
      } else {
        await createRoute(payload);
        setSuccessMessage(`Route "${payload.name}" created successfully.`);
      }

      setEditingRoute(null);
      setFormState(initialFormState);
      setCurrentPage(1);
      await refreshRoutes();
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Failed to save route.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
      <PageCard
        title="Routes"
        description="Manage route master data used later for route-based sales and shop assignment."
        action={
          <input
            value={searchTerm}
            onChange={(event) => {
              setCurrentPage(1);
              setSearchTerm(event.target.value);
            }}
            placeholder="Search by route name or area"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />
        }
      >
        {isLoading ? <LoadingBlock label="Loading routes..." /> : null}
        {!isLoading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Route Name</th>
                  <th className="px-3 py-3 font-medium">Area</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRoutes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-3 py-4 font-medium text-slate-900">{route.name}</td>
                    <td className="px-3 py-4 text-slate-700">{route.area || 'No area'}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          route.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setEditingRoute(route)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {routes.length === 0 ? (
              <div className="pt-4">
                <StateMessage
                  title="No routes found"
                  description="Add a route to begin managing route-based data."
                />
              </div>
            ) : null}
            <Pagination
              currentPage={currentPage}
              totalItems={routes.length}
              pageSize={routesPageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title={editingRoute ? 'Edit Route' : 'Add Route'}
        description="Use this form to create a route or update route master data. After save, you can quickly continue with the next route."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Route name</span>
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Route name"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Area</span>
            <input
              value={formState.area}
              onChange={(event) =>
                setFormState((current) => ({ ...current, area: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Optional area"
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
            Route is active
          </label>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
            Add routes one after another here. After each save, the form resets so you can continue entering the next route quickly.
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : editingRoute ? 'Update route' : 'Add route'}
            </button>
            {editingRoute ? (
              <button
                type="button"
                onClick={() => setEditingRoute(null)}
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
