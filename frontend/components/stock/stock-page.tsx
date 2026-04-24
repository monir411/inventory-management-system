'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import { getStockSummary, getStockHistory, createStockMovement, StockMovementType } from '@/lib/api/stock';
import { PageCard } from '@/components/ui/page-card';
import { LoadingBlock } from '@/components/ui/loading-block';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import type { Company, Product } from '@/types/api';

export function StockPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [stockList, setStockList] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Filters
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tab, setTab] = useState<'current' | 'history'>('current');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<StockMovementType>('STOCK_IN');
  const [actionForm, setActionForm] = useState({
    productId: '',
    companyId: '',
    quantity: '',
    note: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  useToastNotification({ message: error, title: 'Error', tone: 'error' });
  useToastNotification({ message: success, title: 'Success', tone: 'success' });

  const loadInitial = async () => {
    try {
      setIsLoading(true);
      const [c, p] = await Promise.all([getCompanies(), getProducts()]);
      setCompanies(c);
      setProducts(p);
      await refreshData();
    } catch (e) {
      setError('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const [sumData, histData] = await Promise.all([
        getStockSummary(selectedCompanyId || undefined, debouncedSearch || undefined),
        getStockHistory({
          companyId: selectedCompanyId || undefined,
          type: selectedType || undefined,
          search: debouncedSearch || undefined,
        }),
      ]);
      setSummary(sumData.summary);
      setStockList(sumData.currentStockList);
      setHistory(histData);
    } catch (e) {
      setError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { refreshData(); }, [selectedCompanyId, selectedType, debouncedSearch]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await createStockMovement({
        productId: Number(actionForm.productId),
        companyId: Number(actionForm.companyId),
        type: actionType,
        quantity: actionType === 'DAMAGE' || actionType === 'STOCK_OUT' ? -Math.abs(Number(actionForm.quantity)) : Math.abs(Number(actionForm.quantity)),
        note: actionForm.note,
      });
      setSuccess('Stock updated successfully');
      setShowActionModal(false);
      setActionForm({ productId: '', companyId: '', quantity: '', note: '' });
      setProductSearch('');
      setShowProductList(false);
      await refreshData();
    } catch (e) {
      setError('Failed to perform action');
    } finally {
      setIsSaving(false);
    }
  };

  const openAction = (type: StockMovementType) => {
    setActionType(type);
    setProductSearch('');
    setShowProductList(false);
    setShowActionModal(true);
  };

  if (isLoading) return <LoadingBlock label="Initializing Stock Workspace..." />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[
          { label: 'Products', val: summary?.totalProducts, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Total Qty', val: summary?.totalStockQty, color: 'text-cyan-600', bg: 'bg-cyan-50', unit: 'Qty' },
          { label: 'Stock Value', val: summary?.totalStockValue, color: 'text-emerald-600', bg: 'bg-emerald-50', isMoney: true },
          { label: 'Low Stock', val: summary?.lowStockCount, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Out of Stock', val: summary?.outOfStockCount, color: 'text-rose-600', bg: 'bg-rose-50' },
          
          { label: 'Today Sold', val: summary?.todaySoldQty, color: 'text-indigo-600', bg: 'bg-indigo-50', unit: 'Qty', isSettled: true },
          { label: 'Today Return', val: summary?.todayReturnQty, color: 'text-sky-600', bg: 'bg-sky-50', unit: 'Qty', isSettled: true },
          { label: 'Total Sold', val: summary?.totalSoldQtyAllTime, color: 'text-violet-600', bg: 'bg-violet-50', unit: 'All Time', isSettled: true },
          { label: 'Total Return', val: summary?.totalReturnQtyAllTime, color: 'text-blue-600', bg: 'bg-blue-50', unit: 'All Time', isSettled: true },
          { label: 'Total Delivery', val: summary?.totalDeliveryAmountAllTime, color: 'text-pink-600', bg: 'bg-pink-50', isMoney: true, isSettled: true },
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
            <div key={idx} className={`${kpi.bg} rounded-2xl p-4 border border-white/40 shadow-sm flex flex-col justify-between h-full`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <p className={`mt-1.5 text-lg font-bold truncate ${kpi.color}`}>{displayValue}</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-bold text-slate-400 opacity-60">
                  {kpi.unit || (kpi.isMoney ? 'BDT' : '')}
                </span>
                {kpi.isSettled && (
                  <span className="text-[8px] font-medium text-slate-400 italic">
                    Settled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 px-2 italic -mt-3">* Based on settled deliveries only.</p>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => openAction('OPENING')} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Add Opening Stock</button>
        <button onClick={() => openAction('STOCK_IN')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add Stock In</button>
        <button onClick={() => openAction('ADJUSTMENT')} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Adjustment</button>
        <button onClick={() => openAction('RETURN_IN')} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Return In</button>
        <button onClick={() => openAction('DAMAGE')} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Damage Entry</button>
      </div>

      {/* Filters */}
      <PageCard>
        <div className="grid gap-4 md:grid-cols-5">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Product / SKU..." className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm" />
          <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <option value="">All Movement Types</option>
            <option value="OPENING">Opening</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="RETURN_IN">Return In</option>
            <option value="DAMAGE">Damage</option>
            <option value="SALE">Sale</option>
          </select>
          <div className="md:col-span-2 flex gap-2">
            <button onClick={() => setTab('current')} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'current' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>Current Stock</button>
            <button onClick={() => setTab('history')} className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === 'history' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>Movement History</button>
          </div>
        </div>
      </PageCard>

      {/* Main Table */}
      <PageCard title={tab === 'current' ? 'Current Stock Status' : 'Stock Movement History'}>
        <div className="overflow-x-auto">
          {tab === 'current' ? (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-2 font-semibold">Product</th>
                  <th className="py-3 px-2 font-semibold">Company</th>
                  <th className="py-3 px-2 font-semibold">SKU</th>
                  <th className="py-3 px-2 font-semibold text-center">Stock</th>
                  <th className="py-3 px-2 font-semibold text-right">Value</th>
                  <th className="py-3 px-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-2 text-slate-500">{item.company?.name}</td>
                    <td className="py-3 px-2 font-mono text-xs">{item.sku}</td>
                    <td className={`py-3 px-2 text-center font-bold ${item.currentStock <= 10 ? 'text-rose-600' : 'text-slate-900'}`}>{formatNumber(item.currentStock)} {item.unit}</td>
                    <td className="py-3 px-2 text-right font-semibold">{formatCurrency(item.stockValue)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.currentStock <= 0 ? 'bg-rose-100 text-rose-700' : item.currentStock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.currentStock <= 0 ? 'Out of Stock' : item.currentStock <= 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-2 font-semibold">Date</th>
                  <th className="py-3 px-2 font-semibold">Product</th>
                  <th className="py-3 px-2 font-semibold text-center">Type</th>
                  <th className="py-3 px-2 font-semibold text-center">Qty</th>
                  <th className="py-3 px-2 font-semibold">Note</th>
                  <th className="py-3 px-2 font-semibold">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-900">{item.product?.name}</div>
                      <div className="text-[10px] text-slate-400">{item.company?.name}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.type === 'STOCK_IN' || item.type === 'OPENING' ? 'bg-emerald-100 text-emerald-700' :
                        item.type === 'DAMAGE' || item.type === 'STOCK_OUT' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-center font-bold ${Number(item.quantity) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.quantity}</td>
                    <td className="py-3 px-2 text-slate-500 max-w-xs truncate">{item.note}</td>
                    <td className="py-3 px-2 text-slate-500">{item.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageCard>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{actionType.replace('_', ' ')}</h2>
            <p className="text-sm text-slate-500 mb-6">Enter details for the stock movement.</p>
            
            <form onSubmit={handleAction} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">Company</span>
                <select required value={actionForm.companyId} onChange={e => setActionForm({...actionForm, companyId: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <div className="relative space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">Product</span>
                <input
                  required
                  type="text"
                  placeholder="Search and select product..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => setShowProductList(true)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                />
                {showProductList && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                    {products
                      .filter((p) => !actionForm.companyId || p.companyId === Number(actionForm.companyId))
                      .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setActionForm({ 
                              ...actionForm, 
                              productId: String(p.id),
                              companyId: String(p.companyId) 
                            });
                            setProductSearch(p.name);
                            setShowProductList(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.sku}</div>
                          </div>
                          {actionForm.productId === String(p.id) && <span className="text-emerald-500">✓</span>}
                        </button>
                      ))}
                    {products.filter((p) => !actionForm.companyId || p.companyId === Number(actionForm.companyId)).filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No products found</div>
                    )}
                  </div>
                )}
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">Quantity</span>
                <input required type="number" min="1" value={actionForm.quantity} onChange={e => setActionForm({...actionForm, quantity: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">Note</span>
                <input value={actionForm.note} onChange={e => setActionForm({...actionForm, note: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" placeholder="Reason or reference..." />
              </label>

              <div className="flex gap-3 mt-6">
                <button type="button" disabled={isSaving} onClick={() => setShowActionModal(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer">
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
