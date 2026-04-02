'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import {
  addAdjustment,
  addOpeningStock,
  addStockIn,
  getLowStockProducts,
  getStockMovements,
  getStockSummary,
  getZeroStockProducts,
} from '@/lib/api/stock';
import { LoadingBlock } from '@/components/ui/loading-block';
import { Pagination } from '@/components/ui/pagination';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { StockMovementList } from './stock-movement-list';
import { formatNumber } from '@/lib/utils/format';
import type {
  Company,
  Product,
  StockMovement,
  StockSummaryItem,
} from '@/types/api';

const initialMovementForm = {
  productId: '',
  quantity: '',
  note: '',
  movementDate: new Date().toISOString().slice(0, 16),
};
const stockTablePageSize = 10;
const movementPageSize = 8;

function normalizeMatchValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function getStockMatchScore(
  item: StockSummaryItem,
  keyword: string,
  selectedCompanyId: number | null,
) {
  const normalizedKeyword = normalizeMatchValue(keyword);
  const sku = normalizeMatchValue(item.sku);
  const productName = normalizeMatchValue(item.productName);
  const unit = normalizeMatchValue(item.unit);
  const companyName = normalizeMatchValue(item.company?.name);
  const companyCode = normalizeMatchValue(item.company?.code);

  let score = 0;

  if (sku === normalizedKeyword) score += 100;
  else if (sku.startsWith(normalizedKeyword)) score += 75;
  else if (sku.includes(normalizedKeyword)) score += 50;

  if (productName === normalizedKeyword) score += 95;
  else if (productName.startsWith(normalizedKeyword)) score += 70;
  else if (productName.includes(normalizedKeyword)) score += 45;

  if (companyCode === normalizedKeyword) score += 65;
  else if (companyCode.includes(normalizedKeyword)) score += 35;

  if (companyName === normalizedKeyword) score += 60;
  else if (companyName.startsWith(normalizedKeyword)) score += 40;
  else if (companyName.includes(normalizedKeyword)) score += 25;

  if (unit === normalizedKeyword) score += 20;

  if (selectedCompanyId && item.companyId === selectedCompanyId) {
    score += 10;
  }

  return score;
}

export function StockPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const showAllCompanyAlerts = view === 'alerts';
  const currentStockSectionRef = useRef<HTMLDivElement | null>(null);
  const alertsSectionRef = useRef<HTMLDivElement | null>(null);
  const lowStockSectionRef = useRef<HTMLDivElement | null>(null);
  const zeroStockSectionRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const latestAutoMatchRequestRef = useRef(0);
  const selectedCompanyIdRef = useRef<number | null>(null);
  const selectedProductIdRef = useRef<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<StockSummaryItem[]>([]);
  const [lowStock, setLowStock] = useState<StockSummaryItem[]>([]);
  const [zeroStock, setZeroStock] = useState<StockSummaryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openingForm, setOpeningForm] = useState(initialMovementForm);
  const [stockInForm, setStockInForm] = useState(initialMovementForm);
  const [adjustmentForm, setAdjustmentForm] = useState(initialMovementForm);
  const [summaryPage, setSummaryPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [zeroStockPage, setZeroStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load stock data',
    tone: 'error',
  });
  useToastNotification({
    message: formError,
    title: 'Could not save stock movement',
    tone: 'error',
  });
  useToastNotification({
    message: successMessage,
    title: 'Saved',
    tone: 'success',
  });

  useEffect(() => {
    async function loadCompaniesList() {
      try {
        setIsLoading(true);
        setError(null);
        const companyData = await getCompanies();
        setCompanies(companyData);
        setSelectedCompanyId(
          showAllCompanyAlerts ? null : (companyData[0]?.id ?? null),
        );
        setSelectedProductId(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load companies.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCompaniesList();
  }, [showAllCompanyAlerts]);

  useEffect(() => {
    async function loadCompanyData() {
      try {
        setIsLoading(true);
        setError(null);

        const [productData, summaryData, lowStockData, zeroStockData] =
          await Promise.all([
            selectedCompanyId ? getProducts(selectedCompanyId) : Promise.resolve([]),
            getStockSummary(selectedCompanyId ?? undefined, searchTerm),
            getLowStockProducts(selectedCompanyId ?? undefined, 10, searchTerm),
            getZeroStockProducts(selectedCompanyId ?? undefined, searchTerm),
          ]);

        setProducts(productData);
        setSummary(summaryData);
        setLowStock(lowStockData);
        setZeroStock(zeroStockData);

        const nextProductId =
          selectedCompanyId &&
          selectedProductId &&
          productData.some((product) => product.id === selectedProductId)
            ? selectedProductId
            : null;
        setSelectedProductId(nextProductId);

        if (selectedCompanyId) {
          const movementData = await getStockMovements(
            selectedCompanyId,
            nextProductId ?? undefined,
          );
          setMovements(movementData);
        } else {
          setMovements([]);
        }

        const getDefaultFormProductValue = (currentProductId: string) => {
          if (
            currentProductId &&
            productData.some((product) => product.id === Number(currentProductId))
          ) {
            return currentProductId;
          }

          if (nextProductId) {
            return String(nextProductId);
          }

          return productData[0] ? String(productData[0].id) : '';
        };

        setOpeningForm((current) => ({
          ...current,
          productId: getDefaultFormProductValue(current.productId),
        }));
        setStockInForm((current) => ({
          ...current,
          productId: getDefaultFormProductValue(current.productId),
        }));
        setAdjustmentForm((current) => ({
          ...current,
          productId: getDefaultFormProductValue(current.productId),
        }));
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load stock data.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCompanyData();
  }, [selectedCompanyId, selectedProductId, searchTerm]);

  useEffect(() => {
    async function loadMovements() {
      if (!selectedCompanyId) {
        setMovements([]);
        return;
      }

      try {
        const movementData = await getStockMovements(
          selectedCompanyId,
          selectedProductId ?? undefined,
        );
        setMovements(movementData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load stock movements.',
        );
      }
    }

    void loadMovements();
  }, [selectedCompanyId, selectedProductId]);

  useEffect(() => {
    selectedCompanyIdRef.current = selectedCompanyId;
    selectedProductIdRef.current = selectedProductId;
  }, [selectedCompanyId, selectedProductId]);

  useEffect(() => {
    async function autoSelectMatchedStock() {
      const trimmedSearch = searchTerm.trim();

      if (trimmedSearch.length < 2) {
        latestAutoMatchRequestRef.current += 1;
        return;
      }

      const requestId = latestAutoMatchRequestRef.current + 1;
      latestAutoMatchRequestRef.current = requestId;

      try {
        const matchedItems = await getStockSummary(undefined, trimmedSearch);

        if (requestId !== latestAutoMatchRequestRef.current) {
          return;
        }

        const rankedItems = [...matchedItems]
          .map((item) => ({
            item,
            score: getStockMatchScore(
              item,
              trimmedSearch,
              selectedCompanyIdRef.current,
            ),
          }))
          .filter((entry) => entry.score > 0)
          .sort((left, right) => right.score - left.score);

        const bestMatch = rankedItems[0]?.item;

        if (!bestMatch) {
          return;
        }

        if (
          bestMatch.companyId === selectedCompanyIdRef.current &&
          bestMatch.productId === selectedProductIdRef.current
        ) {
          return;
        }

        setSummaryPage(1);
        setLowStockPage(1);
        setZeroStockPage(1);
        setMovementPage(1);
        setSelectedCompanyId(bestMatch.companyId);
        setSelectedProductId(bestMatch.productId);
      } catch {
        // Keep manual filters unchanged if auto-match lookup fails.
      }
    }

    void autoSelectMatchedStock();
  }, [searchTerm]);

  useEffect(() => {
    if (isLoading || error || hasAutoScrolledRef.current) {
      return;
    }

    const targetSection =
      view === 'company' || view === 'current-stock'
        ? currentStockSectionRef.current
        : view === 'low-stock'
          ? lowStockSectionRef.current
          : view === 'zero-stock'
            ? zeroStockSectionRef.current
            : view === 'alerts'
              ? alertsSectionRef.current
              : null;

    if (!targetSection) {
      return;
    }

    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    hasAutoScrolledRef.current = true;
  }, [error, isLoading, view]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const filteredSummary = useMemo(() => {
    if (!selectedProductId) {
      return summary;
    }

    return summary.filter((item) => item.productId === selectedProductId);
  }, [selectedProductId, summary]);

  const filteredLowStock = useMemo(() => {
    if (!selectedProductId) {
      return lowStock;
    }

    return lowStock.filter((item) => item.productId === selectedProductId);
  }, [lowStock, selectedProductId]);

  const filteredZeroStock = useMemo(() => {
    if (!selectedProductId) {
      return zeroStock;
    }

    return zeroStock.filter((item) => item.productId === selectedProductId);
  }, [selectedProductId, zeroStock]);

  const paginatedSummary = useMemo(() => {
    const startIndex = (summaryPage - 1) * stockTablePageSize;
    return filteredSummary.slice(startIndex, startIndex + stockTablePageSize);
  }, [filteredSummary, summaryPage]);

  const paginatedLowStock = useMemo(() => {
    const startIndex = (lowStockPage - 1) * stockTablePageSize;
    return filteredLowStock.slice(startIndex, startIndex + stockTablePageSize);
  }, [filteredLowStock, lowStockPage]);

  const paginatedZeroStock = useMemo(() => {
    const startIndex = (zeroStockPage - 1) * stockTablePageSize;
    return filteredZeroStock.slice(startIndex, startIndex + stockTablePageSize);
  }, [filteredZeroStock, zeroStockPage]);

  const todaysMovements = useMemo(() => {
    const today = new Date();

    return movements.filter((movement) => {
      const movementDate = new Date(movement.movementDate);

      return (
        movementDate.getFullYear() === today.getFullYear() &&
        movementDate.getMonth() === today.getMonth() &&
        movementDate.getDate() === today.getDate()
      );
    });
  }, [movements]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (movementPage - 1) * movementPageSize;
    return todaysMovements.slice(startIndex, startIndex + movementPageSize);
  }, [movementPage, todaysMovements]);

  const allMovementsHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedCompanyId) {
      params.set('companyId', String(selectedCompanyId));
    }

    if (selectedProductId) {
      params.set('productId', String(selectedProductId));
    }

    const queryString = params.toString();
    return queryString ? `/stock/movements?${queryString}` : '/stock/movements';
  }, [selectedCompanyId, selectedProductId]);

  async function refreshStockData(companyId: number, productId: number | null) {
    const [summaryData, lowStockData, zeroStockData, movementData] =
      await Promise.all([
        getStockSummary(companyId, searchTerm),
        getLowStockProducts(companyId, 10, searchTerm),
        getZeroStockProducts(companyId, searchTerm),
        getStockMovements(companyId, productId ?? undefined),
      ]);

    setSummary(summaryData);
    setLowStock(lowStockData);
    setZeroStock(zeroStockData);
    setMovements(movementData);
  }

  function scrollToSection(section: HTMLDivElement | null) {
    section?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function scrollToLowStockSection() {
    scrollToSection(lowStockSectionRef.current);
  }

  function scrollToCurrentStockSection() {
    scrollToSection(currentStockSectionRef.current);
  }

  function scrollToZeroStockSection() {
    scrollToSection(zeroStockSectionRef.current);
  }

  async function submitMovement(
    event: FormEvent<HTMLFormElement>,
    mode: 'opening' | 'stock-in' | 'adjustment',
  ) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!selectedCompanyId) {
      setFormError('Please select a company first.');
      return;
    }

    const form =
      mode === 'opening'
        ? openingForm
        : mode === 'stock-in'
          ? stockInForm
          : adjustmentForm;

    if (!form.productId) {
      setFormError('Please select a product.');
      return;
    }

    try {
      setIsSubmitting(mode);

      const payload = {
        companyId: selectedCompanyId,
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        note: form.note,
        movementDate: new Date(form.movementDate).toISOString(),
      };

      if (mode === 'opening') {
        await addOpeningStock(payload);
        setOpeningForm((current) => ({ ...initialMovementForm, productId: current.productId }));
        setSuccessMessage('Opening stock added successfully.');
      } else if (mode === 'stock-in') {
        await addStockIn(payload);
        setStockInForm((current) => ({ ...initialMovementForm, productId: current.productId }));
        setSuccessMessage('Stock-in movement added successfully.');
      } else {
        await addAdjustment(payload);
        setAdjustmentForm((current) => ({
          ...initialMovementForm,
          productId: current.productId,
        }));
        setSuccessMessage('Stock adjustment saved successfully.');
      }

      await refreshStockData(selectedCompanyId, selectedProductId);
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to save stock movement.',
      );
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Stock Control"
        description="Review current stock, low stock, zero stock, and stock movements per company and product."
        action={
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSummaryPage(1);
                setLowStockPage(1);
                setZeroStockPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder="Search by product, SKU, unit, or company"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
            <select
              value={selectedCompanyId ?? ''}
              onChange={(event) => {
                setSelectedProductId(null);
                setSummaryPage(1);
                setLowStockPage(1);
                setZeroStockPage(1);
                setMovementPage(1);
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
              value={selectedProductId ?? ''}
              onChange={(event) =>
                {
                  setSummaryPage(1);
                  setLowStockPage(1);
                  setZeroStockPage(1);
                  setMovementPage(1);
                  setSelectedProductId(
                    event.target.value ? Number(event.target.value) : null,
                  );
                }
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              disabled={!selectedCompanyId}
            >
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.unit})
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isLoading ? <LoadingBlock label="Loading stock workspace..." /> : null}
        {!isLoading && !error ? (
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={scrollToCurrentStockSection}
              className="rounded-2xl bg-slate-900 p-5 text-left text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <p className="text-sm text-slate-300">Selected company</p>
              <p className="mt-2 text-xl font-semibold">
                {selectedCompany?.name ?? 'All companies'}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-300/80">
                Click to view the current stock summary
              </p>
            </button>
            <button
              type="button"
              onClick={scrollToLowStockSection}
              className="rounded-2xl bg-amber-50 p-5 text-left text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <p className="text-sm">Low stock products</p>
              <p className="mt-2 text-3xl font-semibold">
                {filteredLowStock.length}
              </p>
              <p className="mt-2 text-xs font-medium text-amber-800/80">
                Click to view the low stock list
              </p>
            </button>
            <button
              type="button"
              onClick={scrollToZeroStockSection}
              className="rounded-2xl bg-rose-50 p-5 text-left text-rose-900 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <p className="text-sm">Zero stock products</p>
              <p className="mt-2 text-3xl font-semibold">
                {filteredZeroStock.length}
              </p>
              <p className="mt-2 text-xs font-medium text-rose-800/80">
                Click to view the zero stock list
              </p>
            </button>
          </div>
        ) : null}
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <PageCard title="Add Opening Stock" description="Creates an OPENING movement.">
          {selectedCompanyId ? (
            <MovementForm
              products={products}
              form={openingForm}
              setForm={setOpeningForm}
              submitLabel={isSubmitting === 'opening' ? 'Saving...' : 'Add opening stock'}
              onSubmit={(event) => void submitMovement(event, 'opening')}
            />
          ) : (
            <StateMessage
              title="Select a company first"
              description="Choose a specific company to add opening stock."
            />
          )}
        </PageCard>

        <PageCard title="Add Stock In" description="Creates a STOCK_IN movement.">
          {selectedCompanyId ? (
            <MovementForm
              products={products}
              form={stockInForm}
              setForm={setStockInForm}
              submitLabel={isSubmitting === 'stock-in' ? 'Saving...' : 'Add stock in'}
              onSubmit={(event) => void submitMovement(event, 'stock-in')}
            />
          ) : (
            <StateMessage
              title="Select a company first"
              description="Choose a specific company to add stock in."
            />
          )}
        </PageCard>

        <PageCard
          title="Add Adjustment"
          description="Creates an ADJUSTMENT movement. Use negative values to reduce stock."
        >
          {selectedCompanyId ? (
            <MovementForm
              products={products}
              form={adjustmentForm}
              setForm={setAdjustmentForm}
              submitLabel={isSubmitting === 'adjustment' ? 'Saving...' : 'Add adjustment'}
              onSubmit={(event) => void submitMovement(event, 'adjustment')}
            />
          ) : (
            <StateMessage
              title="Select a company first"
              description="Choose a specific company to save stock adjustments."
            />
          )}
        </PageCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div ref={currentStockSectionRef}>
          <PageCard
            title="Current Stock Summary"
            description="This is calculated from stock movements, so it is the best place to verify current balances."
          >
            <StockSummaryTable items={paginatedSummary} />
            <Pagination
              currentPage={summaryPage}
              totalItems={filteredSummary.length}
              pageSize={stockTablePageSize}
              onPageChange={setSummaryPage}
            />
          </PageCard>
        </div>

        <PageCard
          title="Today's Stock Movement History"
          description="This section shows only today's movement entries for the selected company and optional product filter."
          action={
            selectedCompanyId ? (
              <Link
                href={allMovementsHref}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View all movements
              </Link>
            ) : null
          }
        >
          {selectedCompanyId ? (
            <StockMovementList
              movements={paginatedMovements}
              totalItems={todaysMovements.length}
              currentPage={movementPage}
              pageSize={movementPageSize}
              onPageChange={setMovementPage}
              emptyTitle="No stock movements found today"
              emptyDescription="Today's entries will appear here. Open all movements to review older stock history."
            />
          ) : (
            <StateMessage
              title="Select a company to review movements"
              description="All-company mode is useful for low and zero stock lists. Pick a company to inspect movement history."
            />
          )}
        </PageCard>
      </div>

      <div ref={alertsSectionRef} className="grid gap-6 xl:grid-cols-2">
        <div ref={lowStockSectionRef}>
          <PageCard
            title="Low Stock Products"
            description="Products with current stock above zero and at or below the backend threshold."
          >
            <StockSummaryTable items={paginatedLowStock} />
            <Pagination
              currentPage={lowStockPage}
              totalItems={filteredLowStock.length}
              pageSize={stockTablePageSize}
              onPageChange={setLowStockPage}
            />
          </PageCard>
        </div>

        <div ref={zeroStockSectionRef}>
          <PageCard
            title="Zero Stock Products"
            description="Products currently calculated as zero stock from stock movements."
          >
            <StockSummaryTable items={paginatedZeroStock} />
            <Pagination
              currentPage={zeroStockPage}
              totalItems={filteredZeroStock.length}
              pageSize={stockTablePageSize}
              onPageChange={setZeroStockPage}
            />
          </PageCard>
        </div>
      </div>
    </div>
  );
}

type MovementFormProps = {
  products: Product[];
  form: {
    productId: string;
    quantity: string;
    note: string;
    movementDate: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      productId: string;
      quantity: string;
      note: string;
      movementDate: string;
    }>
  >;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function MovementForm({
  products,
  form,
  setForm,
  submitLabel,
  onSubmit,
}: MovementFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Product</span>
        <select
          value={form.productId}
          onChange={(event) =>
            setForm((current) => ({ ...current, productId: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.unit})
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Quantity</span>
        <input
          type="number"
          step="0.001"
          value={form.quantity}
          onChange={(event) =>
            setForm((current) => ({ ...current, quantity: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Movement date</span>
        <input
          type="datetime-local"
          value={form.movementDate}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              movementDate: event.target.value,
            }))
          }
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Note</span>
        <textarea
          value={form.note}
          onChange={(event) =>
            setForm((current) => ({ ...current, note: event.target.value }))
          }
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="Optional note"
        />
      </label>

      <button
        type="submit"
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function StockSummaryTable({ items }: { items: StockSummaryItem[] }) {
  if (items.length === 0) {
    return (
      <StateMessage
        title="No products to show"
        description="Try another company or create stock movements for products first."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-3 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Product</th>
            <th className="px-3 py-3 font-medium">SKU</th>
            <th className="px-3 py-3 font-medium">Unit</th>
            <th className="px-3 py-3 font-medium">Current Stock</th>
            <th className="px-3 py-3 font-medium">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.productId}>
              <td className="px-3 py-4 text-slate-700">
                <div className="font-medium text-slate-900">
                  {item.company?.name ?? `Company #${item.companyId}`}
                </div>
                <div className="text-xs text-slate-500">
                  {item.company?.code ?? ''}
                </div>
              </td>
              <td className="px-3 py-4 font-medium text-slate-900">
                {item.productName}
              </td>
              <td className="px-3 py-4 font-mono text-xs text-slate-600">
                {item.sku}
              </td>
              <td className="px-3 py-4 text-slate-700">{item.unit}</td>
              <td className="px-3 py-4 text-lg font-semibold text-slate-900">
                {formatNumber(item.currentStock)}
              </td>
              <td className="px-3 py-4">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {item.isLowStock ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Low stock
                    </span>
                  ) : null}
                  {item.isZeroStock ? (
                    <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      Zero stock
                    </span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
