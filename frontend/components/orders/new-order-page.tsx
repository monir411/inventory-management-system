'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCompanies } from '@/lib/api/companies';
import { getRoutes } from '@/lib/api/routes';
import { getShops } from '@/lib/api/shops';
import { getProducts } from '@/lib/api/products';
import { getDeliveryPeople } from '@/lib/api/delivery-ops';
import { createOrder, getOrder, updateOrder } from '@/lib/api/orders';
import { PageCard } from '@/components/ui/page-card';
import { LoadingBlock } from '@/components/ui/loading-block';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency } from '@/lib/utils/format';
import type { Company, Route, Shop, Product, DeliveryPerson } from '@/types/api';

interface OrderLine {
  productId: number;
  productName: string;
  quantity: number;
  freeQuantity: number;
  unitPrice: number;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  lineTotal: number;
  // Search state
  searchText?: string;
  showResults?: boolean;
}

export function NewOrderPage({ orderId }: { orderId?: number }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Master Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([]);

  // Form Header
  const [orderDate, setOrderDate] = useState(() => {
    const now = new Date();
    const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // UTC+6
    return bdTime.toISOString().split('T')[0];
  });
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [routeId, setRouteId] = useState<number | ''>('');
  const [shopId, setShopId] = useState<number | ''>('');
  const [deliveryPersonId, setDeliveryPersonId] = useState<number | ''>('');

  // Invoice Discount
  const [invDiscountType, setInvDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [invDiscountValue, setInvDiscountValue] = useState(0);
  const [note, setNote] = useState('');

  // Lines
  const [lines, setLines] = useState<OrderLine[]>([]);

  // Search visibility
  const [showCompResults, setShowCompResults] = useState(false);
  const [showRouteResults, setShowRouteResults] = useState(false);
  const [showShopResults, setShowShopResults] = useState(false);
  const [compSearch, setCompSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');

  // Refs for click outside
  const compRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside one of the main header selects
      if (compRef.current?.contains(event.target as Node) ||
          routeRef.current?.contains(event.target as Node) ||
          shopRef.current?.contains(event.target as Node)) {
        return;
      }

      // Check if clicking inside a product row input or its results
      const isProductClick = (event.target as HTMLElement).closest('.product-row-container');
      if (isProductClick) return;

      setShowCompResults(false);
      setShowRouteResults(false);
      setShowShopResults(false);
      setLines(prev => prev.map(l => ({ ...l, showResults: false })));
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useToastNotification({ message: error, title: 'Error', tone: 'error' });
  useToastNotification({ message: success, title: 'Success', tone: 'success' });

  // Clear after toast fires
  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 100); return () => clearTimeout(t); } }, [error]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 100); return () => clearTimeout(t); } }, [success]);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [c, r, s, p, d] = await Promise.all([
          getCompanies(),
          getRoutes(),
          getShops(),
          getProducts(),
          getDeliveryPeople(),
        ]);
        setCompanies(c);
        setRoutes(r);
        setShops(s);
        setAllProducts(p);
        setDeliveryPeople(d);

        if (orderId) {
          const order = await getOrder(orderId);
          if (order) {
            setOrderDate(new Date(order.orderDate).toISOString().split('T')[0]);
            setCompanyId(order.companyId || '');
            setCompSearch(order.company?.name || '');
            setRouteId(order.routeId || '');
            setRouteSearch(order.route?.name || '');
            setShopId(order.shopId || '');
            setShopSearch(order.shop?.name || '');
            setDeliveryPersonId(order.deliveryPersonId || '');
            setInvDiscountType(order.discountType || 'FIXED');
            setInvDiscountValue(order.discountValue || 0);
            setNote(order.note || '');
            setLines(order.items.map((item) => ({
              productId: item.productId,
              productName: item.product?.name || '',
              quantity: item.quantity,
              freeQuantity: item.freeQuantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              lineTotal: item.lineTotal,
              searchText: item.product?.name || ''
            })));
          }
        }
      } catch (e) {
        setError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const filteredShops = useMemo(() => {
    if (!routeId) return [];
    return shops.filter(s => s.routeId === routeId);
  }, [shops, routeId]);

  // filteredProducts used inline in product dropdown

  const calculateLineTotal = (line: OrderLine) => {
    const gross = line.quantity * line.unitPrice;
    let disc = 0;
    if (line.discountType === 'PERCENT') {
      disc = gross * (line.discountValue / 100);
    } else {
      disc = line.discountValue;
    }
    return gross - disc;
  };

  const addLine = () => {
    setLines([...lines, {
      productId: 0,
      productName: '',
      quantity: 0,
      freeQuantity: 0,
      unitPrice: 0,
      discountType: 'FIXED',
      discountValue: 0,
      lineTotal: 0
    }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, updates: Partial<OrderLine>) => {
    const newLines = [...lines];
    const line = { ...newLines[index], ...updates };
    
    // Auto-price if product changes
    if (updates.productId) {
      const prod = allProducts.find(p => p.id === updates.productId);
      if (prod) {
        line.productName = prod.name;
        line.unitPrice = prod.salePrice;
      }
    }

    line.lineTotal = calculateLineTotal(line);
    newLines[index] = line;
    setLines(newLines);
  };

  // Summary Calculations
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const totalQty = lines.reduce((sum, l) => sum + Number(l.quantity), 0);
  const totalFreeQty = lines.reduce((sum, l) => sum + Number(l.freeQuantity), 0);
  
  const invoiceDiscountAmount = invDiscountType === 'PERCENT' 
    ? subtotal * (invDiscountValue / 100)
    : invDiscountValue;

  const grandTotal = subtotal - invoiceDiscountAmount;

  const handleSave = async () => {
    if (!orderDate || !companyId || !routeId) {
      setError('Please fill in all required fields (Date, Company, Route)');
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one product');
      return;
    }

    if (lines.some(l => l.productId === 0)) {
      setError('Please select a product for all rows or remove empty rows');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        orderDate,
        companyId: Number(companyId),
        routeId: Number(routeId),
        shopId: shopId ? Number(shopId) : undefined,
        deliveryPersonId: deliveryPersonId ? Number(deliveryPersonId) : undefined,
        discountType: invDiscountType,
        discountValue: invDiscountValue,
        note: note.trim() || undefined,
        items: lines.map(l => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          freeQuantity: Number(l.freeQuantity),
          unitPrice: Number(l.unitPrice),
          discountType: l.discountType,
          discountValue: Number(l.discountValue),
        }))
      };

      if (orderId) {
        await updateOrder(orderId, payload);
        setSuccess('Order updated successfully');
      } else {
        await createOrder(payload);
        setSuccess('Order created successfully');
      }
      router.push('/orders'); // Redirect to order management page
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingBlock label="Initializing Order Form..." />;

  return (
    <div className="space-y-6">
      <PageCard title={orderId ? "Edit Order" : "New Order"} description={orderId ? "Update existing order details." : "Create a new order for a shop."}>
        <div className="grid gap-4 md:grid-cols-5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Order Date</span>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" />
          </label>
          
          <div className="relative space-y-1" ref={compRef}>
            <span className="text-xs font-semibold text-slate-500 uppercase">Company</span>
            <input
              type="text"
              placeholder="Search Company..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
              value={compSearch}
              onChange={e => { 
                const val = e.target.value;
                setCompSearch(val); 
                setCompanyId(''); 
                setShowCompResults(true); 
              }}
              onFocus={() => setShowCompResults(true)}
            />
            {showCompResults && (
              <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                {companies.filter(c => c.name.toLowerCase().includes(compSearch.toLowerCase())).map(c => (
                  <button 
                    key={c.id} 
                    type="button"
                    onClick={() => { 
                      setCompanyId(c.id); 
                      setCompSearch(c.name); 
                      setShowCompResults(false); 
                      setLines([]); 
                    }} 
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition cursor-pointer"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative space-y-1" ref={routeRef}>
            <span className="text-xs font-semibold text-slate-500 uppercase">Route</span>
            <input
              type="text"
              placeholder="Search Route..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
              value={routeSearch}
              onChange={e => { 
                const val = e.target.value;
                setRouteSearch(val); 
                setRouteId(''); 
                setShowRouteResults(true); 
              }}
              onFocus={() => setShowRouteResults(true)}
            />
            {showRouteResults && (
              <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                {routes.filter(r => r.name.toLowerCase().includes(routeSearch.toLowerCase())).map(r => (
                  <button 
                    key={r.id} 
                    type="button"
                    onClick={() => { 
                      setRouteId(r.id); 
                      setRouteSearch(r.name); 
                      setShowRouteResults(false); 
                      setShopId(''); 
                      setShopSearch(''); 
                    }} 
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition cursor-pointer"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative space-y-1" ref={shopRef}>
            <span className="text-xs font-semibold text-slate-500 uppercase">Shop</span>
            <input
              type="text"
              placeholder={routeId ? "Search Shop..." : "Select Route First..."}
              className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm ${!routeId ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 cursor-pointer'}`}
              value={shopSearch}
              disabled={!routeId}
              onChange={e => { 
                const val = e.target.value;
                setShopSearch(val); 
                setShopId(''); 
                setShowShopResults(true); 
              }}
              onFocus={() => routeId && setShowShopResults(true)}
            />
            {routeId && showShopResults && (
              <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                {filteredShops.filter(s => s.name.toLowerCase().includes(shopSearch.toLowerCase())).map(s => (
                  <button 
                    key={s.id} 
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShopId(s.id); 
                      setShopSearch(s.name); 
                      setShowShopResults(false); 
                    }} 
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
                {filteredShops.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">No shops on this route</div>
                )}
              </div>
            )}
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Delivery Man</span>
            <select
              value={deliveryPersonId}
              onChange={e => setDeliveryPersonId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
            >
              <option value="">-- Optional --</option>
              {deliveryPeople.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </label>
        </div>
      </PageCard>

      <PageCard title="Order Items">
        <div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="py-3 px-2 font-semibold w-24 text-center">Qty</th>
                <th className="py-3 px-2 font-semibold w-24 text-center">Free</th>
                <th className="py-3 px-2 font-semibold w-32 text-center">Price</th>
                <th className="py-3 px-2 font-semibold w-40 text-center">Discount</th>
                <th className="py-3 px-2 font-semibold w-32 text-right">Total</th>
                <th className="py-3 pl-4 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-4 relative">
                    <div className="relative product-row-container">
                      <input
                        type="text"
                        placeholder="Search product..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                        value={line.productId ? line.productName : line.searchText || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newLines = [...lines];
                          newLines[idx] = { ...newLines[idx], searchText: val, showResults: true, productId: 0 };
                          setLines(newLines);
                        }}
                        onFocus={() => {
                          const newLines = [...lines];
                          newLines[idx] = { ...newLines[idx], showResults: true };
                          setLines(newLines);
                        }}
                      />
                      {line.showResults && (
                        <div className="absolute left-0 top-full z-[9999] mt-1 max-h-60 w-full min-w-[300px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50">
                          {allProducts
                            .filter(p => !companyId || p.companyId === companyId)
                            .filter(p => 
                              p.name.toLowerCase().includes((line.searchText || '').toLowerCase()) || 
                              p.sku.toLowerCase().includes((line.searchText || '').toLowerCase())
                            )
                            .map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  // Always try to select company if it's empty
                                  if (!companyId) {
                                    setCompanyId(p.companyId);
                                    const comp = companies.find(c => c.id === p.companyId);
                                    if (comp) {
                                      setCompSearch(comp.name);
                                    }
                                  }
                                  updateLine(idx, { 
                                    productId: p.id, 
                                    productName: p.name, 
                                    unitPrice: p.salePrice,
                                    showResults: false,
                                    searchText: p.name
                                  });
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition border-b border-slate-50 last:border-0 cursor-pointer"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900">{p.name}</div>
                                  <div className="text-[10px] text-slate-400">{p.sku} | {p.company?.name}</div>
                                </div>
                                <div className="text-emerald-600 font-bold">{formatCurrency(p.salePrice)}</div>
                              </button>
                            ))}
                          {allProducts.filter(p => !companyId || p.companyId === companyId).filter(p => p.name.toLowerCase().includes((line.searchText || '').toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">No products found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={line.quantity === 0 ? '' : line.quantity} 
                      onChange={e => updateLine(idx, { quantity: e.target.value === '' ? 0 : Number(e.target.value) })} 
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition" 
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={line.freeQuantity === 0 ? '' : line.freeQuantity} 
                      onChange={e => updateLine(idx, { freeQuantity: e.target.value === '' ? 0 : Number(e.target.value) })} 
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition" 
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={line.unitPrice === 0 ? '' : line.unitPrice} 
                      onChange={e => updateLine(idx, { unitPrice: e.target.value === '' ? 0 : Number(e.target.value) })} 
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition" 
                    />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={line.discountValue === 0 ? '' : line.discountValue} 
                        onChange={e => updateLine(idx, { discountValue: e.target.value === '' ? 0 : Number(e.target.value) })} 
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition" 
                      />
                      <select value={line.discountType} onChange={e => updateLine(idx, { discountType: e.target.value as 'FIXED' | 'PERCENT' })} className="rounded-lg border border-slate-200 bg-slate-50 px-1 text-[10px]">
                        <option value="FIXED">৳</option>
                        <option value="PERCENT">%</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">
                    {formatCurrency(line.lineTotal)}
                  </td>
                  <td className="py-3 pl-4">
                    <button onClick={() => removeLine(idx)} className="text-rose-500 hover:text-rose-700">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addLine} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer">
          <span className="text-lg">+</span> Add Product Row
        </button>
      </PageCard>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <PageCard title="Invoice Discount">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Value</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={invDiscountValue === 0 ? '' : invDiscountValue} 
                  onChange={e => setInvDiscountValue(e.target.value === '' ? 0 : Number(e.target.value))} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition" 
                />            </div>
              <div className="w-32">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Type</label>
                <select value={invDiscountType} onChange={e => setInvDiscountType(e.target.value as 'FIXED' | 'PERCENT')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                  <option value="FIXED">Fixed (৳)</option>
                  <option value="PERCENT">Percent (%)</option>
                </select>
              </div>
            </div>
          </PageCard>

          <PageCard title="Additional Note">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add special instructions for this order..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition h-24 resize-none"
            />
          </PageCard>
        </div>

        <PageCard title="Summary">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Quantity</span>
              <span className="font-semibold">{totalQty} {totalFreeQty > 0 ? `(+ ${totalFreeQty} Free)` : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-rose-600">
              <span>Invoice Discount</span>
              <span>- {formatCurrency(invoiceDiscountAmount)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between text-lg font-bold text-slate-900">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="mt-4 w-full rounded-2xl bg-slate-900 py-4 text-white font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? (orderId ? 'Updating Order...' : 'Saving Order...') : (orderId ? 'Update Order' : 'Complete Order')}
            </button>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
