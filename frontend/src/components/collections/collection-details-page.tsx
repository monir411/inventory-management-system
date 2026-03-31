'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getCollection } from '@/lib/api/collections';
import type { CollectionItem } from '@/types/collection';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

type CollectionDetailsPageProps = {
  collectionId: string;
};

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

export function CollectionDetailsPage({ collectionId }: CollectionDetailsPageProps) {
  const [collection, setCollection] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void getCollection(collectionId)
      .then((response) => {
        setCollection(response);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load collection.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [collectionId]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Collection Details"
        title={collection ? collection.collectionNo : 'Collection details'}
        description="Simple route-based collection detail view."
      />

      <div className="flex justify-end">
        <Link
          href="/collections"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--text)]"
        >
          Back to list
        </Link>
      </div>

      {loading ? <p className="text-sm text-[var(--muted)]">Loading collection details...</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {collection ? (
        <SectionCard
          title="Collection summary"
          description="Only route, date, amount, and note are shown to keep it practical."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Collection no</p>
              <p className="mt-2 font-semibold text-[var(--text)]">{collection.collectionNo}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Route</p>
              <p className="mt-2 font-semibold text-[var(--text)]">{collection.route.name}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#fff0d8] px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Amount</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                {formatCurrency(collection.amount)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Date</p>
              <p className="mt-2 font-semibold text-[var(--text)]">{formatDate(collection.collectionDate)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Payment method</p>
              <p className="mt-2 text-[var(--text)]">{collection.paymentMethod || 'Not provided'}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Note</p>
              <p className="mt-2 text-[var(--text)]">{collection.note || 'No note'}</p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

