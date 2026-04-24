'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Filter, Download, 
   Eye, Edit, Trash2, Printer, CheckCircle, 
  XCircle, Clock, Package, Building2, MapPin, 
  Store, ChevronRight, MoreVertical, LayoutGrid,
  TrendingUp, ShoppingCart, AlertCircle, RefreshCw,
  Lock, ShieldAlert, CreditCard, Save
} from 'lucide-react';
import { PageCard } from '@/components/ui/page-card';
import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { useToast } from '@/components/ui/toast-provider';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { 
  getOrders, getOrderStats, deleteOrder, updateOrderStatus, settleOrder 
} from '@/lib/api/orders';
import { useCompanies, useRoutes, useShops } from '@/hooks/use-common-queries';
import Link from 'next/link';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  ASSIGNED: { label: 'Assigned', color: 'bg-cyan-100 text-cyan-700', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-amber-100 text-amber-700', icon: Package },
  PARTIALLY_DELIVERED: { label: 'Partial Delivered', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: ShoppingCart },
  RETURNED_PARTIAL: { label: 'Returned Partial', color: 'bg-rose-100 text-rose-700', icon: RefreshCw },
  CANCELLED: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  SETTLED: { label: 'Settled', color: 'bg-violet-100 text-violet-700', icon: CheckCircle },
};

const PAGE_SIZE = 15;

export function AllOrdersPage() {
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [routeId, setRouteId] = useState<string>('');
  const [shopId, setShopId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Selection & Details
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [settleOrderTarget, setSettleOrderTarget] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

  // Queries
  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();
  const { data: shops = [] } = useShops(routeId ? Number(routeId) : undefined);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const query: any = {
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        companyId: companyId || undefined,
        routeId: routeId || undefined,
        shopId: shopId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await getOrders(query);
      setOrders(data);
    } catch (e) {
      showErrorToast('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setIsStatsLoading(true);
      const data = await getOrderStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats');
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, companyId, routeId, shopId, status, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length > 2 || search.length === 0) {
        fetchOrders();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      setIsActionLoading(id);
      await updateOrderStatus(id, newStatus);
      showSuccessToast(`Order status updated to ${newStatus}`);
      fetchOrders();
      fetchStats();
    } catch (e) {
      showErrorToast('Failed to update status');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      setIsActionLoading(id);
      await deleteOrder(id);
      showSuccessToast('Order deleted successfully');
      fetchOrders();
      fetchStats();
    } catch (e) {
      showErrorToast('Failed to delete order');
    } finally {
      setIsActionLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCompanyId('');
    setRouteId('');
    setShopId('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const setQuickDate = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // already set
    } else if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (type === 'month') {
      start.setDate(now.getDate() - 30);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Manage Order</h1>
          <p className="text-sm font-medium text-slate-500">View and manage all orders across your network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShoppingCart className="h-4 w-4" /> New Order
          </Link>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Total Orders', val: stats?.totalOrders, color: 'text-slate-600', bg: 'bg-slate-50', unit: 'Orders' },
          { label: 'Today Orders', val: stats?.todayOrders, color: 'text-indigo-600', bg: 'bg-indigo-50', unit: 'Orders' },
          { label: 'Order Value', val: stats?.totalOrderValue, color: 'text-blue-600', bg: 'bg-blue-50', isMoney: true },
          { label: 'Today Order Value', val: stats?.todayOrderValue, color: 'text-sky-600', bg: 'bg-sky-50', isMoney: true },
          { label: 'Waiting Orders', val: stats?.waitingOrders, color: 'text-amber-600', bg: 'bg-amber-50', unit: 'Orders' },
          { label: 'Total Dispatch', val: stats?.totalDispatch, color: 'text-cyan-600', bg: 'bg-cyan-50', unit: 'Orders' },
          { label: 'Today Dispatch', val: stats?.todayDispatch, color: 'text-teal-600', bg: 'bg-teal-50', unit: 'Orders' },
          
          { label: 'Total Settlement', val: stats?.totalSettlement, color: 'text-violet-600', bg: 'bg-violet-50', unit: 'Orders' },
          { label: 'Today Settlement', val: stats?.todaySettlement, color: 'text-purple-600', bg: 'bg-purple-50', unit: 'Orders' },
          { label: 'Final Delivery Amount', val: stats?.totalFinalAmount, color: 'text-emerald-600', bg: 'bg-emerald-50', isMoney: true },
          { label: 'Today Final Amount', val: stats?.todayFinalAmount, color: 'text-green-600', bg: 'bg-green-50', isMoney: true },
          { label: 'Due Collection', val: stats?.dueCollection, color: 'text-orange-600', bg: 'bg-orange-50', isMoney: true },
          { label: 'Cancelled Orders', val: stats?.totalCancelled, color: 'text-rose-600', bg: 'bg-rose-50', unit: 'Orders' },
          { label: 'Today Cancelled', val: stats?.todayCancelled, color: 'text-pink-600', bg: 'bg-pink-50', unit: 'Orders' },
        ].map((kpi, idx) => {
          const safeNumber = (value: any) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
          };

          const amount = safeNumber(kpi.val);
          const displayValue = kpi.isMoney 
            ? `BDT ${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : amount.toLocaleString("en-BD");

          return (
            <div key={idx} className={`${kpi.bg} rounded-2xl p-4 border border-white/40 shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-md hover:scale-[1.02]`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <p className={`mt-1.5 text-lg font-black truncate ${kpi.color}`}>
                  {isStatsLoading ? '...' : displayValue}
                </p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-bold text-slate-400 opacity-60">
                  {kpi.unit || (kpi.isMoney ? 'BDT' : '')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <PageCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Order No, Shop, Product or Note..."
                className="w-full rounded-2xl border-0 bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                  showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Filter className="h-4 w-4" /> Filters {showFilters && <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Active</span>}
              </button>
              {(search || companyId || routeId || shopId || status || startDate) && (
                <button
                  onClick={clearFilters}
                  className="rounded-2xl bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-4 rounded-2xl bg-slate-50 p-6 border border-slate-100 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company</label>
                <select
                  value={companyId}
                  onChange={e => setCompanyId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Route</label>
                <select
                  value={routeId}
                  onChange={e => setRouteId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Routes</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shop</label>
                <select
                  value={shopId}
                  onChange={e => setShopId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Shops</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="lg:col-span-2 flex items-end gap-2 pb-1">
                {['today', 'yesterday', 'week', 'month'].map(q => (
                  <button
                    key={q}
                    onClick={() => setQuickDate(q as any)}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageCard>

      {/* Main Table */}
      <PageCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-5">Order Info</th>
                <th className="px-6 py-5">Network</th>
                <th className="px-6 py-5">Shop / Customer</th>
                <th className="px-6 py-5 text-center">Items / Qty</th>
                <th className="px-6 py-5 text-right">Total Amount</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                      <p className="text-sm font-bold text-slate-500">Retrieving Orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <StateMessage 
                      title="No orders match your criteria" 
                      description="Try adjusting your filters or creating a new order." 
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="group transition-all hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="block text-left font-black text-slate-900 group-hover:text-indigo-600 transition-colors"
                      >
                        #{order.id.toString().padStart(6, '0')}
                      </button>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Calendar className="h-3 w-3" /> {formatDate(order.orderDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-slate-300" /> {order.company?.name}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <MapPin className="h-3 w-3 text-slate-300" /> {order.route?.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">{order.shop?.name || 'Direct / Walk-in'}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">{order.shop?.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-black text-slate-700">{order.items?.length || 0}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {order.items?.reduce((sum: number, item: any) => sum + Number(item.quantity) + Number(item.freeQuantity), 0) || 0} Units
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-base font-black text-slate-900">{formatCurrency(order.grandTotal)}</p>
                      {order.discountAmount > 0 && (
                        <p className="text-[10px] font-bold text-rose-500">Disc: -{formatCurrency(order.discountAmount)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.color}`}>
                          {(() => {
                            const Icon = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
                            return <><Icon className="h-3 w-3" /> {STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label}</>;
                          })()}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">By {order.createdBy}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            console.log('Viewing order:', order);
                            setSelectedOrder(order);
                          }}
                          className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition-all hover:bg-indigo-100"
                          title="Quick View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                            disabled={isActionLoading === order.id}
                            className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-all hover:bg-emerald-100"
                            title="Confirm Order"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'ASSIGNED')}
                            disabled={isActionLoading === order.id}
                            className="rounded-xl bg-cyan-50 p-2 text-cyan-600 transition-all hover:bg-cyan-100"
                            title="Assign for Delivery"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')}
                            disabled={isActionLoading === order.id}
                            className="rounded-xl bg-amber-50 p-2 text-amber-600 transition-all hover:bg-amber-100"
                            title="Start Delivery"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                            disabled={isActionLoading === order.id}
                            className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-all hover:bg-emerald-100"
                            title="Mark Delivered"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'DELIVERED' && (
                          <button
                            onClick={() => setSettleOrderTarget(order)}
                            disabled={isActionLoading === order.id}
                            className="rounded-xl bg-violet-50 p-2 text-violet-600 transition-all hover:bg-violet-100"
                            title="Settle Order"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        )}
                        {order.status === 'SETTLED' ? (
                          <div className="rounded-xl bg-slate-50 p-2 text-slate-400" title="Locked">
                             <Lock className="h-4 w-4" />
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/orders/${order.id}/edit`}
                              className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-all hover:bg-slate-200 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                console.log('Deleting order:', order.id);
                                handleDelete(order.id);
                              }}
                              disabled={isActionLoading === order.id}
                              className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <Pagination
            currentPage={page}
            totalItems={stats?.totalOrders || orders.length} 
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </PageCard>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black">Order #{selectedOrder.id.toString().padStart(6, '0')}</h2>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG]?.color}`}>
                    {STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG]?.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium opacity-60">Created on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="rounded-2xl bg-white/10 p-3 hover:bg-white/20 transition-colors"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-2xl bg-white/10 p-3 hover:bg-white/20 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-8">
              {/* Info Grid */}
              <div className="grid gap-8 md:grid-cols-3 mb-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer Details</h4>
                  <div className="rounded-3xl bg-slate-50 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <Store className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-slate-900">{selectedOrder.shop?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs font-bold text-slate-500">{selectedOrder.shop?.phone || 'No phone provided'}</p>
                        <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">{selectedOrder.shop?.address || 'No address'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics</h4>
                  <div className="rounded-3xl bg-indigo-50 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm font-bold text-slate-900">{selectedOrder.company?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm font-bold text-slate-900">{selectedOrder.route?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notes & Metadata</h4>
                  <div className="rounded-3xl border border-slate-100 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
                      <p className="text-xs font-medium text-slate-500 italic">
                        {selectedOrder.note || 'No special instructions provided for this order.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4 mb-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Items</h4>
                <div className="overflow-hidden rounded-3xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4 text-center w-12">#</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4 text-center">Qty</th>
                        <th className="px-6 py-4 text-center">Free</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-right">Discount</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="text-sm font-medium text-slate-700">
                          <td className="px-6 py-4 text-center text-slate-300">{idx + 1}</td>
                          <td className="px-6 py-4 font-black text-slate-900">{item.product?.name}</td>
                          <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-bold">{item.freeQuantity || 0}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-6 py-4 text-right text-rose-500">
                            {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Footer */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col justify-end gap-2">
                   <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'CONFIRMED')}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-indigo-700 transition-colors"
                      >
                        Confirm Order
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'ASSIGNED')}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-amber-600 transition-colors"
                      >
                        Assign for Delivery
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors"
                      >
                        Mark Delivered
                      </button>
                   </div>
                </div>
                <div className="rounded-[2rem] bg-slate-900 p-8 text-white space-y-4">
                  <div className="flex justify-between text-sm font-bold opacity-60">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm font-bold text-rose-400">
                      <span>Invoice Discount</span>
                      <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest opacity-40">Grand Total</span>
                    <span className="text-4xl font-black text-emerald-400">{formatCurrency(selectedOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {settleOrderTarget && (
        <SettlementModal 
          order={settleOrderTarget} 
          onClose={() => setSettleOrderTarget(null)} 
          onSettled={() => {
            setSettleOrderTarget(null);
            fetchOrders();
            fetchStats();
          }} 
        />
      )}
    </div>
  );
}

function SettlementModal({ order, onClose, onSettled }: { order: any, onClose: () => void, onSettled: () => void }) {
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [returnState, setReturnState] = useState<Record<number, { returned: string, damaged: string }>>(
    Object.fromEntries(order.items.map((i: any) => [i.productId, { returned: '0', damaged: '0' }]))
  );
  const [collectedAmount, setCollectedAmount] = useState(order.grandTotal.toString());
  const [note, setNote] = useState('');

  const calculateFinals = () => {
    let totalSold = 0;
    const items = order.items.map((item: any) => {
      const state = returnState[item.productId] || { returned: '0', damaged: '0' };
      const returned = Number(state.returned || 0);
      const damaged = Number(state.damaged || 0);
      const dispatched = Number(item.quantity) + Number(item.freeQuantity || 0);
      const delivered = Math.max(0, dispatched - returned - damaged);
      
      const unitPriceAfterDiscount = Number(item.quantity) > 0 
        ? Number(item.lineTotal) / Number(item.quantity) 
        : 0;
      
      const chargeableDelivered = Math.max(0, Math.min(Number(item.quantity), delivered));
      const itemSoldAmount = chargeableDelivered * unitPriceAfterDiscount;
      totalSold += itemSoldAmount;

      return {
        productId: item.productId,
        productName: item.product.name,
        dispatched,
        delivered,
        returned,
        damaged,
        soldAmount: itemSoldAmount
      };
    });

    return { items, totalSold };
  };

  const { items: displayItems, totalSold } = calculateFinals();

  const handleSettle = async () => {
    try {
      setIsSaving(true);
      const payload = {
        items: Object.entries(returnState).map(([productId, state]) => ({
          productId: Number(productId),
          returnedQuantity: Number(state.returned || 0),
          damagedQuantity: Number(state.damaged || 0),
        })),
        collectedAmount: Number(collectedAmount || 0),
        settlementNote: note,
      };

      await settleOrder(order.id, payload);
      showSuccessToast('Order settled successfully');
      onSettled();
    } catch (e: any) {
      showErrorToast(e.message || 'Failed to settle order');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-violet-900 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">Settle Order #{order.id.toString().padStart(6, '0')}</h2>
            <p className="text-sm opacity-60">Finalize returns, damages and payment collection</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white/10 p-2 hover:bg-white/20 transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr className="font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4 text-center">Dispatch</th>
                    <th className="px-6 py-4 text-center">Return</th>
                    <th className="px-6 py-4 text-center">Damage</th>
                    <th className="px-6 py-4 text-center">Sold</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayItems.map((item) => (
                    <tr key={item.productId} className="font-medium">
                      <td className="px-6 py-4 font-black text-slate-900">{item.productName}</td>
                      <td className="px-6 py-4 text-center">{item.dispatched}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={returnState[item.productId]?.returned}
                          onChange={e => setReturnState(prev => ({ ...prev, [item.productId]: { ...prev[item.productId], returned: e.target.value } }))}
                          className="w-16 rounded-lg bg-slate-100 border-0 p-1.5 text-center font-black text-rose-600 focus:ring-2 focus:ring-rose-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={returnState[item.productId]?.damaged}
                          onChange={e => setReturnState(prev => ({ ...prev, [item.productId]: { ...prev[item.productId], damaged: e.target.value } }))}
                          className="w-16 rounded-lg bg-slate-100 border-0 p-1.5 text-center font-black text-amber-600 focus:ring-2 focus:ring-amber-500/20"
                        />
                      </td>
                      <td className="px-6 py-4 text-center font-black text-emerald-600">{item.delivered}</td>
                      <td className="px-6 py-4 text-right font-black">{formatCurrency(item.soldAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Collected Amount</label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={collectedAmount}
                      onChange={e => setCollectedAmount(e.target.value)}
                      className="w-full rounded-2xl bg-slate-100 border-0 py-3 pl-11 pr-4 text-sm font-black focus:ring-2 focus:ring-violet-500/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Settlement Note</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-slate-100 border-0 p-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 h-24"
                    placeholder="Add any remarks for this settlement..."
                  />
                </div>
              </div>

              <div className="rounded-[2rem] bg-slate-900 p-8 text-white space-y-4 h-fit">
                <div className="flex justify-between items-center text-sm font-bold opacity-60">
                  <span>Calculated Sold Value</span>
                  <span>{formatCurrency(totalSold)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-rose-400">
                  <span>Collected</span>
                  <span>-{formatCurrency(Number(collectedAmount || 0))}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest opacity-40">Final Due</span>
                  <span className="text-3xl font-black text-amber-400">
                    {formatCurrency(Math.max(0, totalSold - Number(collectedAmount || 0)))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-6 flex justify-end gap-3 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={isSaving}
            className="rounded-2xl bg-violet-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Confirm Settlement
          </button>
        </div>
      </div>
    </div>
  );
}
