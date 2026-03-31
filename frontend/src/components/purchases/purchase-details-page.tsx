'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getPurchase } from '@/lib/api/purchases';
import type { PurchaseDetails } from '@/types/purchase';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

type PurchaseDetailsPageProps = {
  purchaseId: string;
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

export function PurchaseDetailsPage({ purchaseId }: PurchaseDetailsPageProps) {
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void getPurchase(purchaseId)
      .then((response) => {
        setPurchase(response);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load purchase.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [purchaseId]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Purchase Details"
        title={purchase ? purchase.purchaseNo : 'Purchase details'}
        description="Quick details view so the operator can confirm company, warehouse, item lines, and total amount."
      />

      <div className="flex justify-end">
        <Link
          href="/purchases"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--text)]"
        >
          Back to list
        </Link>
      </div>

      {loading ? <p className="text-sm text-[var(--muted)]">Loading purchase details...</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {purchase ? (
        <>
          <SectionCard title="Purchase summary" description="Header information for this purchase.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Purchase no</p>
                <p className="mt-2 font-semibold text-[var(--text)]">{purchase.purchaseNo}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Date</p>
                <p className="mt-2 font-semibold text-[var(--text)]">{formatDate(purchase.purchaseDate)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Company</p>
                <p className="mt-2 font-semibold text-[var(--text)]">{purchase.company.name}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Warehouse</p>
                <p className="mt-2 font-semibold text-[var(--text)]">{purchase.warehouse.name}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Supplier invoice</p>
                <p className="mt-2 text-[var(--text)]">{purchase.supplierInvoiceNo || 'Not provided'}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#fff0d8] px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Total amount</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text)]">
                  {formatCurrency(purchase.totalAmount)}
                </p>
              </div>
            </div>

            {purchase.note ? (
              <div className="mt-4 rounded-[1.5rem] bg-white/90 px-4 py-4">
                <p className="text-sm text-[var(--muted)]">Note</p>
                <p className="mt-2 text-[var(--text)]">{purchase.note}</p>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Item lines" description="Product, quantity, rate, and amount.">
            <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
              <div className="hidden grid-cols-5 gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:grid">
                <div>Product</div>
                <div>Code</div>
                <div>Qty</div>
                <div>Rate</div>
                <div>Amount</div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {purchase.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 px-5 py-4 md:grid-cols-5 md:items-center md:gap-4"
                  >
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                        Product
                      </span>
                      <p className="font-semibold text-[var(--text)]">{item.product.name}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                        Code
                      </span>
                      <p className="text-sm text-[var(--text)]">{item.product.code}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                        Qty
                      </span>
                      <p className="text-sm text-[var(--text)]">{item.quantity}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                        Rate
                      </span>
                      <p className="text-sm text-[var(--text)]">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                        Amount
                      </span>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

