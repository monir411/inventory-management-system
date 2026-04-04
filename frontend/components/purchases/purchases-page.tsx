'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCompanies } from '@/lib/api/companies';
import {
  getCompanyWisePayableSummary,
  getPurchases,
} from '@/lib/api/purchases';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type {
  Company,
  CompanyWisePayableSummary,
  Purchase,
} from '@/types/api';

const purchasesPageSize = 10;
const payableSummaryPageSize = 8;

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getFilterDateTime(value: string, boundary: 'start' | 'end') {
  const time = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';

  return new Date(`${value}${time}`).toISOString();
}

function getPurchaseReference(purchase: Purchase) {
  return purchase.referenceNo || `Purchase #${purchase.id}`;
}

export function PurchasesPage() {
  const summarySectionRef = useRef<HTMLDivElement | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payableSummary, setPayableSummary] = useState<
    CompanyWisePayableSummary[]
  >([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [purchasePage, setPurchasePage] = useState(1);
  const [payablePage, setPayablePage] = useState(1);
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  useToastNotification({
    message: error,
    title: 'Could not load purchases',
    tone: 'error',
  });

  const purchaseQuery = useMemo(
    () => ({
      companyId: selectedCompanyId ?? undefined,
      fromDate: fromDate ? getFilterDateTime(fromDate, 'start') : undefined,
      toDate: toDate ? getFilterDateTime(toDate, 'end') : undefined,
      search: searchTerm.trim() || undefined,
    }),
    [fromDate, searchTerm, selectedCompanyId, toDate],
  );

  useEffect(() => {
    async function loadFilters() {
      try {
        setIsFilterLoading(true);
        setError(null);
        const companyData = await getCompanies();
        setCompanies(companyData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load purchase filters.',
        );
      } finally {
        setIsFilterLoading(false);
      }
    }

    void loadFilters();
  }, []);

  useEffect(() => {
    async function loadWorkspace() {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;

      try {
        setIsWorkspaceLoading(true);
        setError(null);

        const [purchaseData, payableData] = await Promise.all([
          getPurchases(purchaseQuery),
          getCompanyWisePayableSummary(purchaseQuery),
        ]);

        if (requestId !== latestRequestRef.current) {
          return;
        }

        setPurchases(purchaseData);
        setPayableSummary(payableData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load purchases workspace.',
        );
      } finally {
        if (requestId === latestRequestRef.current) {
          setIsWorkspaceLoading(false);
        }
      }
    }

    void loadWorkspace();
  }, [purchaseQuery]);

  const purchaseStats = useMemo(
    () => ({
      purchaseCount: purchases.length,
      totalAmount: purchases.reduce(
        (sum, purchase) => sum + purchase.totalAmount,
        0,
      ),
      totalPaid: purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0),
      totalPayable: purchases.reduce(
        (sum, purchase) => sum + purchase.payableAmount,
        0,
      ),
    }),
    [purchases],
  );

  const paginatedPurchases = useMemo(() => {
    const startIndex = (purchasePage - 1) * purchasesPageSize;
    return purchases.slice(startIndex, startIndex + purchasesPageSize);
  }, [purchasePage, purchases]);

  const paginatedPayableSummary = useMemo(() => {
    const startIndex = (payablePage - 1) * payableSummaryPageSize;
    return payableSummary.slice(startIndex, startIndex + payableSummaryPageSize);
  }, [payablePage, payableSummary]);

  function resetPages() {
    setPurchasePage(1);
    setPayablePage(1);
  }

  function applyTodayFilter() {
    const today = formatDateInput(new Date());
    setFromDate(today);
    setToDate(today);
    resetPages();
  }

  function applyThisMonthFilter() {
    const today = new Date();
    const firstDay = formatDateInput(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const lastDay = formatDateInput(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
    );

    setFromDate(firstDay);
    setToDate(lastDay);
    resetPages();
  }

  function clearFilters() {
    setSelectedCompanyId(null);
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    resetPages();
  }

  function scrollToPayableSummary() {
    summarySectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Purchases"
        description="Create purchases, track stock-in from supplier buying, and monitor company payable from one backend-connected workspace."
        action={
          <Link
            href="/purchases/create"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            Create purchase
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={searchTerm}
            onChange={(event) => {
              resetPages();
              setSearchTerm(event.target.value);
            }}
            placeholder="Search by reference, company, or note"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />

          <select
            value={selectedCompanyId ?? ''}
            onChange={(event) => {
              resetPages();
              setSelectedCompanyId(
                event.target.value ? Number(event.target.value) : null,
              );
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
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
            onChange={(event) => {
              resetPages();
              setFromDate(event.target.value);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              resetPages();
              setToDate(event.target.value);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={applyTodayFilter}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={applyThisMonthFilter}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            This month
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>

        {isFilterLoading || isWorkspaceLoading ? (
          <LoadingBlock label="Loading purchases workspace..." />
        ) : null}
      </PageCard>

      {!isWorkspaceLoading && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            title="Matching purchases"
            value={String(purchaseStats.purchaseCount)}
            note="Filtered purchases in view"
            tone="dark"
          />
          <SummaryMetric
            title="Purchased amount"
            value={formatCurrency(purchaseStats.totalAmount)}
            note="Total amount across current filters"
            tone="blue"
          />
          <SummaryMetric
            title="Settled amount"
            value={formatCurrency(purchaseStats.totalPaid)}
            note="Payments recorded so far"
            tone="green"
          />
          <button
            type="button"
            onClick={scrollToPayableSummary}
            className="rounded-2xl bg-amber-50 p-5 text-left text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <p className="text-sm">Outstanding payable</p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCurrency(purchaseStats.totalPayable)}
            </p>
            <p className="mt-2 text-sm text-amber-800/80">
              Click to open company payable summary
            </p>
          </button>
        </div>
      ) : null}

      <PageCard
        title="Purchase List"
        description="Review purchase records, confirm payable status, and jump into purchase details or company payable ledgers."
      >
        {isWorkspaceLoading ? <LoadingBlock label="Loading purchase list..." /> : null}
        {!isWorkspaceLoading && !error ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Reference</th>
                    <th className="px-3 py-3 font-medium">Company</th>
                    <th className="px-3 py-3 font-medium">Purchase date</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Paid</th>
                    <th className="px-3 py-3 font-medium">Payable</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className={purchase.payableAmount > 0 ? 'bg-amber-50/30' : ''}
                    >
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {getPurchaseReference(purchase)}
                        </div>
                        <div className="text-xs text-slate-500">#{purchase.id}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {purchase.company?.name ?? `Company #${purchase.companyId}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {purchase.company?.code ?? ''}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatDate(purchase.purchaseDate)}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatCurrency(purchase.paidAmount)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(purchase.payableAmount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {purchase.payableAmount > 0 ? 'Need settlement' : 'Settled'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {purchase.payableAmount > 0
                              ? 'Settle payable'
                              : 'View details'}
                          </Link>
                          <Link
                            href={`/purchases/companies/${purchase.companyId}`}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Company ledger
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purchases.length === 0 ? (
              <div className="pt-4">
                <StateMessage
                  title="No purchases found"
                  description="Create a purchase first, or widen the current company, search, and date filters."
                />
              </div>
            ) : null}

            <Pagination
              currentPage={purchasePage}
              totalItems={purchases.length}
              pageSize={purchasesPageSize}
              onPageChange={setPurchasePage}
            />
          </>
        ) : null}
      </PageCard>

      <div ref={summarySectionRef}>
        <PageCard
          title="Company-wise Payable Summary"
          description="See which companies currently carry outstanding purchase payable and open the full payable ledger for each one."
        >
          {isWorkspaceLoading ? <LoadingBlock label="Loading payable summary..." /> : null}
          {!isWorkspaceLoading && !error ? (
            <>
              <PayableSummaryTable rows={paginatedPayableSummary} />
              {payableSummary.length === 0 ? (
                <div className="pt-4">
                  <StateMessage
                    title="No payable companies"
                    description="Companies with outstanding purchase payable will appear here after you create purchases and before they are fully settled."
                  />
                </div>
              ) : null}
              <Pagination
                currentPage={payablePage}
                totalItems={payableSummary.length}
                pageSize={payableSummaryPageSize}
                onPageChange={setPayablePage}
              />
            </>
          ) : null}
        </PageCard>
      </div>
    </div>
  );
}

function SummaryMetric({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  tone: 'dark' | 'green' | 'blue';
}) {
  const toneClassName = {
    dark: 'bg-slate-900 text-white',
    green: 'bg-emerald-50 text-emerald-900',
    blue: 'bg-cyan-50 text-cyan-900',
  }[tone];

  const noteClassName = tone === 'dark' ? 'text-slate-300' : 'text-current/70';

  return (
    <div className={`rounded-2xl p-5 ${toneClassName}`}>
      <p className="text-sm">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className={`mt-2 text-sm ${noteClassName}`}>{note}</p>
    </div>
  );
}

function PayableSummaryTable({
  rows,
}: {
  rows: CompanyWisePayableSummary[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Purchases</th>
            <th className="px-3 py-3 font-medium">Payable Purchases</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Paid</th>
            <th className="px-3 py-3 font-medium">Outstanding</th>
            <th className="px-3 py-3 font-medium">Last Purchase</th>
            <th className="px-3 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.companyId}>
              <td className="px-3 py-4">
                <div className="font-medium text-slate-900">{row.companyName}</div>
                <div className="text-xs text-slate-500">{row.companyCode}</div>
              </td>
              <td className="px-3 py-4 text-slate-700">{row.purchaseCount}</td>
              <td className="px-3 py-4 text-slate-700">
                {row.payablePurchaseCount}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.totalAmount)}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.totalPaid)}
              </td>
              <td className="px-3 py-4 font-medium text-amber-700">
                {formatCurrency(row.totalPayable)}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : 'No purchase'}
              </td>
              <td className="px-3 py-4">
                <Link
                  href={`/purchases/companies/${row.companyId}`}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open ledger
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
