'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import { getRoutes } from '@/lib/api/routes';
import { createDeliverySummary } from '@/lib/api/delivery-summaries';
import { getSales, getSale } from '@/lib/api/sales';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { useToastNotification } from '@/components/ui/toast-provider';
import type { Company, Product, Route, DeliverySummary } from '@/types/api';

type DeliverySummaryItemForm = {
  id: string;
  productId: string;
  productSearch: string;
  orderQuantity: string;
  returnQuantity: string;
  unitPrice: string;
  remarks: string;
};

const initialItem = (): DeliverySummaryItemForm => ({
  id: `${Date.now()}-${Math.random()}`,
  productId: '',
  productSearch: '',
  orderQuantity: '1',
  returnQuantity: '0',
  unitPrice: '',
  remarks: '',
});

function normalizeProductSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function formatProductSearchLabel(product: Product) {
  return `${product.name} (${product.unit})`;
}

export function CreateDeliverySummaryPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    setDeliveryDate(new Date(now.getTime() - offset).toISOString().slice(0, 16));
  }, []);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<DeliverySummaryItemForm[]>([]);

  useEffect(() => {
    // Add initial item only on client to avoid hydration mismatch
    setItems([initialItem()]);
  }, []);

  const [activeProductSearchId, setActiveProductSearchId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useToastNotification({ message: error, title: 'Could not load data', tone: 'error' });
  useToastNotification({ message: formError, title: 'Could not create summary', tone: 'error' });
  useToastNotification({ message: successMessage, title: 'Success', tone: 'success' });

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setIsLoading(true);
        setError(null);
        const [companyData, routeData, productData] = await Promise.all([
          getCompanies(),
          getRoutes(),
          getProducts(),
        ]);

        setCompanies(companyData);
        setRoutes(routeData);
        setAllProducts(productData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    }
    void loadReferenceData();
  }, []);

  useEffect(() => {
    async function loadCompanyProducts() {
      if (!companyId) {
        setProducts(allProducts);
        return;
      }
      try {
        const productData = await getProducts(Number(companyId));
        setProducts(productData);
      } catch (loadError) {
        setFormError('Failed to load company products.');
      }
    }
    void loadCompanyProducts();
  }, [companyId, allProducts]);

  const selectedProducts = useMemo(
    () => items.map((item) =>
      allProducts.find((p) => p.id === Number(item.productId)) ?? null
    ),
    [allProducts, items]
  );

  function updateItem(itemId: string, updater: (item: DeliverySummaryItemForm) => DeliverySummaryItemForm) {
    setItems((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  }

  function addItem() {
    setItems((current) => [...current, initialItem()]);
  }

  function removeItem(itemId: string) {
    if (items.length <= 1) return;
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function selectProduct(itemId: string, product: Product) {
    updateItem(itemId, (item) => ({
      ...item,
      productId: String(product.id),
      productSearch: formatProductSearchLabel(product),
      unitPrice: String(product.salePrice),
    }));
    setActiveProductSearchId(null);
  }

  async function pullOrders() {
    if (!deliveryDate) {
      setFormError('Please select a date to pull orders.');
      return;
    }

    try {
      setIsLoading(true);
      setFormError(null);

      // Calculate local start and end of day to send as ISO strings
      // This ensures we catch all orders in the user's local day regardless of server timezone
      const startOfDay = new Date(deliveryDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(deliveryDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sales = await getSales({
        fromDate: startOfDay.toISOString(),
        toDate: endOfDay.toISOString(),
        companyId: companyId ? Number(companyId) : undefined,
        routeId: routeId ? Number(routeId) : undefined,
        limit: 100,
      });

      if (sales.items.length === 0) {
        setFormError('No orders found for the selected date and route.');
        return;
      }

      // Aggregate products from all sales
      const productTotals: Record<number, { quantity: number; unitPrice: number }> = {};

      for (const sale of sales.items) {
        // We need the sale items, but getSales paginated might not include items.
        // Check if we need to fetch individual sales.
        const fullSale = await getSale(sale.id);

        for (const item of fullSale.items || []) {
          if (!productTotals[item.productId]) {
            productTotals[item.productId] = { quantity: 0, unitPrice: item.unitPrice };
          }
          productTotals[item.productId].quantity += Math.round(item.quantity);
        }
      }

      const newItems: DeliverySummaryItemForm[] = Object.entries(productTotals).map(([prodId, data]) => {
        const product = allProducts.find(p => p.id === Number(prodId));
        return {
          id: `${Date.now()}-${Math.random()}`,
          productId: prodId,
          productSearch: product ? formatProductSearchLabel(product) : 'Unknown Product',
          orderQuantity: String(data.quantity),
          returnQuantity: '0',
          unitPrice: String(data.unitPrice),
          remarks: 'Pulled from Orders',
        };
      });

      if (newItems.length > 0) {
        setItems(newItems);
        setSuccessMessage(`Successfully pulled items from ${sales.items.length} orders.`);
      }

    } catch (err) {
      setFormError('Failed to pull orders. Please try manual entry.');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitSummary(mode: 'details' | 'print') {
    setFormError(null);
    setSuccessMessage(null);

    const validItems = items.filter(item => item.productId && Number(item.orderQuantity) > 0);

    if (validItems.length === 0) {
      setFormError('Add at least one product with a valid order quantity.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        companyId: companyId ? Number(companyId) : undefined,
        routeId: routeId ? Number(routeId) : undefined,
        deliveryDate: new Date(deliveryDate).toISOString(),
        note: note.trim() || undefined,
        items: validItems.map((item) => ({
          productId: Number(item.productId),
          orderQuantity: Number(item.orderQuantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const summary = await createDeliverySummary(payload);

      setSuccessMessage('Delivery summary created successfully.');

      if (mode === 'print') {
        window.open(`/delivery-summaries/${summary.id}/print`, '_blank');
      }

      router.push(`/delivery-summaries/${summary.id}`);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Failed to create summary.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Create Delivery Summary"
        description="Prepare a delivery sheet by selecting products and order quantities. Returns can be added later."
        action={
          <Link href="/delivery-summaries" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Back to summaries
          </Link>
        }
      >
        {isLoading ? <LoadingBlock label="Loading form..." /> : null}

        {!isLoading && !error ? (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Delivery Date</span>
                <input
                  type="datetime-local"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Route (Optional)</span>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Any Route / Not specified</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Company (Optional)</span>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="text-indigo-900 text-sm">
                <span className="font-bold">Pull all orders?</span> You can automatically pull ALL of today's orders into this summary sheet with one click.
              </div>
              <button
                type="button"
                onClick={pullOrders}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Pull Today's Orders
              </button>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 font-medium px-2">SL</th>
                    <th className="pb-3 font-medium px-2">Product Name</th>
                    <th className="pb-3 font-medium px-2">Order Qty</th>
                    <th className="pb-3 font-medium px-2">Return Qty</th>
                    <th className="pb-3 font-medium px-2">Sales Qty</th>
                    <th className="pb-3 font-medium px-2">Price</th>
                    <th className="pb-3 font-medium px-2">Remarks</th>
                    <th className="pb-3 font-medium px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const product = selectedProducts[index];
                    const orderQty = Number(item.orderQuantity) || 0;
                    const returnQty = Number(item.returnQuantity) || 0;
                    const saleQty = Math.max(0, orderQty - returnQty);

                    const searchResults = products
                      .filter(p => normalizeProductSearchValue(p.name).includes(normalizeProductSearchValue(item.productSearch)))
                      .slice(0, 5);

                    return (
                      <tr key={item.id} className="group">
                        <td className="py-3 px-2 text-slate-400">{index + 1}</td>
                        <td className="py-3 px-2 relative min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Search product..."
                            value={item.productSearch}
                            onChange={(e) => {
                              updateItem(item.id, (i) => ({ ...i, productSearch: e.target.value, productId: '' }));
                              setActiveProductSearchId(item.id);
                            }}
                            onFocus={() => setActiveProductSearchId(item.id)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                          {activeProductSearchId === item.id && item.productSearch && !item.productId && (
                            <div className="absolute left-2 right-2 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                              {searchResults.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => selectProduct(item.id, p)}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center"
                                >
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-xs text-slate-500">{p.unit} - ৳{p.salePrice}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 w-24">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.orderQuantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              const rounded = val === '' ? '' : String(Math.round(Number(val)));
                              updateItem(item.id, i => ({ ...i, orderQuantity: rounded }));
                            }}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-2 w-24">
                          <input
                            type="number"
                            min="0"
                            disabled
                            value={item.returnQuantity}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-slate-400"
                          />
                        </td>
                        <td className="py-3 px-2 w-24 text-center font-medium text-slate-700">
                          {saleQty}
                        </td>
                        <td className="py-3 px-2 w-28">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, i => ({ ...i, unitPrice: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-right focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-2 min-w-[150px]">
                          <input
                            type="text"
                            placeholder="Remarks..."
                            value={item.remarks}
                            onChange={(e) => updateItem(item.id, i => ({ ...i, remarks: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-2 w-10 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length <= 1}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"
                onClick={addItem}
                className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add product
              </button>
            </div>

            <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-end">
              <button
                type="button"
                onClick={() => submitSummary('details')}
                disabled={isSaving}
                className="rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Summary'}
              </button>

              <button
                type="button"
                onClick={() => submitSummary('print')}
                disabled={isSaving}
                className="rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {isSaving ? 'Saving...' : 'Save & Print'}
              </button>
            </div>
          </form>
        ) : null}
      </PageCard>
    </div>
  );
}
