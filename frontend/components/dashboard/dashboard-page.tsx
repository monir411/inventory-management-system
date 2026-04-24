'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-queries';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/format';
import { useAuth } from '../auth/auth-provider';
import { canViewProfit } from '@/lib/utils/permissions';
import {
  ShoppingCart, TrendingUp, Wallet, Clock, Package, Layers,
  AlertTriangle, AlertCircle, DollarSign, Box, BarChart2,
  ArrowRight, Building2, CheckCircle2, Receipt, Truck,
} from 'lucide-react';

/* ─── tiny helpers ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className ?? ''}`} />;
}

function KpiCard({
  label, value, sub, icon, accent = 'slate', small, href,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent?: string; small?: boolean; href?: string;
}) {
  const bg: Record<string, string> = {
    blue:    'bg-indigo-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber:   'bg-amber-500  text-white',
    rose:    'bg-rose-600   text-white',
    slate:   'bg-white border border-slate-100 text-slate-900',
    violet:  'bg-violet-600 text-white',
    cyan:    'bg-cyan-600   text-white',
  };
  const iconBg: Record<string, string> = {
    blue:    'bg-white/20 text-white',
    emerald: 'bg-white/20 text-white',
    amber:   'bg-white/20 text-white',
    rose:    'bg-white/20 text-white',
    slate:   'bg-slate-100 text-slate-600',
    violet:  'bg-white/20 text-white',
    cyan:    'bg-white/20 text-white',
  };
  const dark = accent !== 'slate';
  const content = (
    <div className={`h-full rounded-3xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${bg[accent] ?? bg.slate}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${iconBg[accent] ?? iconBg.slate}`}>{icon}</div>
      </div>
      <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-white/60' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 ${small ? 'text-xl' : 'text-2xl'} font-black tracking-tight break-words`}>{value}</p>
      {sub && <p className={`mt-1 text-xs font-medium ${dark ? 'text-white/70' : 'text-slate-500'}`}>{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

function ActionBtn({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: string }) {
  const c: Record<string, string> = {
    blue:    'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
    rose:    'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100',
    violet:  'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100',
  };
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-sm ${c[color] ?? c.blue}`}>
      <span className="shrink-0">{icon}</span>
      {label}
    </Link>
  );
}

/* ─── mini bar chart (SVG, no lib) ─── */
function MiniBarChart({ values, color = '#6366f1' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const H = 56, barW = 8, gap = 4;
  const total = values.length;
  const W = total * (barW + gap) - gap;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {values.map((v, i) => {
        const h = Math.max(4, (v / max) * H);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx={3}
            fill={color}
            opacity={i === total - 1 ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}

/* ─── main component ─── */
export function DashboardPage() {
  const { user } = useAuth();
  const showProfit = canViewProfit(user);

  const {
    companies, todaySales, todayProfit, dueOverview,
    monthlySales, companyWiseSales, stockInvestment, recentSales,
  } = useDashboardData(showProfit);

  useToastNotification({ message: todaySales.error instanceof Error ? todaySales.error.message : null, title: 'Dashboard error', tone: 'error' });

  const topCompanies = useMemo(() =>
    [...(companyWiseSales.data ?? [])].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 6),
    [companyWiseSales.data]);

  const maxCompanySale = topCompanies[0]?.totalAmount ?? 1;

  const collectionRate = useMemo(() => {
    const sales = todaySales.data?.totalAmount ?? 0;
    const paid  = dueOverview.data?.todayPaid ?? 0;
    if (sales === 0) return paid > 0 ? 100 : 0;
    return Math.min(Math.round((paid / sales) * 100), 100);
  }, [todaySales.data, dueOverview.data]);

  /* fake 7-day sparkline from today's data (until daily API exists) */
  const salesSparkline = useMemo(() => {
    const today = todaySales.data?.totalAmount ?? 0;
    const monthly = monthlySales.data?.totalAmount ?? 0;
    const avg = monthly > 0 ? monthly / 30 : 0;
    return [avg * 0.6, avg * 0.9, avg * 0.7, avg * 1.1, avg * 0.85, avg, today];
  }, [todaySales.data, monthlySales.data]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const isLoading = todaySales.isLoading || dueOverview.isLoading || stockInvestment.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here's today's overview.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live</span>
        </div>
      </div>

      {/* ── ROW 1: Today KPIs ── */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Today</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Today Sales"      value={formatCurrency(todaySales.data?.totalAmount ?? 0)}  sub={`${todaySales.data?.saleCount ?? 0} invoices`}    icon={<ShoppingCart className="h-5 w-5" />} accent="blue" href={`/sales?fromDate=${todayStr}&toDate=${todayStr}`} />
          <KpiCard label="Today Orders"     value={formatNumber(todaySales.data?.saleCount ?? 0)}       sub="Invoices today"                                    icon={<Receipt      className="h-5 w-5" />} accent="violet" href={`/sales?fromDate=${todayStr}&toDate=${todayStr}`} />
          {showProfit && (
            <KpiCard label="Today Profit"   value={formatCurrency(todayProfit.data?.totalProfit ?? 0)} sub="Net margin today"                                  icon={<TrendingUp   className="h-5 w-5" />} accent="emerald" />
          )}
          <KpiCard label="Collection"       value={formatCurrency(dueOverview.data?.todayPaid ?? 0)}   sub={`${collectionRate}% efficiency`}                   icon={<Wallet       className="h-5 w-5" />} accent="rose" />
          <KpiCard label="Delivery Status"  value="Today"                                             sub="Track progress"                                   icon={<Truck        className="h-5 w-5" />} accent="amber" href="/delivery-summaries" />
        </div>
      </div>

      {/* ── ROW 2: Stock KPIs ── */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Inventory</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Total Products"  value={formatNumber(stockInvestment.data?.totalProducts ?? 0)}     sub={`${stockInvestment.data?.inStockProducts ?? 0} in stock`}   icon={<Package     className="h-5 w-5" />} accent="slate" small />
          <KpiCard label="Stock Quantity"  value={formatNumber(stockInvestment.data?.companies?.reduce((s: number, c: any) => s + c.totalQuantity, 0) ?? 0)} sub="Units on hand"            icon={<Layers      className="h-5 w-5" />} accent="slate" small />
          <KpiCard label="Stock Value"     value={formatCurrency(stockInvestment.data?.totalInvestment ?? 0)} sub="Capital at cost price"                                      icon={<DollarSign  className="h-5 w-5" />} accent="cyan" small />
        </div>
      </div>

      {/* ── ROW 3: Totals ── */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">This Month</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Total Sales"    value={formatCurrency(monthlySales.data?.totalAmount ?? 0)}  sub={`${monthlySales.data?.saleCount ?? 0} invoices`} icon={<Receipt    className="h-5 w-5" />} accent="slate" small />
          {showProfit && (
            <KpiCard label="Total Profit" value={formatCurrency(monthlySales.data?.totalProfit ?? 0)} sub="Month gross profit"                               icon={<BarChart2  className="h-5 w-5" />} accent="slate" small />
          )}
          <KpiCard label="Total Due"      value={formatCurrency(dueOverview.data?.totalDue ?? 0)}     sub={`${dueOverview.data?.dueSaleCount ?? 0} unpaid invoices`} icon={<AlertCircle className="h-5 w-5" />} accent="rose" small />
        </div>
      </div>

      {/* ── ROW 4: Alerts ── */}
      {((stockInvestment.data?.lowStockProducts ?? 0) > 0 || (stockInvestment.data?.zeroStockProducts ?? 0) > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="rounded-xl bg-amber-200/50 p-2 text-amber-700"><AlertTriangle className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-bold text-amber-900">Low Stock Alert</p>
              <p className="text-sm text-amber-700"><span className="font-black">{stockInvestment.data?.lowStockProducts ?? 0}</span> products are running low</p>
            </div>
            <Link href="/stock?view=low" className="shrink-0 rounded-xl bg-amber-200/60 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors">View</Link>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="rounded-xl bg-rose-200/50 p-2 text-rose-700"><AlertCircle className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-bold text-rose-900">Out of Stock</p>
              <p className="text-sm text-rose-700"><span className="font-black">{stockInvestment.data?.zeroStockProducts ?? 0}</span> products have zero stock</p>
            </div>
            <Link href="/stock?view=zero" className="shrink-0 rounded-xl bg-rose-200/60 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200 transition-colors">View</Link>
          </div>
        </div>
      )}

      {/* ── MAIN GRID: Chart + Company + Recent Sales + Actions ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left col: Chart + Recent Sales */}
        <div className="space-y-6 lg:col-span-2">

          {/* Sales Chart Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sales Overview</h3>
                <p className="mt-0.5 text-xs text-slate-500">Monthly trend · last 7 data points</p>
              </div>
              <MiniBarChart values={salesSparkline} color="#6366f1" />
            </div>

            {/* Monthly breakdown bars */}
            <div className="mt-6 space-y-3">
              {[
                { label: 'Total Sales',      value: monthlySales.data?.totalAmount ?? 0, color: 'bg-indigo-500',  max: monthlySales.data?.totalAmount ?? 1 },
                { label: 'Paid Amount',      value: monthlySales.data?.paidAmount ?? 0,  color: 'bg-emerald-500', max: monthlySales.data?.totalAmount ?? 1 },
                { label: 'Due Amount',       value: monthlySales.data?.dueAmount ?? 0,   color: 'bg-amber-400',   max: monthlySales.data?.totalAmount ?? 1 },
                ...(showProfit ? [{ label: 'Net Profit', value: monthlySales.data?.totalProfit ?? 0, color: 'bg-violet-500', max: monthlySales.data?.totalAmount ?? 1 }] : []),
              ].map(row => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{row.label}</span>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(row.value)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                      style={{ width: `${Math.min((row.value / Math.max(row.max, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Sales</h3>
                <p className="text-xs text-slate-500">Latest 10 invoices</p>
              </div>
              <Link href="/orders" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Shop</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSales.data?.items.map(sale => (
                    <tr key={sale.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <Link href={`/sales/${sale.id}`} className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                          #{sale.invoiceNo}
                        </Link>
                        <p className="text-[10px] text-slate-400">{formatDate(sale.saleDate)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-700">{sale.shop?.name ?? '—'}</p>
                        <p className="text-[10px] text-slate-400">{sale.company?.name}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-bold text-slate-900">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-right flex flex-col items-end gap-1.5">
                        {sale.dueAmount > 0
                          ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700">Due</span>
                          : <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">Paid</span>
                        }
                        {sale.deliveryStatus === 'DELIVERED' ? (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">Delivered</span>
                        ) : sale.deliveryStatus === 'SHIPPED' ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">Shipped</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col: Company Summary + Quick Actions */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Quick Actions</h3>
            <div className="space-y-2">
              <ActionBtn href="/sales/create"      label="New Sale"      icon={<ShoppingCart className="h-4 w-4" />} color="blue"    />
              <ActionBtn href="/stock"              label="Add Stock"     icon={<Package      className="h-4 w-4" />} color="emerald" />
              <ActionBtn href="/sales?dueOnly=true" label="Collect Due"  icon={<DollarSign   className="h-4 w-4" />} color="rose"    />
              <ActionBtn href="/products"           label="Products"     icon={<Box          className="h-4 w-4" />} color="violet"  />
            </div>
          </div>

          {/* Company-wise Sales Summary */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900">Company Sales</h3>
            </div>
            <div className="space-y-4">
              {topCompanies.length === 0 && (
                <p className="text-xs text-slate-400">No data yet.</p>
              )}
              {topCompanies.map((co, i) => (
                <div key={co.companyId}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-[10px] font-black text-slate-300">#{i + 1}</span>
                      <span className="truncate text-xs font-bold text-slate-700">{co.companyName}</span>
                    </div>
                    <span className="shrink-0 text-xs font-black text-slate-900">{formatCurrency(co.totalAmount)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                      style={{ width: `${(co.totalAmount / maxCompanySale) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-slate-400">
                    <span>Paid {formatCurrency(co.paidAmount)}</span>
                    {co.dueAmount > 0 && <span className="text-amber-600">Due {formatCurrency(co.dueAmount)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alert Summary */}
          <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold">Stock Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Low Stock</p>
                  <p className="text-2xl font-black text-amber-400">{stockInvestment.data?.lowStockProducts ?? 0}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-500/50" />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Out of Stock</p>
                  <p className="text-2xl font-black text-rose-400">{stockInvestment.data?.zeroStockProducts ?? 0}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-rose-500/50" />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Healthy Stock</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {(stockInvestment.data?.inStockProducts ?? 0) - (stockInvestment.data?.lowStockProducts ?? 0)}
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-500/50" />
              </div>
              <Link href="/stock" className="block w-full rounded-2xl bg-white/10 py-3 text-center text-xs font-bold transition-all hover:bg-white/20">
                View Full Inventory →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
