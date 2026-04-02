'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getCompanies } from '@/lib/api/companies';
import {
  getCompanyWiseSalesSummary,
  getDueOverview,
  getMonthlySalesSummary,
  getRouteWiseSalesSummary,
  getTodayProfitSummary,
  getTodaySalesSummary,
} from '@/lib/api/sales';
import { getProducts } from '@/lib/api/products';
import { getLowStockProducts, getZeroStockProducts } from '@/lib/api/stock';
import { PageCard } from '@/components/ui/page-card';
import { LoadingBlock } from '@/components/ui/loading-block';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency } from '@/lib/utils/format';
import type {
  Company,
  CompanyWiseSalesSummary,
  DueOverviewSummary,
  MonthlySalesSummary,
  RouteWiseSalesSummary,
  TodayProfitSummary,
  TodaySalesSummary,
} from '@/types/api';

export function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [activeCompanyCount, setActiveCompanyCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [zeroStockCount, setZeroStockCount] = useState<number>(0);
  const [todaySales, setTodaySales] = useState<TodaySalesSummary | null>(null);
  const [todayProfit, setTodayProfit] = useState<TodayProfitSummary | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesSummary | null>(null);
  const [dueOverview, setDueOverview] = useState<DueOverviewSummary | null>(null);
  const [routeWiseSales, setRouteWiseSales] = useState<RouteWiseSalesSummary[]>([]);
  const [companyWiseSales, setCompanyWiseSales] = useState<CompanyWiseSalesSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load dashboard',
    tone: 'error',
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);

        const companyData = await getCompanies();
        setCompanies(companyData);
        setActiveCompanyCount(
          companyData.filter((company) => company.isActive).length,
        );

        const [
          productLists,
          lowStockLists,
          zeroStockLists,
          todaySalesSummary,
          todayProfitSummary,
          monthlySalesSummary,
          dueOverviewSummary,
          routeWiseSummary,
          companyWiseSummary,
        ] = await Promise.all([
          Promise.all(companyData.map((company) => getProducts(company.id))),
          Promise.all(companyData.map((company) => getLowStockProducts(company.id))),
          Promise.all(companyData.map((company) => getZeroStockProducts(company.id))),
          getTodaySalesSummary(),
          getTodayProfitSummary(),
          getMonthlySalesSummary(),
          getDueOverview(),
          getRouteWiseSalesSummary(),
          getCompanyWiseSalesSummary(),
        ]);

        setProductCount(
          productLists.reduce((total, products) => total + products.length, 0),
        );
        setLowStockCount(
          lowStockLists.reduce((total, items) => total + items.length, 0),
        );
        setZeroStockCount(
          zeroStockLists.reduce((total, items) => total + items.length, 0),
        );
        setTodaySales(todaySalesSummary);
        setTodayProfit(todayProfitSummary);
        setMonthlySales(monthlySalesSummary);
        setDueOverview(dueOverviewSummary);
        setRouteWiseSales(routeWiseSummary);
        setCompanyWiseSales(companyWiseSummary);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load dashboard.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const topRoutes = useMemo(
    () =>
      [...routeWiseSales]
        .sort((left, right) => right.totalAmount - left.totalAmount)
        .slice(0, 5),
    [routeWiseSales],
  );

  const topCompanies = useMemo(
    () =>
      [...companyWiseSales]
        .sort((left, right) => right.totalAmount - left.totalAmount)
        .slice(0, 5),
    [companyWiseSales],
  );

  return (
    <div className="space-y-6">
      <PageCard
        title="Dashboard"
        description="A practical view of today’s sales, profit, due, and low stock so daily business activity is visible at a glance."
      >
        {isLoading ? <LoadingBlock label="Loading dashboard..." /> : null}
        {!isLoading && !error ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total companies" value={String(companies.length)} tone="dark" />
            <MetricCard title="Total products" value={String(productCount)} tone="cyan" />
            <MetricCard title="Active companies" value={String(activeCompanyCount)} tone="green" />
            <Link
              href="/stock?view=alerts"
              className="rounded-2xl bg-amber-50 p-5 text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <p className="text-sm">Low / zero stock</p>
              <p className="mt-2 text-3xl font-semibold">
                {lowStockCount} / {zeroStockCount}
              </p>
            </Link>
            <MetricCard
              title="Today sales"
              value={formatCurrency(todaySales?.totalAmount ?? 0)}
              note={`${todaySales?.saleCount ?? 0} sale(s)`}
              tone="dark"
            />
            <MetricCard
              title="Today profit"
              value={formatCurrency(todayProfit?.totalProfit ?? 0)}
              note={`${todayProfit?.saleCount ?? 0} sale(s)`}
              tone="green"
            />
            <MetricCard
              title="Monthly sales"
              value={formatCurrency(monthlySales?.totalAmount ?? 0)}
              note={`Profit ${formatCurrency(monthlySales?.totalProfit ?? 0)}`}
              tone="cyan"
            />
            <Link
              href="/sales"
              className="rounded-2xl bg-rose-50 p-5 text-rose-900 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <p className="text-sm">All due</p>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(dueOverview?.totalDue ?? 0)}
              </p>
              <p className="mt-2 text-sm text-current/70">
                {dueOverview?.dueSaleCount ?? 0} due sale(s)
              </p>
            </Link>
          </div>
        ) : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard
          title="Route-wise Sales Snapshot"
          description="Top routes by sales amount from the current data."
        >
          <SimpleSalesTable
            rows={topRoutes.map((route) => ({
              title: route.routeName,
              subtitle: route.routeArea || 'No area',
              totalAmount: route.totalAmount,
              dueAmount: route.dueAmount,
            }))}
            emptyTitle="No route sales yet"
            emptyDescription="Create sales to see route performance here."
          />
        </PageCard>

        <PageCard
          title="Company-wise Sales Snapshot"
          description="Top companies by sales amount from the current data."
        >
          <SimpleSalesTable
            rows={topCompanies.map((company) => ({
              title: company.companyName,
              subtitle: company.companyCode,
              totalAmount: company.totalAmount,
              dueAmount: company.dueAmount,
            }))}
            emptyTitle="No company sales yet"
            emptyDescription="Create sales to see company performance here."
          />
        </PageCard>
      </div>

      <PageCard
        title="Quick Links"
        description="Jump directly into the most common daily workflows."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <QuickLink
            href="/sales/create"
            title="Create Sale"
            description="Enter a full-paid or due sale."
          />
          <QuickLink
            href="/sales"
            title="Sales Ledger"
            description="Review sales, due, and collections."
          />
          <QuickLink
            href="/shops"
            title="Shops"
            description="Open shops and due ledgers."
          />
          <QuickLink
            href="/stock"
            title="Stock"
            description="Watch stock balances and alerts."
          />
        </div>
      </PageCard>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note?: string;
  tone: 'dark' | 'green' | 'cyan';
}) {
  const className = {
    dark: 'bg-slate-900 text-white',
    green: 'bg-emerald-50 text-emerald-900',
    cyan: 'bg-cyan-50 text-cyan-900',
  }[tone];

  const noteClassName = tone === 'dark' ? 'text-slate-300' : 'text-current/70';

  return (
    <div className={`rounded-2xl p-5 ${className}`}>
      <p className="text-sm">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {note ? <p className={`mt-2 text-sm ${noteClassName}`}>{note}</p> : null}
    </div>
  );
}

function SimpleSalesTable({
  rows,
  emptyTitle,
  emptyDescription,
}: {
  rows: Array<{
    title: string;
    subtitle: string;
    totalAmount: number;
    dueAmount: number;
  }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <StateMessage title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Sales</th>
            <th className="px-3 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={`${row.title}-${row.subtitle}`}>
              <td className="px-3 py-4">
                <div className="font-medium text-slate-900">{row.title}</div>
                <div className="text-xs text-slate-500">{row.subtitle}</div>
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.totalAmount)}
              </td>
              <td className="px-3 py-4 text-amber-700">
                {formatCurrency(row.dueAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 transition hover:bg-white"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
