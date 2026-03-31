'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getCompanies } from '@/lib/api/companies';
import { getPurchases } from '@/lib/api/purchases';
import type { Company } from '@/types/company';
import type { PurchaseListItem } from '@/types/purchase';
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

export function PurchasesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCompanies({ isActive: true }).then(setCompanies).catch(() => {
      setCompanies([]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    void getPurchases({
      companyId: companyId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: 1,
      limit: 20,
    })
      .then((response) => {
        setPurchases(response.data);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load purchases.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId, fromDate, toDate]);

  const totalVisibleAmount = useMemo(
    () => purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0),
    [purchases],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Purchases"
        title="Purchase list"
        description="Fast purchase list with company and date filters so operators can review entries quickly."
      />

      <SectionCard
        title="Filters"
        description="Keep filters simple and low-click for daily operator use."
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
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
            href="/purchases/new"
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            New purchase
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title="Purchase entries"
        description={`Visible total: ${formatCurrency(totalVisibleAmount)}`}
      >
        {loading ? <p className="text-sm text-[var(--muted)]">Loading purchases...</p> : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        {!loading && !error && purchases.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 px-4 py-6 text-sm text-[var(--muted)]">
            No purchase found for the selected filters.
          </div>
        ) : null}

        {!loading && !error && purchases.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
            <div className="hidden grid-cols-6 gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] lg:grid">
              <div>Purchase No</div>
              <div>Date</div>
              <div>Company</div>
              <div>Items</div>
              <div>Total</div>
              <div>Action</div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-6 lg:items-center lg:gap-4"
                >
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Purchase No
                    </span>
                    <p className="font-semibold text-[var(--text)]">{purchase.purchaseNo}</p>
                    {purchase.supplierInvoiceNo ? (
                      <p className="text-xs text-[var(--muted)]">Invoice: {purchase.supplierInvoiceNo}</p>
                    ) : null}
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Date
                    </span>
                    <p className="text-sm text-[var(--text)]">{formatDate(purchase.purchaseDate)}</p>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Company
                    </span>
                    <p className="text-sm text-[var(--text)]">{purchase.company.name}</p>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Items
                    </span>
                    <p className="text-sm text-[var(--text)]">{purchase.itemCount}</p>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Total
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {formatCurrency(purchase.totalAmount)}
                    </p>
                  </div>

                  <div>
                    <Link
                      href={`/purchases/${purchase.id}`}
                      className="inline-flex rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-[var(--text)]"
                    >
                      View details
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

