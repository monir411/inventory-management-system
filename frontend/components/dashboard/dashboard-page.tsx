'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/lib/api/dashboard';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/format';
import { useAuth } from '../auth/auth-provider';
import {
  ShoppingCart, TrendingUp, Wallet, Clock, Package, Layers,
  AlertTriangle, AlertCircle, DollarSign, Box, BarChart2,
  ArrowRight, Building2, CheckCircle2, Receipt, Truck,
  Ban, TrendingDown, History, PieChart, Activity
} from 'lucide-react';

/* ─── tiny helpers ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className ?? ''}`} />;
}

function KpiCard({
  label, value, sub, accent = 'slate', href,
}: {
  label: string; value: string; sub?: string | React.ReactNode;
  accent?: string; href?: string;
}) {
  const themes: Record<string, string> = {
    blue: 'bg-indigo-50/50 border-indigo-100/20 text-indigo-600',
    emerald: 'bg-emerald-50/50 border-emerald-100/20 text-emerald-600',
    amber: 'bg-amber-50/50  border-amber-100/20  text-amber-600',
    rose: 'bg-rose-50/50   border-rose-100/20   text-rose-600',
    slate: 'bg-slate-50/50  border-slate-100/20  text-slate-600',
    violet: 'bg-violet-50/50 border-violet-100/20 text-violet-600',
    cyan: 'bg-cyan-50/50   border-cyan-100/20   text-cyan-600',
  };

  const valueColors: Record<string, string> = {
    blue: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-600',
    violet: 'text-violet-600',
    cyan: 'text-cyan-600',
  };

  const content = (
    <div className={`h-full rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${themes[accent] ?? themes.slate}`}>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-2">{label}</p>
        <p className={`text-2xl font-black tracking-tight ${valueColors[accent] ?? 'text-slate-900'}`}>
          {value}
        </p>
      </div>
      {sub && (
        <div className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          {sub}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

/* ─── main component ─── */
export function DashboardPage() {
  const { user } = useAuth();

  const { data: d, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => getDashboardMetrics(),
    refetchInterval: 30000, // refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-dashed border-slate-200">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <p className="mt-4 text-lg font-bold text-slate-900">Failed to load dashboard</p>
          <p className="text-sm text-slate-500">Please check your connection or try again later.</p>
        </div>
      </div>
    );
  }

  const sales = d.salesOverview;
  const daily = d.dailyOperations;
  const logistics = d.deliveryAndPending;
  const stock = d.stockOverview;

  return (
    <div className="space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Enterprise Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time business intelligence for <span className="font-semibold text-slate-700">Bangladesh Standard Time</span></p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Data</span>
        </div>
      </div>

      {/* ── Sales & Daily Quick Stats ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Sales & Operations</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <KpiCard label="Total Order" value={formatCurrency(sales.totalOrderValue)} sub="Requested" accent="blue" />
          <KpiCard label="Net Sales" value={formatCurrency(sales.netSales)} sub="Settled" accent="emerald" />
          <KpiCard label="Total Profit" value={formatCurrency(sales.totalProfit)} sub="Delivered" accent="violet" />
          <KpiCard label="Today Orders" value={formatCurrency(daily.todayOrders.amount)} sub={`${daily.todayOrders.count} New`} accent="blue" />
          <KpiCard label="Today Dispatch" value={formatNumber(daily.todayDispatch)} sub="Out for delivery" accent="slate" />
          <KpiCard label="Today Settled" value={formatCurrency(daily.todaySettled)} sub="Collected" accent="emerald" />
          <KpiCard label="Return Rate" value={`${formatNumber(sales.returnRate)}%`} sub="Loss Rate" accent="rose" />
        </div>
      </section>

      {/* ── Logistics & Stock Stats ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Box className="h-4 w-4 text-cyan-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Logistics & Inventory</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <KpiCard label="Pending Pipeline" value={formatCurrency(logistics.pendingAmount)} sub="In-Transit" accent="amber" />
          <KpiCard label="Settled Value" value={formatCurrency(logistics.totalDeliveredSettled)} sub="Lifetime" accent="cyan" />
          <KpiCard label="Delivery Perf." value={`${formatNumber(logistics.deliveryPerformance)}%`} sub="Success" accent="emerald" />
          <KpiCard label="Stock Value" value={formatCurrency(stock.stockValue)} sub="At Cost" accent="slate" />
          <KpiCard label="Low Stock" value={formatNumber(stock.lowStockCount)} sub="Alerts" accent="amber" />
          <KpiCard label="Out of Stock" value={formatNumber(stock.outOfStockCount)} sub="Urgent" accent="rose" />
          <KpiCard label="Cancelled" value={formatNumber(logistics.totalCancelledOrders)} sub="Total" accent="rose" />
        </div>
      </section>

      {/* ── Section 5: Charts & Tables ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Sales Trend Chart (Last 7 Days) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">7-Day Settlement Trend</h3>
              <p className="text-xs text-slate-500">Daily actual sales value (BD Time)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</span>
            </div>
          </div>

          <div className="flex h-64 items-end gap-2 px-2">
            {d.charts.last7Days.map((day: any, i: number) => {
              const max = Math.max(...d.charts.last7Days.map((x: any) => x.amount), 1);
              const height = (day.amount / max) * 100;
              return (
                <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-2">
                  <div className="invisible absolute -top-10 group-hover:visible z-10 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
                    {formatCurrency(day.amount)}
                  </div>
                  <div
                    className="w-full rounded-t-xl bg-indigo-500 transition-all duration-500 group-hover:bg-indigo-600"
                    style={{ height: `${Math.max(5, height)}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-black text-slate-900">Top 5 Products</h3>
          <div className="space-y-4">
            {d.charts.topProducts.map((p: any, i: number) => {
              const max = d.charts.topProducts[0]?.quantity || 1;
              return (
                <div key={p.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 truncate mr-2">{p.name}</span>
                    <span className="text-xs font-black text-slate-900">{formatNumber(p.quantity)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${(p.quantity / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {d.charts.topProducts.length === 0 && (
              <div className="flex h-40 items-center justify-center text-xs text-slate-400">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Order Pipeline */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-black text-slate-900">Order Pipeline</h3>
          <div className="space-y-3">
            {d.charts.pipeline.map((item: any) => {
              const statusColors: Record<string, string> = {
                CONFIRMED: 'bg-blue-500',
                ASSIGNED: 'bg-indigo-500',
                OUT_FOR_DELIVERY: 'bg-amber-500',
                SETTLED: 'bg-emerald-500',
                CANCELLED: 'bg-rose-500',
                DELIVERED: 'bg-cyan-500',
                PARTIALLY_DELIVERED: 'bg-orange-400',
                RETURNED_PARTIAL: 'bg-slate-400',
                DRAFT: 'bg-slate-200'
              };
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${statusColors[item.status] || 'bg-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-600 truncate">{item.status.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Recent Orders</h3>
              <p className="text-xs text-slate-500">Latest 10 order activities</p>
            </div>
            <Link href="/orders" className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline">
              Manage All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Shop</th>
                  <th className="px-6 py-4 text-right">Order Value</th>
                  <th className="px-6 py-4 text-right">Settled Amt</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {d.recentOrders.map((o: any) => (
                  <tr key={o.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">#{o.id}</p>
                      <p className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                        {formatDate(o.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{o.shopName}</p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(o.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                      {o.status === 'SETTLED' ? formatCurrency(o.actualSoldAmount) : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase ${o.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-700' :
                          o.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {d.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
