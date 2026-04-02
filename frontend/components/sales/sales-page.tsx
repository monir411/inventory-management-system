'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getCompanies } from '@/lib/api/companies';
import { getRoutes } from '@/lib/api/routes';
import {
  getCompanyWiseDueSummary,
  getDueOverview,
  getCompanyWiseSalesSummary,
  getMonthlySalesSummary,
  getRouteWiseDueSummary,
  getRouteWiseSalesSummary,
  getSales,
  getShopWiseDueSummary,
  getTodayProfitSummary,
  getTodaySalesSummary,
} from '@/lib/api/sales';
import { getShops } from '@/lib/api/shops';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type {
  Company,
  CompanyWiseDueSummary,
  CompanyWiseSalesSummary,
  DueOverviewSummary,
  MonthlySalesSummary,
  Route,
  RouteWiseDueSummary,
  RouteWiseSalesSummary,
  Sale,
  Shop,
  ShopWiseDueSummary,
  TodayProfitSummary,
  TodaySalesSummary,
} from '@/types/api';

const salesPageSize = 10;
const summaryPageSize = 8;

type SalesSummaryBundle = {
  todaySales: TodaySalesSummary | null;
  todayProfit: TodayProfitSummary | null;
  monthly: MonthlySalesSummary | null;
  dueOverview: DueOverviewSummary | null;
  routeWise: RouteWiseSalesSummary[];
  companyWise: CompanyWiseSalesSummary[];
  routeWiseDue: RouteWiseDueSummary[];
  shopWiseDue: ShopWiseDueSummary[];
  companyWiseDue: CompanyWiseDueSummary[];
};

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

export function SalesPage() {
  const shopDueSectionRef = useRef<HTMLDivElement | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesTotalItems, setSalesTotalItems] = useState(0);
  const [summaries, setSummaries] = useState<SalesSummaryBundle>({
    todaySales: null,
    todayProfit: null,
    monthly: null,
    dueOverview: null,
    routeWise: [],
    companyWise: [],
    routeWiseDue: [],
    shopWiseDue: [],
    companyWiseDue: [],
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [routeSummaryPage, setRouteSummaryPage] = useState(1);
  const [companySummaryPage, setCompanySummaryPage] = useState(1);
  const [routeDuePage, setRouteDuePage] = useState(1);
  const [shopDuePage, setShopDuePage] = useState(1);
  const [companyDuePage, setCompanyDuePage] = useState(1);
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestSalesRequestRef = useRef(0);
  const latestSummaryRequestRef = useRef(0);

  useToastNotification({
    message: error,
    title: 'Could not load sales',
    tone: 'error',
  });

  const salesQuery = useMemo(
    () => ({
      companyId: selectedCompanyId ?? undefined,
      routeId: selectedRouteId ?? undefined,
      shopId: selectedShopId ?? undefined,
      fromDate: fromDate ? getFilterDateTime(fromDate, 'start') : undefined,
      toDate: toDate ? getFilterDateTime(toDate, 'end') : undefined,
      dueOnly: dueOnly || undefined,
      search: searchTerm.trim() || undefined,
    }),
    [
      dueOnly,
      fromDate,
      searchTerm,
      selectedCompanyId,
      selectedRouteId,
      selectedShopId,
      toDate,
    ],
  );

  useEffect(() => {
    async function loadFilters() {
      try {
        setIsFilterLoading(true);
        setError(null);
        const [companyData, routeData, shopData] = await Promise.all([
          getCompanies(),
          getRoutes(),
          getShops(),
        ]);
        setCompanies(companyData);
        setRoutes(routeData);
        setShops(shopData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load sales filters.',
        );
      } finally {
        setIsFilterLoading(false);
      }
    }

    void loadFilters();
  }, []);

  useEffect(() => {
    async function loadRouteShops() {
      try {
        const shopData = await getShops(selectedRouteId ?? undefined);
        setShops(shopData);

        if (
          selectedShopId &&
          !shopData.some((shop) => shop.id === selectedShopId)
        ) {
          setSelectedShopId(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load shops for the selected route.',
        );
      }
    }

    void loadRouteShops();
  }, [selectedRouteId, selectedShopId]);

  useEffect(() => {
    async function loadSalesSummaries() {
      const requestId = latestSummaryRequestRef.current + 1;
      latestSummaryRequestRef.current = requestId;

      try {
        setIsSummaryLoading(true);
        setError(null);

        const [
          todaySales,
          todayProfit,
          monthly,
          dueOverview,
          routeWise,
          companyWise,
          routeWiseDue,
          shopWiseDue,
          companyWiseDue,
        ] = await Promise.all([
          getTodaySalesSummary(salesQuery),
          getTodayProfitSummary(salesQuery),
          getMonthlySalesSummary(salesQuery),
          getDueOverview(salesQuery),
          getRouteWiseSalesSummary(salesQuery),
          getCompanyWiseSalesSummary(salesQuery),
          getRouteWiseDueSummary(salesQuery),
          getShopWiseDueSummary(salesQuery),
          getCompanyWiseDueSummary(salesQuery),
        ]);

        if (requestId !== latestSummaryRequestRef.current) {
          return;
        }

        setSummaries({
          todaySales,
          todayProfit,
          monthly,
          dueOverview,
          routeWise,
          companyWise,
          routeWiseDue,
          shopWiseDue,
          companyWiseDue,
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load sales data.',
        );
      } finally {
        if (requestId === latestSummaryRequestRef.current) {
          setIsSummaryLoading(false);
        }
      }
    }

    void loadSalesSummaries();
  }, [
    salesQuery,
  ]);

  useEffect(() => {
    async function loadSalesPage() {
      const requestId = latestSalesRequestRef.current + 1;
      latestSalesRequestRef.current = requestId;

      try {
        setIsSalesLoading(true);
        setError(null);

        const salesData = await getSales({
          ...salesQuery,
          page: salesPage,
          limit: salesPageSize,
        });

        if (requestId !== latestSalesRequestRef.current) {
          return;
        }

        setSales(salesData.items);
        setSalesTotalItems(salesData.totalItems);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load sales data.',
        );
      } finally {
        if (requestId === latestSalesRequestRef.current) {
          setIsSalesLoading(false);
        }
      }
    }

    void loadSalesPage();
  }, [salesPage, salesQuery]);

  const paginatedRouteSummary = useMemo(() => {
    const startIndex = (routeSummaryPage - 1) * summaryPageSize;
    return summaries.routeWise.slice(startIndex, startIndex + summaryPageSize);
  }, [routeSummaryPage, summaries.routeWise]);

  const paginatedCompanySummary = useMemo(() => {
    const startIndex = (companySummaryPage - 1) * summaryPageSize;
    return summaries.companyWise.slice(
      startIndex,
      startIndex + summaryPageSize,
    );
  }, [companySummaryPage, summaries.companyWise]);

  const paginatedRouteDueSummary = useMemo(() => {
    const startIndex = (routeDuePage - 1) * summaryPageSize;
    return summaries.routeWiseDue.slice(startIndex, startIndex + summaryPageSize);
  }, [routeDuePage, summaries.routeWiseDue]);

  const paginatedShopDueSummary = useMemo(() => {
    const startIndex = (shopDuePage - 1) * summaryPageSize;
    return summaries.shopWiseDue.slice(startIndex, startIndex + summaryPageSize);
  }, [shopDuePage, summaries.shopWiseDue]);

  const paginatedCompanyDueSummary = useMemo(() => {
    const startIndex = (companyDuePage - 1) * summaryPageSize;
    return summaries.companyWiseDue.slice(
      startIndex,
      startIndex + summaryPageSize,
    );
  }, [companyDuePage, summaries.companyWiseDue]);

  const salesListStats = useMemo(
    () => ({
      totalSales: salesTotalItems,
      totalPaid: summaries.dueOverview?.totalPaid ?? 0,
      totalDue: summaries.dueOverview?.totalDue ?? 0,
      dueSaleCount: summaries.dueOverview?.dueSaleCount ?? 0,
    }),
    [salesTotalItems, summaries.dueOverview],
  );
  const isWorkspaceLoading = isFilterLoading || isSummaryLoading;

  function resetAllPages() {
    setSalesPage(1);
    setRouteSummaryPage(1);
    setCompanySummaryPage(1);
    setRouteDuePage(1);
    setShopDuePage(1);
    setCompanyDuePage(1);
  }

  function applyTodayFilter() {
    const today = formatDateInput(new Date());
    setFromDate(today);
    setToDate(today);
    resetAllPages();
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
    resetAllPages();
  }

  function clearFilters() {
    setSearchTerm('');
    setSelectedCompanyId(null);
    setSelectedRouteId(null);
    setSelectedShopId(null);
    setFromDate('');
    setToDate('');
    setDueOnly(false);
    resetAllPages();
  }

  function scrollToShopDueSection() {
    shopDueSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Sales"
        description="Track daily sales, filter by company, route, shop, and date, and monitor due sales and collections from one practical workspace."
        action={
          <Link
            href="/sales/create"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            Create sale
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={searchTerm}
            onChange={(event) => {
              resetAllPages();
              setSearchTerm(event.target.value);
            }}
            placeholder="Search invoice, company, route, or shop"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />

          <select
            value={selectedCompanyId ?? ''}
            onChange={(event) => {
              resetAllPages();
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

          <select
            value={selectedRouteId ?? ''}
            onChange={(event) => {
              resetAllPages();
              setSelectedRouteId(
                event.target.value ? Number(event.target.value) : null,
              );
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

          <select
            value={selectedShopId ?? ''}
            onChange={(event) => {
              resetAllPages();
              setSelectedShopId(
                event.target.value ? Number(event.target.value) : null,
              );
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          >
            <option value="">All shops</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              resetAllPages();
              setFromDate(event.target.value);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              resetAllPages();
              setToDate(event.target.value);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <input
              type="checkbox"
              checked={dueOnly}
              onChange={(event) => {
                resetAllPages();
                setDueOnly(event.target.checked);
              }}
            />
            Show only due sales
          </label>

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

        {isWorkspaceLoading ? <LoadingBlock label="Loading sales workspace..." /> : null}
      </PageCard>

      {!isWorkspaceLoading && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryMetric
            title="Today sales"
            value={formatCurrency(summaries.todaySales?.totalAmount ?? 0)}
            note={`${summaries.todaySales?.saleCount ?? 0} sale(s), due ${formatCurrency(
              summaries.todaySales?.dueAmount ?? 0,
            )}`}
            tone="dark"
          />
          <SummaryMetric
            title="Today profit"
            value={formatCurrency(summaries.todayProfit?.totalProfit ?? 0)}
            note={`${summaries.todayProfit?.saleCount ?? 0} sale(s)`}
            tone="green"
          />
          <SummaryMetric
            title="Today due"
            value={formatCurrency(summaries.dueOverview?.todayDue ?? 0)}
            note={`Collected ${formatCurrency(summaries.dueOverview?.todayPaid ?? 0)}`}
            tone="amber"
          />
          <SummaryMetric
            title="Monthly sales"
            value={formatCurrency(summaries.monthly?.totalAmount ?? 0)}
            note={`Profit ${formatCurrency(summaries.monthly?.totalProfit ?? 0)}`}
            tone="blue"
          />
          <SummaryMetric
            title="Monthly due"
            value={formatCurrency(summaries.dueOverview?.monthlyDue ?? 0)}
            note={`Collected ${formatCurrency(summaries.dueOverview?.monthlyPaid ?? 0)}`}
            tone="amber"
          />
          <SummaryMetric
            title="All due"
            value={formatCurrency(summaries.dueOverview?.totalDue ?? 0)}
            note={`${summaries.dueOverview?.dueSaleCount ?? 0} due sale(s)`}
            tone="rose"
          />
        </div>
      ) : null}

      <PageCard
        title="Sales List"
        description="Review recent sales, understand collected versus outstanding amounts quickly, and jump into sale or shop due details."
      >
        {isSalesLoading ? <LoadingBlock label="Loading sales list..." /> : null}
        {!isSalesLoading && !error ? (
          <>
            <div className="mb-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Matching sales</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {salesListStats.totalSales}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                <p className="text-sm">Collected amount</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(salesListStats.totalPaid)}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                <p className="text-sm">Outstanding due</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(salesListStats.totalDue)}
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToShopDueSection}
                className="rounded-2xl bg-rose-50 p-4 text-left text-rose-900 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <p className="text-sm">Due sales</p>
                <p className="mt-2 text-2xl font-semibold">
                  {salesListStats.dueSaleCount}
                </p>
                <p className="mt-2 text-xs font-medium text-rose-800/80">
                  Click to see which shops have due
                </p>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Company / Route</th>
                    <th className="px-3 py-3 font-medium">Shop</th>
                    <th className="px-3 py-3 font-medium">Sale Date</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Collected</th>
                    <th className="px-3 py-3 font-medium">Due</th>
                    <th className="px-3 py-3 font-medium">Profit</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`align-top text-slate-700 ${
                        sale.dueAmount > 0 ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {sale.invoiceNo}
                        </div>
                        <div className="text-xs text-slate-500">#{sale.id}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {sale.company?.name ?? `Company #${sale.companyId}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.route?.name ?? `Route #${sale.routeId}`}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {sale.shopId ? (
                          <Link
                            href={`/sales/shops/${sale.shopId}`}
                            className="font-medium text-slate-900 underline underline-offset-4"
                          >
                            {sale.shop?.name ?? `Shop #${sale.shopId}`}
                          </Link>
                        ) : (
                          <span className="text-slate-500">No shop</span>
                        )}
                      </td>
                      <td className="px-3 py-4">{formatDate(sale.saleDate)}</td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(sale.paidAmount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.totalAmount > 0
                            ? `${Math.round(
                                (sale.paidAmount / sale.totalAmount) * 100,
                              )}% collected`
                            : '0% collected'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(sale.dueAmount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.dueAmount > 0 ? 'Need collection' : 'Cleared'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {formatCurrency(sale.totalProfit)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            sale.dueAmount > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {sale.dueAmount > 0 ? 'Due' : 'Fully paid'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/sales/${sale.id}`}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {sale.dueAmount > 0 ? 'Collect due' : 'View details'}
                          </Link>
                          {sale.shopId ? (
                            <Link
                              href={`/sales/shops/${sale.shopId}`}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Shop ledger
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {salesTotalItems === 0 ? (
              <div className="pt-4">
                <StateMessage
                  title="No sales found"
                  description="Create a sale first, or widen the current company, route, shop, and date filters."
                />
              </div>
            ) : null}

            <Pagination
              currentPage={salesPage}
              totalItems={salesTotalItems}
              pageSize={salesPageSize}
              onPageChange={setSalesPage}
            />
          </>
        ) : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard
          title="Route-wise Sales Summary"
          description="Check how total sales, paid amounts, due, and profit are distributed across routes."
        >
          <SummaryTable
            rows={paginatedRouteSummary}
            emptyTitle="No route-wise data"
            emptyDescription="Create some sales or relax the filters to see route totals."
            firstColumnLabel="Route"
            firstColumnValue={(item) => item.routeName}
            secondLineValue={(item) => item.routeArea || 'No area'}
          />
          <Pagination
            currentPage={routeSummaryPage}
            totalItems={summaries.routeWise.length}
            pageSize={summaryPageSize}
            onPageChange={setRouteSummaryPage}
          />
        </PageCard>

        <PageCard
          title="Company-wise Sales Summary"
          description="Use this to verify company totals, paid amounts, due amounts, and profit at a glance."
        >
          <SummaryTable
            rows={paginatedCompanySummary}
            emptyTitle="No company-wise data"
            emptyDescription="Create some sales or relax the current filters to see company totals."
            firstColumnLabel="Company"
            firstColumnValue={(item) => item.companyName}
            secondLineValue={(item) => item.companyCode}
          />
          <Pagination
            currentPage={companySummaryPage}
            totalItems={summaries.companyWise.length}
            pageSize={summaryPageSize}
            onPageChange={setCompanySummaryPage}
          />
        </PageCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard
          title="Route-wise Due Summary"
          description="Focus on which routes currently hold the most outstanding due."
        >
          <DueSummaryTable
            rows={paginatedRouteDueSummary}
            emptyTitle="No route-wise due data"
            emptyDescription="Due routes will appear here after you create due sales."
            firstColumnLabel="Route"
            firstColumnValue={(item) => item.routeName}
            secondLineValue={(item) => item.routeArea || 'No area'}
            extraColumnLabel="Shops"
            extraColumnValue={(item) => String(item.shopCount)}
          />
          <Pagination
            currentPage={routeDuePage}
            totalItems={summaries.routeWiseDue.length}
            pageSize={summaryPageSize}
            onPageChange={setRouteDuePage}
          />
        </PageCard>

        <div ref={shopDueSectionRef}>
          <PageCard
          title="Shop-wise Due Summary"
          description="Open any shop ledger to review due sales and payment history for that shop."
        >
          <DueSummaryTable
            rows={paginatedShopDueSummary}
            emptyTitle="No shop-wise due data"
            emptyDescription="Shops with due sales will appear here."
            firstColumnLabel="Shop"
            firstColumnValue={(item) => item.shopName}
            secondLineValue={(item) =>
              `${item.routeName}${item.ownerName ? ` • ${item.ownerName}` : ''}`
            }
            extraColumnLabel="Companies"
            extraColumnValue={(item) => String(item.companyCount)}
            actionForRow={(item) => (
              <Link
                href={`/sales/shops/${item.shopId}`}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Open ledger
              </Link>
            )}
          />
          <Pagination
            currentPage={shopDuePage}
            totalItems={summaries.shopWiseDue.length}
            pageSize={summaryPageSize}
            onPageChange={setShopDuePage}
          />
          </PageCard>
        </div>
      </div>

      <PageCard
        title="Company-wise Due Overview"
        description="See which companies currently carry the most outstanding due and how broadly it is spread across shops."
      >
        <DueSummaryTable
          rows={paginatedCompanyDueSummary}
          emptyTitle="No company due data"
          emptyDescription="Company due totals will appear here after you create due sales."
          firstColumnLabel="Company"
          firstColumnValue={(item) => item.companyName}
          secondLineValue={(item) => item.companyCode}
          extraColumnLabel="Shops"
          extraColumnValue={(item) => String(item.shopCount)}
        />
        <Pagination
          currentPage={companyDuePage}
          totalItems={summaries.companyWiseDue.length}
          pageSize={summaryPageSize}
          onPageChange={setCompanyDuePage}
        />
      </PageCard>
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
  tone: 'dark' | 'green' | 'amber' | 'blue' | 'rose';
}) {
  const toneClassName = {
    dark: 'bg-slate-900 text-white',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
    blue: 'bg-cyan-50 text-cyan-900',
    rose: 'bg-rose-50 text-rose-900',
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

function SummaryTable<T extends {
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  totalProfit: number;
}>({
  rows,
  emptyTitle,
  emptyDescription,
  firstColumnLabel,
  firstColumnValue,
  secondLineValue,
}: {
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
  firstColumnLabel: string;
  firstColumnValue: (row: T) => string;
  secondLineValue: (row: T) => string;
}) {
  if (rows.length === 0) {
    return <StateMessage title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-3 font-medium">{firstColumnLabel}</th>
            <th className="px-3 py-3 font-medium">Sales</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Paid</th>
            <th className="px-3 py-3 font-medium">Due</th>
            <th className="px-3 py-3 font-medium">Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${firstColumnValue(row)}-${index}`}>
              <td className="px-3 py-4">
                <div className="font-medium text-slate-900">
                  {firstColumnValue(row)}
                </div>
                <div className="text-xs text-slate-500">
                  {secondLineValue(row)}
                </div>
              </td>
              <td className="px-3 py-4 text-slate-700">{row.saleCount}</td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.totalAmount)}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.paidAmount)}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(row.dueAmount)}
              </td>
              <td className="px-3 py-4 font-medium text-slate-900">
                {formatCurrency(row.totalProfit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DueSummaryTable<T extends {
  dueSaleCount: number;
  totalDue: number;
  totalPaid: number;
  lastSaleDate: string | null;
}>({
  rows,
  emptyTitle,
  emptyDescription,
  firstColumnLabel,
  firstColumnValue,
  secondLineValue,
  extraColumnLabel,
  extraColumnValue,
  actionForRow,
}: {
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
  firstColumnLabel: string;
  firstColumnValue: (row: T) => string;
  secondLineValue: (row: T) => string;
  extraColumnLabel: string;
  extraColumnValue: (row: T) => string;
  actionForRow?: (row: T) => ReactNode;
}) {
  if (rows.length === 0) {
    return <StateMessage title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={`${firstColumnValue(row)}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {firstColumnValue(row)}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {secondLineValue(row)}
                </p>
              </div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {row.dueSaleCount} due
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {extraColumnLabel}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {extraColumnValue(row)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Collected
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatCurrency(row.totalPaid)}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-600/70">
                  Outstanding
                </p>
                <p className="mt-2 text-lg font-semibold text-amber-800">
                  {formatCurrency(row.totalDue)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Last Sale
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {row.lastSaleDate ? formatDate(row.lastSaleDate) : 'No sale'}
                </p>
              </div>
            </div>

            {actionForRow ? (
              <div className="mt-4 flex justify-end">{actionForRow(row)}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 md:block">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em]">
                {firstColumnLabel}
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em]">
                Due Sales
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em]">
                {extraColumnLabel}
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em]">
                Collected
              </th>
              <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em]">
                Outstanding
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em]">
                Last Sale
              </th>
              {actionForRow ? (
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em]">
                  Action
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr
                key={`${firstColumnValue(row)}-${index}`}
                className="align-top transition hover:bg-slate-50/80"
              >
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">
                    {firstColumnValue(row)}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {secondLineValue(row)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {row.dueSaleCount}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {extraColumnValue(row)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right font-medium tabular-nums text-slate-700">
                  {formatCurrency(row.totalPaid)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right font-semibold tabular-nums text-amber-700">
                  {formatCurrency(row.totalDue)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                  {row.lastSaleDate ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {formatDate(row.lastSaleDate)}
                    </span>
                  ) : (
                    <span className="text-slate-400">No sale</span>
                  )}
                </td>
                {actionForRow ? (
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    {actionForRow(row)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
