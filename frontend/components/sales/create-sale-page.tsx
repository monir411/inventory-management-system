'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import { getRoutes } from '@/lib/api/routes';
import { createSale } from '@/lib/api/sales';
import { getShops } from '@/lib/api/shops';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';
import type { Company, Product, Route, Sale, Shop } from '@/types/api';

type SaleItemForm = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

type PaymentMode = 'full' | 'due';

const initialItem = (): SaleItemForm => ({
  id: `${Date.now()}-${Math.random()}`,
  productId: '',
  quantity: '1',
  unitPrice: '',
});

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function formatMoneyInput(value: number) {
  return roundCurrency(value).toFixed(2);
}

export function CreateSalePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [shopId, setShopId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 16));
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([initialItem()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useToastNotification({
    message: error,
    title: 'Could not load sale form',
    tone: 'error',
  });
  useToastNotification({
    message: formError,
    title: 'Could not create sale',
    tone: 'error',
  });
  useToastNotification({
    message: successMessage,
    title: 'Sale created',
    tone: 'success',
  });

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setIsLoading(true);
        setError(null);
        const [companyData, routeData] = await Promise.all([
          getCompanies(),
          getRoutes(),
        ]);

        setCompanies(companyData);
        setRoutes(routeData);
        setCompanyId(String(companyData[0]?.id ?? ''));
        setRouteId(String(routeData[0]?.id ?? ''));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load sale form data.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadReferenceData();
  }, []);

  useEffect(() => {
    async function loadCompanyProducts() {
      if (!companyId) {
        setProducts([]);
        return;
      }

      try {
        const productData = await getProducts(Number(companyId));
        setProducts(productData);
        setItems((current) =>
          current.map((item) => {
            if (
              item.productId &&
              productData.some((product) => product.id === Number(item.productId))
            ) {
              return item;
            }

            const firstProduct = productData[0];
            return {
              ...item,
              productId: firstProduct ? String(firstProduct.id) : '',
              unitPrice: firstProduct ? String(firstProduct.salePrice) : '',
            };
          }),
        );
      } catch (loadError) {
        setFormError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load company products.',
        );
      }
    }

    void loadCompanyProducts();
  }, [companyId]);

  useEffect(() => {
    async function loadRouteShops() {
      if (!routeId) {
        setShops([]);
        setShopId('');
        return;
      }

      try {
        const shopData = await getShops(Number(routeId));
        setShops(shopData);

        if (shopId && !shopData.some((shop) => shop.id === Number(shopId))) {
          setShopId('');
        }
      } catch (loadError) {
        setFormError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load route shops.',
        );
      }
    }

    void loadRouteShops();
  }, [routeId, shopId]);

  const selectedProducts = useMemo(
    () =>
      items.map((item) =>
        products.find((product) => product.id === Number(item.productId)) ?? null,
      ),
    [items, products],
  );

  const itemCalculations = useMemo(
    () =>
      items.map((item, index) => {
        const product = selectedProducts[index];
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const buyPrice = product?.buyPrice ?? 0;
        const lineTotal = quantity * unitPrice;
        const lineProfit = (unitPrice - buyPrice) * quantity;

        return {
          buyPrice,
          lineTotal,
          lineProfit,
        };
      }),
    [items, selectedProducts],
  );

  const totalAmount = useMemo(
    () => itemCalculations.reduce((sum, item) => sum + item.lineTotal, 0),
    [itemCalculations],
  );
  const totalProfit = useMemo(
    () => itemCalculations.reduce((sum, item) => sum + item.lineProfit, 0),
    [itemCalculations],
  );
  const normalizedPaidAmount = useMemo(
    () => roundCurrency(Number(paidAmount || 0)),
    [paidAmount],
  );
  const dueAmount = useMemo(
    () => roundCurrency(totalAmount - normalizedPaidAmount),
    [normalizedPaidAmount, totalAmount],
  );

  useEffect(() => {
    if (paymentMode !== 'full') {
      return;
    }

    setPaidAmount(formatMoneyInput(totalAmount));
  }, [paymentMode, totalAmount]);

  function buildFreshItems(nextProducts: Product[]) {
    const firstProduct = nextProducts[0];

    return [
      {
        ...initialItem(),
        productId: firstProduct ? String(firstProduct.id) : '',
        unitPrice: firstProduct ? String(firstProduct.salePrice) : '',
      },
    ];
  }

  function prepareNextOrder(createdSale: Sale) {
    setInvoiceNo('');
    setPaymentMode('full');
    setPaidAmount('0.00');
    setNote('');
    setShopId('');
    setItems(buildFreshItems(products));
    setSuccessMessage(
      `Sale ${createdSale.invoiceNo} created. You can now enter the next order.`,
    );
    setRecentSales((current) => [createdSale, ...current].slice(0, 6));
  }

  async function submitSale(mode: 'details' | 'next') {
    setFormError(null);
    setSuccessMessage(null);

    if (!companyId || !routeId) {
      setFormError('Please select both company and route.');
      return;
    }

    if (items.some((item) => !item.productId || Number(item.quantity) <= 0)) {
      setFormError('Each sale item needs a product and a quantity above zero.');
      return;
    }

    if (totalAmount <= 0) {
      setFormError('Add at least one sale item with valid quantity and price.');
      return;
    }

    if (dueAmount > 0 && !shopId) {
      setFormError('Shop is required when due amount is greater than zero.');
      return;
    }

    if (dueAmount < 0) {
      setFormError('Paid amount cannot be greater than total amount.');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        companyId: Number(companyId),
        routeId: Number(routeId),
        shopId: shopId ? Number(shopId) : undefined,
        saleDate: new Date(saleDate).toISOString(),
        invoiceNo: invoiceNo.trim() || undefined,
        paidAmount:
          paymentMode === 'full'
            ? roundCurrency(totalAmount)
            : normalizedPaidAmount,
        note: note.trim() || undefined,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const sale = await createSale(payload);

      if (mode === 'next') {
        prepareNextOrder(sale);
        return;
      }

      router.push(`/sales/${sale.id}`);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Failed to create sale.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitSale('details');
  }

  function activateFullPaidMode() {
    setPaymentMode('full');
  }

  function activateDueMode() {
    setPaymentMode('due');
    setPaidAmount((current) => {
      const currentValue = roundCurrency(Number(current || 0));

      if (currentValue === roundCurrency(totalAmount)) {
        return '0.00';
      }

      return current;
    });
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Create Sale"
        description="Build a route-based sale with multiple products, live profit math, and due validation before submission."
        action={
          <Link
            href="/sales"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Back to sales
          </Link>
        }
      >
        {isLoading ? <LoadingBlock label="Loading sale form..." /> : null}

        {!isLoading && !error ? (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Payment mode</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use full paid for quick daily sales. Switch to due only when payment is not complete.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={activateFullPaidMode}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      paymentMode === 'full'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Full paid sale
                  </button>
                  <button
                    type="button"
                    onClick={activateDueMode}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      paymentMode === 'due'
                        ? 'bg-amber-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Due sale
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Company</span>
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Route</span>
                <select
                  value={routeId}
                  onChange={(event) => setRouteId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="">Select route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Shop {dueAmount > 0 ? '(required for due)' : '(optional)'}
                </span>
                <select
                  value={shopId}
                  onChange={(event) => setShopId(event.target.value)}
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm ${
                    dueAmount > 0 && !shopId
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  <option value="">Optional shop</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Sale date</span>
                <input
                  type="datetime-local"
                  value={saleDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Invoice no</span>
                <input
                  value={invoiceNo}
                  onChange={(event) => setInvoiceNo(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Leave blank to let backend generate one"
                />
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Paid amount</span>
                  {paymentMode === 'full' ? (
                    <span className="text-xs font-medium text-emerald-700">
                      Auto-filled from total
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaidAmount(formatMoneyInput(totalAmount))}
                      className="text-xs font-medium text-slate-600 underline underline-offset-4"
                    >
                      Use full amount
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value)}
                  disabled={paymentMode === 'full'}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm ${
                    paymentMode === 'full' ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Optional sale note"
              />
            </label>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Sale Items</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add one or more products. Unit price is editable, buy price comes from the product.
                </p>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const product = selectedProducts[index];
                  const calculation = itemCalculations[index];

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_auto]">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Product
                          </span>
                          <select
                            value={item.productId}
                            onChange={(event) => {
                              const nextProduct = products.find(
                                (productOption) =>
                                  productOption.id === Number(event.target.value),
                              );

                              setItems((current) =>
                                current.map((currentItem) =>
                                  currentItem.id === item.id
                                    ? {
                                        ...currentItem,
                                        productId: event.target.value,
                                        unitPrice: nextProduct
                                          ? String(nextProduct.salePrice)
                                          : currentItem.unitPrice,
                                      }
                                    : currentItem,
                                ),
                              );
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          >
                            <option value="">Select product</option>
                            {products.map((productOption) => (
                              <option key={productOption.id} value={productOption.id}>
                                {productOption.name} ({productOption.unit})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Quantity
                          </span>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={item.quantity}
                            onChange={(event) =>
                              setItems((current) =>
                                current.map((currentItem) =>
                                  currentItem.id === item.id
                                    ? {
                                        ...currentItem,
                                        quantity: event.target.value,
                                      }
                                    : currentItem,
                                ),
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          />
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Unit price
                          </span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              setItems((current) =>
                                current.map((currentItem) =>
                                  currentItem.id === item.id
                                    ? {
                                        ...currentItem,
                                        unitPrice: event.target.value,
                                      }
                                    : currentItem,
                                ),
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          />
                        </label>

                        <div className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Buy price
                          </span>
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            {formatCurrency(product?.buyPrice ?? 0)}
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() =>
                              setItems((current) =>
                                current.length === 1
                                  ? current
                                  : current.filter(
                                      (currentItem) => currentItem.id !== item.id,
                                    ),
                              )
                            }
                            className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                          <p className="text-slate-500">Product unit</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {product?.unit ?? 'Not selected'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                          <p className="text-slate-500">Line total</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatCurrency(calculation.lineTotal)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                          <p className="text-slate-500">Line profit</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatCurrency(calculation.lineProfit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, initialItem()])}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Add another item
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-900 p-5 text-white">
                <p className="text-sm text-slate-300">Total amount</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900">
                <p className="text-sm">Total profit</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div
                className={`rounded-2xl p-5 ${
                  dueAmount > 0
                    ? 'bg-amber-50 text-amber-900'
                    : 'bg-emerald-50 text-emerald-900'
                }`}
              >
                <p className="text-sm">Due amount</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(dueAmount)}
                </p>
                {dueAmount > 0 && !shopId ? (
                  <p className="mt-2 text-xs font-medium">
                    Shop is required before submitting a due sale.
                  </p>
                ) : paymentMode === 'full' ? (
                  <p className="mt-2 text-xs font-medium">
                    This sale will be saved as fully paid.
                  </p>
                ) : dueAmount === 0 ? (
                  <p className="mt-2 text-xs font-medium">
                    Due is zero, so this sale will be fully paid.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
              <p className="font-semibold">Fast order entry</p>
              <p className="mt-2 leading-6">
                Use `Save & next order` when you are entering many sales on the same day. Company, route, date, and the quick full-paid mode stay ready so the next order is faster to enter.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void submitSale('next')}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save & next order'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save & view details'}
              </button>
            </div>
          </form>
        ) : null}
      </PageCard>

      {recentSales.length > 0 ? (
        <PageCard
          title="Recently Created Orders"
          description="This helps you confirm several shop sales were created one after another without leaving the page."
        >
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{sale.invoiceNo}</p>
                  <p className="text-sm text-slate-500">
                    {sale.shop?.name ?? 'No shop'} • {formatDate(sale.saleDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    {formatCurrency(sale.totalAmount)}
                  </p>
                  <Link
                    href={`/sales/${sale.id}`}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </PageCard>
      ) : null}
    </div>
  );
}
