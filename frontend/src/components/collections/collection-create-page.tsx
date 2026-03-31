'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createCollection } from '@/lib/api/collections';
import { getRoutes } from '@/lib/api/routes';
import type { CollectionFormInput } from '@/types/collection';
import type { RouteItem } from '@/types/route';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

type FieldErrors = {
  collectionNo?: string;
  routeId?: string;
  collectionDate?: string;
  amount?: string;
  paymentMethod?: string;
  note?: string;
  form?: string;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function CollectionCreatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [collectionNo, setCollectionNo] = useState('');
  const [routeId, setRouteId] = useState('');
  const [collectionDate, setCollectionDate] = useState(getToday());
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    void getRoutes({ isActive: true })
      .then(setRoutes)
      .catch((error) => {
        setLookupError(error instanceof Error ? error.message : 'Failed to load routes.');
      });
  }, []);

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (collectionNo.trim().length < 2) {
      nextErrors.collectionNo = 'Collection number is required.';
    }

    if (!routeId) {
      nextErrors.routeId = 'Please select a route.';
    }

    if (!collectionDate) {
      nextErrors.collectionDate = 'Collection date is required.';
    }

    if (!amount || Number(amount) <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }

    if (paymentMethod.trim().length > 30) {
      nextErrors.paymentMethod = 'Payment method cannot exceed 30 characters.';
    }

    if (note.trim().length > 500) {
      nextErrors.note = 'Note cannot exceed 500 characters.';
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CollectionFormInput = {
      collectionNo: collectionNo.trim(),
      routeId,
      collectionDate,
      amount: Number(amount),
      paymentMethod: paymentMethod.trim() || undefined,
      note: note.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const collection = await createCollection(payload);
        router.replace(`/collections/${collection.id}`);
      } catch (error) {
        setErrors({
          form: error instanceof Error ? error.message : 'Failed to create collection.',
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="New Collection"
        title="Create collection"
        description="Very simple route-based collection entry for daily use."
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <SectionCard
          title="Collection info"
          description="Only the route, date, amount, and short note are needed."
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Collection no</label>
              <input
                value={collectionNo}
                onChange={(event) => setCollectionNo(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="COL-001"
              />
              {errors.collectionNo ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.collectionNo}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Route</label>
              <select
                value={routeId}
                onChange={(event) => setRouteId(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
              {errors.routeId ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.routeId}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Collection date</label>
              <input
                type="date"
                value={collectionDate}
                onChange={(event) => setCollectionDate(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
              />
              {errors.collectionDate ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.collectionDate}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="0.00"
              />
              {errors.amount ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.amount}</p> : null}
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Payment method</label>
              <input
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="Cash / Bank / Mobile banking"
              />
              {errors.paymentMethod ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.paymentMethod}</p> : null}
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Note</label>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="Optional note"
              />
              {errors.note ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.note}</p> : null}
            </div>
          </div>

          {lookupError ? <p className="mt-4 text-sm text-[var(--danger)]">{lookupError}</p> : null}
        </SectionCard>

        {errors.form ? <p className="text-sm text-[var(--danger)]">{errors.form}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isPending ? 'Saving collection...' : 'Submit collection'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/collections')}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[var(--text)]"
          >
            Back to list
          </button>
        </div>
      </form>
    </div>
  );
}

