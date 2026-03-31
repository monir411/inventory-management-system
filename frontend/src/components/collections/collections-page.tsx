'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getCollections } from '@/lib/api/collections';
import { getRoutes } from '@/lib/api/routes';
import type { CollectionItem } from '@/types/collection';
import type { RouteItem } from '@/types/route';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA').format(new Date(value));
}

export function CollectionsPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [routeId, setRouteId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getRoutes({ isActive: true }).then(setRoutes).catch(() => {
      setRoutes([]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void getCollections({
      routeId: routeId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: 1,
      limit: 20,
    })
      .then((response) => {
        setCollections(response.data);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load collections.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [routeId, fromDate, toDate]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Collections"
        title="Route collections"
        description="Simple route-based collection list with clean filters. No customer or shop tracking is used here."
      />

      <SectionCard
        title="Filters"
        description="Filter route-wise collections by route and date range."
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <select
            value={routeId}
            onChange={(event) => setRouteId(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">All routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          />

          <Link
            href="/collections/new"
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            Add collection
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title="Collection list"
        description="Low-click route-wise collection entries for daily operator work."
      >
        {loading ? <p className="text-sm text-[var(--muted)]">Loading collections...</p> : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        {!loading && !error && collections.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 px-4 py-6 text-sm text-[var(--muted)]">
            No collection found for the selected filters.
          </div>
        ) : null}

        {!loading && !error && collections.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
            <div className="hidden grid-cols-6 gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] lg:grid">
              <div>No</div>
              <div>Route</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Method</div>
              <div>Action</div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-6 lg:items-center lg:gap-4"
                >
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      No
                    </span>
                    <p className="font-semibold text-[var(--text)]">{collection.collectionNo}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Route
                    </span>
                    <p className="text-sm text-[var(--text)]">{collection.route.name}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Date
                    </span>
                    <p className="text-sm text-[var(--text)]">{formatDate(collection.collectionDate)}</p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Amount
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {formatCurrency(collection.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Method
                    </span>
                    <p className="text-sm text-[var(--text)]">{collection.paymentMethod || '-'}</p>
                  </div>
                  <div>
                    <Link
                      href={`/collections/${collection.id}`}
                      className="inline-flex rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-[var(--text)]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
