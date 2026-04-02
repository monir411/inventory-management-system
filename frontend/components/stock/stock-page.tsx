'use client';

import {
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  StockMovementQuery,
  StockMovementType,
  StockSummaryItem,
} from '@/types/api';

type MovementActionMode = 'opening' | 'stock-in' | 'adjustment';

type MovementFormState = {
  productId: string;
  quantity: string;
  note: string;
  movementDate: string;
};

const stockTablePageSize = 10;
const movementPageSize = 12;
const movementTypeOptions: Array<{
  value: StockMovementType;
  label: string;
}> = [
  { value: 'OPENING', label: 'Opening' },
  { value: 'STOCK_IN', label: 'Stock In' },
  { value: 'SALE_OUT', label: 'Sale Out' },
  { value: 'RETURN_IN', label: 'Return In' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

const movementActionMeta: Record<
  MovementActionMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    submitLabel: string;
    quantityHint: string;
    notePlaceholder: string;
    buttonClassName: string;
    badgeClassName: string;
  }
> = {
  opening: {
    eyebrow: 'Opening stock',
    title: 'Add Opening Stock',
    description:
      'Use this when you are setting the starting balance for a product before regular transactions begin.',
    submitLabel: 'Save opening stock',
    quantityHint: 'Enter the opening balance that should become the starting stock.',
    notePlaceholder: 'Optional note about the opening balance',
    buttonClassName:
      'border-cyan-200 bg-cyan-50 text-cyan-900 hover:border-cyan-300 hover:bg-cyan-100',
    badgeClassName: 'bg-cyan-100 text-cyan-800',
  },
  'stock-in': {
    eyebrow: 'Stock received',
    title: 'Add Stock In',
    description:
      'Record new stock received from suppliers, warehouse transfers, or any other incoming inventory.',
    submitLabel: 'Save stock in',
    quantityHint: 'Enter the quantity that was added to stock.',
    notePlaceholder: 'Optional note about the incoming stock',
    buttonClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100',
    badgeClassName: 'bg-emerald-100 text-emerald-800',
  },
  adjustment: {
    eyebrow: 'Manual correction',
    title: 'Add Adjustment',
    description:
      'Use a positive value to increase stock or a negative value to reduce stock after a physical recount.',
    submitLabel: 'Save adjustment',
    quantityHint: 'Positive adds stock. Negative removes stock.',
    notePlaceholder: 'Optional note explaining the stock correction',
    buttonClassName:
      'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100',
    badgeClassName: 'bg-amber-100 text-amber-800',
  },
};

function getDefaultMovementDateTimeLocal() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function createInitialMovementForm(): MovementFormState {
  return {
    productId: '',
    quantity: '',
    note: '',
    movementDate: getDefaultMovementDateTimeLocal(),
  };
}

function parseId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMovementType(value: string | null): StockMovementType | null {
  return movementTypeOptions.some((option) => option.value === value)
    ? (value as StockMovementType)
    : null;
}

function getDateInputValue(value: Date) {
  const localTime = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

function getStartOfDayIso(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function getEndOfDayIso(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

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
  else if (sku.startsWith(normalizedKeyword)) score += 80;
  else if (sku.includes(normalizedKeyword)) score += 55;

  if (productName === normalizedKeyword) score += 95;
  else if (productName.startsWith(normalizedKeyword)) score += 85;
  else if (productName.includes(normalizedKeyword)) score += 60;

  if (companyCode === normalizedKeyword) score += 70;
  else if (companyCode.startsWith(normalizedKeyword)) score += 50;
  else if (companyCode.includes(normalizedKeyword)) score += 35;

  if (companyName === normalizedKeyword) score += 65;
  else if (companyName.startsWith(normalizedKeyword)) score += 45;
  else if (companyName.includes(normalizedKeyword)) score += 30;

  if (unit === normalizedKeyword) score += 20;
  else if (unit.includes(normalizedKeyword)) score += 10;

  if (selectedCompanyId && item.companyId === selectedCompanyId) {
    score += 15;
  }

  return score;
}

function isSameDay(value: string, targetDate: Date) {
  const date = new Date(value);

  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getDate() === targetDate.getDate()
  );
}

export function StockPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const showAllCompanyAlerts = view === 'alerts';
  const requestedCompanyIdRef = useRef<number | null>(
    parseId(searchParams.get('companyId')),
  );
  const requestedProductIdRef = useRef<number | null>(
    parseId(searchParams.get('productId')),
  );
  const currentStockSectionRef = useRef<HTMLDivElement | null>(null);
  const movementHistorySectionRef = useRef<HTMLDivElement | null>(null);
  const alertsSectionRef = useRef<HTMLDivElement | null>(null);
  const lowStockSectionRef = useRef<HTMLDivElement | null>(null);
  const zeroStockSectionRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const latestAutoMatchRequestRef = useRef(0);
  const latestCompanyDataRequestRef = useRef(0);
  const latestMovementRequestRef = useRef(0);
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
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const normalizedSearchTerm = searchTerm.trim();
  const [selectedType, setSelectedType] = useState<StockMovementType | ''>(
    parseMovementType(searchParams.get('type')) ?? '',
  );
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') ?? '');
  const [toDate, setToDate] = useState(searchParams.get('toDate') ?? '');
  const [activeAction, setActiveAction] = useState<MovementActionMode | null>(null);
  const [openingForm, setOpeningForm] = useState<MovementFormState>(() =>
    createInitialMovementForm(),
  );
  const [stockInForm, setStockInForm] = useState<MovementFormState>(() =>
    createInitialMovementForm(),
  );
  const [adjustmentForm, setAdjustmentForm] = useState<MovementFormState>(() =>
    createInitialMovementForm(),
  );
  const [summaryPage, setSummaryPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [zeroStockPage, setZeroStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [isCurrentStockOpen, setIsCurrentStockOpen] = useState(
    () => view === 'company' || view === 'current-stock',
  );
  const [isMovementHistoryOpen, setIsMovementHistoryOpen] = useState(
    () => view === 'movements' || view === 'history',
  );
  const [isLowStockOpen, setIsLowStockOpen] = useState(
    () => view === 'low-stock' || view === 'alerts',
  );
  const [isZeroStockOpen, setIsZeroStockOpen] = useState(
    () => view === 'zero-stock' || view === 'alerts',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<MovementActionMode | null>(null);
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
        const requestedCompanyId = requestedCompanyIdRef.current;
        const defaultCompanyId = showAllCompanyAlerts ? null : (companyData[0]?.id ?? null);
        const nextCompanyId =
          requestedCompanyId &&
          companyData.some((company) => company.id === requestedCompanyId)
            ? requestedCompanyId
            : defaultCompanyId;

        setCompanies(companyData);
        setSelectedCompanyId(nextCompanyId);
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
    if (view === 'company' || view === 'current-stock') {
      setIsCurrentStockOpen(true);
    }

    if (view === 'movements' || view === 'history') {
      setIsMovementHistoryOpen(true);
    }

    if (view === 'low-stock') {
      setIsLowStockOpen(true);
    }

    if (view === 'zero-stock') {
      setIsZeroStockOpen(true);
    }

    if (view === 'alerts') {
      setIsLowStockOpen(true);
      setIsZeroStockOpen(true);
    }
  }, [view]);

  useEffect(() => {
    async function loadCompanyData() {
      const requestId = latestCompanyDataRequestRef.current + 1;
      latestCompanyDataRequestRef.current = requestId;
      const requestedCompanyId = selectedCompanyId;
      const requestedProductId = selectedProductId;

      try {
        setIsLoading(true);
        setError(null);

        const [productData, summaryData, lowStockData, zeroStockData] =
          await Promise.all([
            requestedCompanyId ? getProducts(requestedCompanyId) : Promise.resolve([]),
            getStockSummary(
              requestedCompanyId ?? undefined,
              normalizedSearchTerm || undefined,
            ),
            getLowStockProducts(
              requestedCompanyId ?? undefined,
              10,
              normalizedSearchTerm || undefined,
            ),
            getZeroStockProducts(
              requestedCompanyId ?? undefined,
              normalizedSearchTerm || undefined,
            ),
          ]);

        if (requestId !== latestCompanyDataRequestRef.current) {
          return;
        }

        setProducts(productData);
        setSummary(summaryData);
        setLowStock(lowStockData);
        setZeroStock(zeroStockData);

        const nextProductId =
          requestedCompanyId &&
          requestedProductId &&
          productData.some((product) => product.id === requestedProductId)
            ? requestedProductId
            : requestedCompanyId &&
                requestedProductIdRef.current &&
                productData.some(
                  (product) => product.id === requestedProductIdRef.current,
                )
              ? requestedProductIdRef.current
              : null;

        setSelectedProductId(nextProductId);
        requestedProductIdRef.current = null;

        const getDefaultFormProductValue = (currentProductId: string) => {
          if (nextProductId) {
            return String(nextProductId);
          }

          if (
            currentProductId &&
            productData.some((product) => product.id === Number(currentProductId))
          ) {
            return currentProductId;
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
        if (requestId === latestCompanyDataRequestRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadCompanyData();
  }, [normalizedSearchTerm, selectedCompanyId, selectedProductId]);

  useEffect(() => {
    async function loadMovements() {
      const requestId = latestMovementRequestRef.current + 1;
      latestMovementRequestRef.current = requestId;
      const requestedCompanyId = selectedCompanyId;

      if (!requestedCompanyId) {
        setMovements([]);
        return;
      }

      try {
        setError(null);

        const movementQuery: StockMovementQuery = {
          productId: selectedProductId ?? undefined,
          type: selectedType || undefined,
          fromDate: getStartOfDayIso(fromDate),
          toDate: getEndOfDayIso(toDate),
          search: normalizedSearchTerm || undefined,
        };
        const movementData = await getStockMovements(
          requestedCompanyId,
          movementQuery,
        );

        if (requestId !== latestMovementRequestRef.current) {
          return;
        }

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
  }, [fromDate, normalizedSearchTerm, selectedCompanyId, selectedProductId, selectedType, toDate]);

  useEffect(() => {
    selectedCompanyIdRef.current = selectedCompanyId;
    selectedProductIdRef.current = selectedProductId;
  }, [selectedCompanyId, selectedProductId]);

  useEffect(() => {
    async function autoFillMatchedStock() {
      if (normalizedSearchTerm.length < 2) {
        latestAutoMatchRequestRef.current += 1;
        return;
      }

      const requestId = latestAutoMatchRequestRef.current + 1;
      latestAutoMatchRequestRef.current = requestId;

      try {
        const matchedItems = await getStockSummary(undefined, normalizedSearchTerm);

        if (requestId !== latestAutoMatchRequestRef.current) {
          return;
        }

        const rankedItems = matchedItems
          .map((item) => ({
            item,
            score: getStockMatchScore(
              item,
              normalizedSearchTerm,
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

    void autoFillMatchedStock();
  }, [normalizedSearchTerm]);

  useEffect(() => {
    if (activeAction && !selectedCompanyId) {
      setActiveAction(null);
    }
  }, [activeAction, selectedCompanyId]);

  useEffect(() => {
    if (isLoading || error || hasAutoScrolledRef.current) {
      return;
    }

    const targetSection =
      view === 'company' || view === 'current-stock'
        ? currentStockSectionRef.current
        : view === 'movements' || view === 'history'
          ? movementHistorySectionRef.current
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

  const defaultCompanyId = showAllCompanyAlerts ? null : (companies[0]?.id ?? null);
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
  const paginatedMovements = useMemo(() => {
    const startIndex = (movementPage - 1) * movementPageSize;
    return movements.slice(startIndex, startIndex + movementPageSize);
  }, [movementPage, movements]);
  const todayMovementCount = useMemo(() => {
    const today = new Date();
    return movements.filter((movement) => isSameDay(movement.movementDate, today)).length;
  }, [movements]);
  const activeFilterCount = [
    normalizedSearchTerm,
    selectedCompanyId !== defaultCompanyId ? 'company' : '',
    selectedProductId ? 'product' : '',
    selectedType,
    fromDate,
    toDate,
  ].filter(Boolean).length;
  const hasMovementFilters = Boolean(selectedType || fromDate || toDate);
  const hasAdvancedFilters = activeFilterCount > 0;

  function resetPagination() {
    setSummaryPage(1);
    setLowStockPage(1);
    setZeroStockPage(1);
    setMovementPage(1);
  }

  function scrollToSection(section: HTMLDivElement | null) {
    section?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function openSection(
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    section: HTMLDivElement | null,
  ) {
    setIsOpen(true);
    globalThis.setTimeout(() => {
      scrollToSection(section);
    }, 0);
  }

  function openActionModal(mode: MovementActionMode) {
    if (!selectedCompanyId) {
      setFormError('Select a company first to record stock changes.');
      return;
    }

    setFormError(null);
    setActiveAction(mode);
  }

  function clearWorkspaceFilters() {
    resetPagination();
    setSearchTerm('');
    setSelectedCompanyId(defaultCompanyId);
    setSelectedProductId(null);
    setSelectedType('');
    setFromDate('');
    setToDate('');
  }

  function applyTodayDateFilter() {
    const today = getDateInputValue(new Date());
    setMovementPage(1);
    setFromDate(today);
    setToDate(today);
  }

  function applyLast7DaysFilter() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    setMovementPage(1);
    setFromDate(getDateInputValue(startDate));
    setToDate(getDateInputValue(endDate));
  }

  function applyThisMonthFilter() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setMovementPage(1);
    setFromDate(getDateInputValue(monthStart));
    setToDate(getDateInputValue(today));
  }

  async function refreshStockData(companyId: number, productId: number | null) {
    const movementQuery: StockMovementQuery = {
      productId: productId ?? undefined,
      type: selectedType || undefined,
      fromDate: getStartOfDayIso(fromDate),
      toDate: getEndOfDayIso(toDate),
      search: normalizedSearchTerm || undefined,
    };

    const [summaryData, lowStockData, zeroStockData, movementData] =
      await Promise.all([
        getStockSummary(companyId, normalizedSearchTerm || undefined),
        getLowStockProducts(companyId, 10, normalizedSearchTerm || undefined),
        getZeroStockProducts(companyId, normalizedSearchTerm || undefined),
        getStockMovements(companyId, movementQuery),
      ]);

    setSummary(summaryData);
    setLowStock(lowStockData);
    setZeroStock(zeroStockData);
    setMovements(movementData);
  }

  async function submitMovement(
    event: FormEvent<HTMLFormElement>,
    mode: MovementActionMode,
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

    if (!form.quantity || Number.isNaN(Number(form.quantity))) {
      setFormError('Please enter a valid quantity.');
      return;
    }

    try {
      setIsSubmitting(mode);

      const payload = {
        companyId: selectedCompanyId,
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        note: form.note.trim() || undefined,
        movementDate: new Date(form.movementDate).toISOString(),
      };

      const resetForm = (current: MovementFormState) => ({
        ...createInitialMovementForm(),
        productId: selectedProductId ? String(selectedProductId) : current.productId,
      });

      if (mode === 'opening') {
        await addOpeningStock(payload);
        setOpeningForm((current) => resetForm(current));
        setSuccessMessage('Opening stock added successfully.');
      } else if (mode === 'stock-in') {
        await addStockIn(payload);
        setStockInForm((current) => resetForm(current));
        setSuccessMessage('Stock-in movement added successfully.');
      } else {
        await addAdjustment(payload);
        setAdjustmentForm((current) => resetForm(current));
        setSuccessMessage('Stock adjustment saved successfully.');
      }

      await refreshStockData(selectedCompanyId, selectedProductId);
      setActiveAction(null);
      openSection(setIsMovementHistoryOpen, movementHistorySectionRef.current);
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

  const selectedActionMeta = activeAction ? movementActionMeta[activeAction] : null;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eff6ff_72%,#fff7ed_100%)] p-6 shadow-[0_36px_90px_-56px_rgba(15,23,42,0.45)]">
        <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full border border-white/70 bg-white/20 blur-2xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/85 px-4 py-2 shadow-sm backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-800">
                  Inventory command center
                </p>
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.8rem]">
                Stock and movement workspace
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Review balances, filter movement history, monitor stock risks, and
                record stock changes from one focused workspace instead of jumping
                between separate pages.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openSection(setIsCurrentStockOpen, currentStockSectionRef.current)
                  }
                  className="rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Current stock
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openSection(
                      setIsMovementHistoryOpen,
                      movementHistorySectionRef.current,
                    )
                  }
                  className="rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Movement history
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLowStockOpen(true);
                    setIsZeroStockOpen(true);
                    globalThis.setTimeout(() => {
                      scrollToSection(alertsSectionRef.current);
                    }, 0);
                  }}
                  className="rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Stock alerts
                </button>
                {hasAdvancedFilters ? (
                  <span className="rounded-full border border-slate-900 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
                    {activeFilterCount} active filters
                  </span>
                ) : null}
              </div>
            </div>

            <div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-white/80 p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Quick actions
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Open a focused popup to record stock changes without pushing the
                    whole page down.
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-sm shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Action context
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {selectedCompany?.name ?? 'Select company'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedCompanyId
                      ? 'Actions will be recorded for this company'
                      : 'Choose a company below to unlock stock actions'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(Object.keys(movementActionMeta) as MovementActionMode[]).map((mode) => {
                  const meta = movementActionMeta[mode];

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => openActionModal(mode)}
                      disabled={!selectedCompanyId}
                      className={`rounded-[24px] border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-34px_rgba(15,23,42,0.35)] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none ${meta.buttonClassName}`}
                    >
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClassName}`}>
                        {meta.eyebrow}
                      </span>
                      <p className="mt-3 text-base font-semibold">{meta.title}</p>
                      <p className="mt-2 text-sm leading-6 opacity-80">
                        {meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!selectedCompanyId ? (
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-500">
                  Choose a company in the filters below before adding opening stock,
                  stock in, or adjustments.
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <HeroStatCard
              label="Selected company"
              value={selectedCompany?.name ?? 'All companies'}
              detail={
                selectedCompany
                  ? `${products.length} products available for stock actions`
                  : 'Alert mode across every company'
              }
              toneClassName="bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#164e63_100%)] text-white"
            />
            <HeroStatCard
              label="Matching products"
              value={String(filteredSummary.length)}
              detail="Filtered by company, product, and keyword"
              toneClassName="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#eef2ff_100%)] text-slate-900"
            />
            <HeroStatCard
              label="Low stock products"
              value={String(filteredLowStock.length)}
              detail="Products at or below the alert threshold"
              toneClassName="bg-[linear-gradient(135deg,#fff8eb_0%,#fffbeb_100%)] text-amber-950"
            />
            <HeroStatCard
              label="Movement matches"
              value={String(movements.length)}
              detail={`${todayMovementCount} movement entries from today`}
              toneClassName="bg-[linear-gradient(135deg,#ecfeff_0%,#f0f9ff_100%)] text-cyan-950"
            />
          </div>
        </div>
      </section>

      <PageCard
        title="Workspace Filters"
        description="Search stock and movement history together. The old stock movements page is now merged into this workspace, so company, product, keyword, type, and date filters all live here."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SectionStatusBadge
              label={
                hasAdvancedFilters
                  ? `${activeFilterCount} active workspace filters`
                  : 'Workspace filters are clean'
              }
              toneClassName="border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] text-slate-700"
              dotClassName={hasAdvancedFilters ? 'bg-slate-900' : 'bg-emerald-500'}
            />
            {hasAdvancedFilters ? (
              <button
                type="button"
                onClick={clearWorkspaceFilters}
                className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        }
      >
        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fafc_62%,#eef6ff_100%)] p-5 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.42)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Filter cockpit
              </p>
              <h4 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Search stock and movement history together
              </h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tune company, product, keyword, movement type, and date range from one control surface, then review the live summaries below without changing pages.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Current focus
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {selectedCompany?.name ?? 'All companies'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedProductId
                  ? 'One product is pinned across stock and movement views.'
                  : hasMovementFilters
                    ? 'Movement filters are shaping the history panel now.'
                    : 'Use the controls below to narrow the workspace instantly.'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterControlShell
              label="Keyword search"
              hint="Search by product, SKU, unit, note, movement type, or company"
              className="xl:col-span-2"
            >
              <input
                value={searchTerm}
                onChange={(event) => {
                  resetPagination();
                  setSearchTerm(event.target.value);
                }}
                placeholder="Start typing to search the full stock workspace"
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              />
            </FilterControlShell>

            <FilterControlShell
              label="Company"
              hint="Choose one company or stay in all-company mode"
            >
              <select
                value={selectedCompanyId ?? ''}
                onChange={(event) => {
                  resetPagination();
                  setSelectedProductId(null);
                  setSelectedCompanyId(
                    event.target.value ? Number(event.target.value) : null,
                  );
                }}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </FilterControlShell>

            <FilterControlShell
              label="Product"
              hint={
                selectedCompanyId
                  ? 'Limit the workspace to one product'
                  : 'Pick a company first to unlock product filtering'
              }
            >
              <select
                value={selectedProductId ?? ''}
                onChange={(event) => {
                  resetPagination();
                  setSelectedProductId(
                    event.target.value ? Number(event.target.value) : null,
                  );
                }}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={!selectedCompanyId}
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit})
                  </option>
                ))}
              </select>
            </FilterControlShell>

            <FilterControlShell
              label="Movement type"
              hint="Filter the history panel by movement category"
            >
              <select
                value={selectedType}
                onChange={(event) => {
                  setMovementPage(1);
                  setSelectedType(
                    event.target.value ? (event.target.value as StockMovementType) : '',
                  );
                }}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All types</option>
                {movementTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterControlShell>

            <FilterControlShell
              label="From date"
              hint="Start of the movement date window"
            >
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setMovementPage(1);
                  setFromDate(event.target.value);
                }}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              />
            </FilterControlShell>

            <FilterControlShell
              label="To date"
              hint="End of the movement date window"
            >
              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setMovementPage(1);
                  setToDate(event.target.value);
                }}
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              />
            </FilterControlShell>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <QuickRangeChip label="Today" onClick={applyTodayDateFilter} />
            <QuickRangeChip label="Last 7 days" onClick={applyLast7DaysFilter} />
            <QuickRangeChip label="This month" onClick={applyThisMonthFilter} />
            {hasMovementFilters ? (
              <SectionStatusBadge
                label="Movement filters active"
                toneClassName="border-slate-900 bg-slate-950 text-white"
                dotClassName="bg-cyan-400"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <FilterNote
            title="Smart search"
            description="Keyword search auto-selects the strongest company and product match when it finds a clear stock result."
          />
          <FilterNote
            title="Merged workflow"
            description="Movement history is now part of this page, so you can search, review, and update stock in one pass."
          />
          <FilterNote
            title="Quick action popups"
            description="Opening stock, stock in, and adjustments open in focused popups instead of taking over the whole page."
          />
        </div>
      </PageCard>

      {error ? (
        <StateMessage
          title="Stock workspace needs attention"
          description={error}
          tone="error"
        />
      ) : null}

      {isLoading ? <LoadingBlock label="Refreshing stock workspace..." /> : null}

      <div ref={currentStockSectionRef}>
        <PageCard
          title="Current Stock Summary"
          description="This summary is calculated from stock movements, so it is the best place to verify live balances before you add more stock or make corrections."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <SectionStatusBadge
                label={`${filteredSummary.length} matching products`}
                toneClassName="border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_100%)] text-slate-700"
                dotClassName="bg-cyan-500"
              />
              <SectionToggleButton
                isOpen={isCurrentStockOpen}
                onClick={() => setIsCurrentStockOpen((current) => !current)}
                openLabel="Open live stock snapshot"
                closeLabel="Hide live stock snapshot"
              />
            </div>
          }
        >
          {isCurrentStockOpen ? (
            <>
              <StockSummaryTable items={paginatedSummary} />
              <Pagination
                currentPage={summaryPage}
                totalItems={filteredSummary.length}
                pageSize={stockTablePageSize}
                onPageChange={setSummaryPage}
              />
            </>
          ) : (
            <SectionCollapsedNotice
              title="Live stock snapshot is closed"
              description="Click the open button to review current balances, health badges, and product-by-product stock details."
            />
          )}
        </PageCard>
      </div>

      <div ref={movementHistorySectionRef}>
        <PageCard
          title="Movement History"
          description="Full movement history now lives here on the stock page. Use the filters above to narrow by keyword, type, product, or date range."
          action={
            <div className="flex flex-wrap items-center gap-3">
              {selectedCompanyId ? (
                <SectionStatusBadge
                  label={`${movements.length} matching movements`}
                  toneClassName="border-cyan-200 bg-[linear-gradient(135deg,#ecfeff_0%,#f0f9ff_100%)] text-cyan-900"
                  dotClassName="bg-cyan-500"
                />
              ) : null}
              <SectionToggleButton
                isOpen={isMovementHistoryOpen}
                onClick={() => setIsMovementHistoryOpen((current) => !current)}
                openLabel="Open movement history"
                closeLabel="Hide movement history"
              />
            </div>
          }
        >
          {isMovementHistoryOpen ? selectedCompanyId ? (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Selected company" value={selectedCompany?.name ?? 'None'} />
                <MiniMetric label="Matching records" value={String(movements.length)} />
                <MiniMetric label="Today in results" value={String(todayMovementCount)} />
              </div>
              <StockMovementList
                movements={paginatedMovements}
                totalItems={movements.length}
                currentPage={movementPage}
                pageSize={movementPageSize}
                onPageChange={setMovementPage}
                emptyTitle="No stock movements found"
                  emptyDescription="Try widening the filters above or use a quick action popup to add opening stock, stock in, or an adjustment."
                />
              </>
            ) : (
              <MovementHistoryPlaceholder />
            ) : (
              <SectionCollapsedNotice
                title="Movement history is closed"
                description="Click the open button to review stock entries, filters, and today’s movement activity."
              />
            )}
        </PageCard>
      </div>

      <div ref={alertsSectionRef} className="grid gap-6 xl:grid-cols-2">
        <div ref={lowStockSectionRef}>
          <PageCard
            title="Low Stock Products"
            description="Products with current stock above zero and at or below the backend threshold."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <SectionStatusBadge
                  label={`${filteredLowStock.length} products need attention`}
                  toneClassName="border-amber-200 bg-[linear-gradient(135deg,#fff8eb_0%,#fffbeb_100%)] text-amber-900"
                  dotClassName="bg-amber-500"
                />
                <SectionToggleButton
                  isOpen={isLowStockOpen}
                  onClick={() => setIsLowStockOpen((current) => !current)}
                  openLabel="Open low stock products"
                  closeLabel="Hide low stock products"
                />
              </div>
            }
          >
            {isLowStockOpen ? (
              <>
                <StockSummaryTable items={paginatedLowStock} />
                <Pagination
                  currentPage={lowStockPage}
                  totalItems={filteredLowStock.length}
                  pageSize={stockTablePageSize}
                  onPageChange={setLowStockPage}
                />
              </>
            ) : (
              <SectionCollapsedNotice
                title="Low stock products are closed"
                description="Click the open button to review which products are near the reorder line."
              />
            )}
          </PageCard>
        </div>

        <div ref={zeroStockSectionRef}>
          <PageCard
            title="Zero Stock Products"
            description="Products currently calculated as zero stock from stock movements."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <SectionStatusBadge
                  label={`${filteredZeroStock.length} products are fully out`}
                  toneClassName="border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#fff5f7_100%)] text-rose-900"
                  dotClassName="bg-rose-500"
                />
                <SectionToggleButton
                  isOpen={isZeroStockOpen}
                  onClick={() => setIsZeroStockOpen((current) => !current)}
                  openLabel="Open zero stock products"
                  closeLabel="Hide zero stock products"
                />
              </div>
            }
          >
            {isZeroStockOpen ? (
              <>
                <StockSummaryTable items={paginatedZeroStock} />
                <Pagination
                  currentPage={zeroStockPage}
                  totalItems={filteredZeroStock.length}
                  pageSize={stockTablePageSize}
                  onPageChange={setZeroStockPage}
                />
              </>
            ) : (
              <SectionCollapsedNotice
                title="Zero stock products are closed"
                description="Click the open button to review the products that are fully out of stock."
              />
            )}
          </PageCard>
        </div>
      </div>

      <ModalShell
        isOpen={Boolean(activeAction && selectedActionMeta)}
        title={selectedActionMeta?.title ?? ''}
        description={selectedActionMeta?.description ?? ''}
        onClose={() => {
          if (!isSubmitting) {
            setActiveAction(null);
          }
        }}
      >
        {activeAction && selectedActionMeta ? (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedActionMeta.badgeClassName}`}>
                    {selectedActionMeta.eyebrow}
                  </span>
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {selectedCompany?.name ?? 'No company selected'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {selectedActionMeta.description}
                  </p>
                </div>
                {selectedProductId && products.some((product) => product.id === selectedProductId) ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Focus product:{' '}
                    <span className="font-semibold text-slate-900">
                      {products.find((product) => product.id === selectedProductId)?.name}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {activeAction === 'opening' ? (
              <MovementForm
                products={products}
                form={openingForm}
                setForm={setOpeningForm}
                quantityHint={movementActionMeta.opening.quantityHint}
                notePlaceholder={movementActionMeta.opening.notePlaceholder}
                submitLabel={
                  isSubmitting === 'opening'
                    ? 'Saving...'
                    : movementActionMeta.opening.submitLabel
                }
                onCancel={() => setActiveAction(null)}
                onSubmit={(event) => void submitMovement(event, 'opening')}
              />
            ) : null}

            {activeAction === 'stock-in' ? (
              <MovementForm
                products={products}
                form={stockInForm}
                setForm={setStockInForm}
                quantityHint={movementActionMeta['stock-in'].quantityHint}
                notePlaceholder={movementActionMeta['stock-in'].notePlaceholder}
                submitLabel={
                  isSubmitting === 'stock-in'
                    ? 'Saving...'
                    : movementActionMeta['stock-in'].submitLabel
                }
                onCancel={() => setActiveAction(null)}
                onSubmit={(event) => void submitMovement(event, 'stock-in')}
              />
            ) : null}

            {activeAction === 'adjustment' ? (
              <MovementForm
                products={products}
                form={adjustmentForm}
                setForm={setAdjustmentForm}
                quantityHint={movementActionMeta.adjustment.quantityHint}
                notePlaceholder={movementActionMeta.adjustment.notePlaceholder}
                submitLabel={
                  isSubmitting === 'adjustment'
                    ? 'Saving...'
                    : movementActionMeta.adjustment.submitLabel
                }
                onCancel={() => setActiveAction(null)}
                onSubmit={(event) => void submitMovement(event, 'adjustment')}
              />
            ) : null}
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}

function HeroStatCard({
  label,
  value,
  detail,
  toneClassName,
}: {
  label: string;
  value: string;
  detail: string;
  toneClassName: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/70 p-5 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.45)] ${toneClassName}`}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
          {label}
        </p>
        <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-3 text-sm leading-6 opacity-80">{detail}</p>
      </div>
    </div>
  );
}

function FilterControlShell({
  label,
  hint,
  className = '',
  children,
}: {
  label: string;
  hint: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={`rounded-[26px] border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
        </div>
      </div>
      {children}
    </label>
  );
}

function QuickRangeChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
    >
      {label}
    </button>
  );
}

function FilterNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Workspace note
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SectionStatusBadge({
  label,
  toneClassName,
  dotClassName,
}: {
  label: string;
  toneClassName: string;
  dotClassName: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-medium shadow-sm ${toneClassName}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
      <span>{label}</span>
    </div>
  );
}

function SectionToggleButton({
  isOpen,
  onClick,
  openLabel,
  closeLabel,
}: {
  isOpen: boolean;
  onClick: () => void;
  openLabel: string;
  closeLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {isOpen ? closeLabel : openLabel}
    </button>
  );
}

function SectionCollapsedNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function MovementHistoryPlaceholder() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef6ff_100%)] p-5 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.5)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            Movement readiness
          </p>
          <h4 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Pick a company to unlock live movement history
          </h4>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            All-company mode helps you scan alert counts, but movement history and stock updates become much easier once one company is in focus.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Status
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            Awaiting company focus
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Select a company above and this panel will switch into movement analytics.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold text-slate-950">Review alerts first</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the summary, low-stock, and zero-stock panels to spot which company needs attention before opening movement history.
          </p>
        </div>
        <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold text-slate-950">Update stock faster</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Once a company is selected, the quick action popups stay aligned with that company for opening stock, stock-in, and adjustment work.
          </p>
        </div>
      </div>
    </div>
  );
}

type ModalShellProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalShell({
  isOpen,
  title,
  description,
  onClose,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
              Stock action popup
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

type MovementFormProps = {
  products: Product[];
  form: MovementFormState;
  setForm: React.Dispatch<React.SetStateAction<MovementFormState>>;
  quantityHint: string;
  notePlaceholder: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function MovementForm({
  products,
  form,
  setForm,
  quantityHint,
  notePlaceholder,
  submitLabel,
  onCancel,
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
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
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
          placeholder="Enter quantity"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
        />
        <p className="text-xs leading-5 text-slate-500">{quantityHint}</p>
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
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Note</span>
        <textarea
          value={form.note}
          onChange={(event) =>
            setForm((current) => ({ ...current, note: event.target.value }))
          }
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
          placeholder={notePlaceholder}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function StockSummaryTable({ items }: { items: StockSummaryItem[] }) {
  if (items.length === 0) {
    return (
      <StateMessage
        title="No products to show"
        description="Try another company or widen the filters. Stock items appear here as soon as movements exist for the matching products."
      />
    );
  }

  const activeItems = items.filter((item) => item.isActive).length;
  const lowStockItems = items.filter((item) => item.isLowStock).length;
  const zeroStockItems = items.filter((item) => item.isZeroStock).length;
  const inventoryStatusTitle =
    zeroStockItems > 0
      ? 'Stockout risk is live'
      : lowStockItems > 0
        ? 'Reorder watch is active'
        : 'Inventory looks healthy';
  const inventoryStatusDescription =
    zeroStockItems > 0
      ? `${zeroStockItems} product${zeroStockItems === 1 ? '' : 's'} already hit zero and should be refilled first.`
      : lowStockItems > 0
        ? `${lowStockItems} product${lowStockItems === 1 ? '' : 's'} need a reorder soon while the rest of the catalog stays sell-ready.`
        : `All ${activeItems} active product${activeItems === 1 ? '' : 's'} are sitting in a comfortable stock range.`;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] p-5 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.55)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Inventory pulse
            </p>
            <h4 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Live stock snapshot
            </h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review the products in view, confirm the live balance, and spot reorder pressure before you open another stock action popup.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Focus status
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {inventoryStatusTitle}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {inventoryStatusDescription}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StockSummaryMetric
          label="Products in view"
          value={String(items.length)}
          detail="Visible in the current filter set"
          surfaceClassName="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]"
          valueClassName="text-slate-950"
          dotClassName="bg-slate-500"
        />
        <StockSummaryMetric
          label="Active products"
          value={String(activeItems)}
          detail="Currently marked as active in the catalog"
          surfaceClassName="bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_100%)]"
          valueClassName="text-emerald-900"
          dotClassName="bg-emerald-500"
        />
        <StockSummaryMetric
          label="Low stock"
          value={String(lowStockItems)}
          detail={
            lowStockItems > 0 ? 'Needs reorder follow-up soon' : 'No low stock alerts in view'
          }
          surfaceClassName="bg-[linear-gradient(135deg,#fff8eb_0%,#fffbeb_100%)]"
          valueClassName="text-amber-900"
          dotClassName="bg-amber-500"
        />
        <StockSummaryMetric
          label="Zero stock"
          value={String(zeroStockItems)}
          detail={
            zeroStockItems > 0
              ? 'Immediate refill priority'
              : 'No products are fully out right now'
          }
          surfaceClassName="bg-[linear-gradient(135deg,#fff1f2_0%,#fff5f7_100%)]"
          valueClassName="text-rose-900"
          dotClassName="bg-rose-500"
        />
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => {
          const stockToneClassName = getStockToneClassName(item);

          return (
            <div
              key={item.productId}
              className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#ffffff_100%)] p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-24 opacity-80 ${getStockAuraClassName(item)}`}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 h-12 w-1.5 rounded-full ${getStockAccentBarClassName(item)}`}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Product #{item.productId}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {getStockStateSupportCopy(item)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`min-w-[132px] rounded-[24px] border border-white/70 px-4 py-3 text-right shadow-sm ${stockToneClassName}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                      Available
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {formatNumber(item.currentStock)}
                    </p>
                    <div className="mt-3 h-2 rounded-full bg-white/60">
                      <div
                        className={`h-2 rounded-full ${getStockMeterClassName(item)}`}
                        style={{ width: getStockMeterWidth(item) }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Company
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">
                      {item.company?.name ?? `Company #${item.companyId}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.company?.code ?? 'No company code'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        SKU
                      </p>
                      <p className="mt-2 font-mono text-xs text-slate-700">{item.sku}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Unit
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">{item.unit}</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      <StockFlagBadge
                        label={item.isActive ? 'Active' : 'Inactive'}
                        toneClassName={
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }
                      />
                      <StockFlagBadge
                        label={getStockStateLabel(item)}
                        toneClassName={getStockStateBadgeClassName(item)}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {getStockStateSupportCopy(item)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_28px_70px_-48px_rgba(15,23,42,0.5)]">
          <div className="grid grid-cols-[1.35fr_1fr_0.95fr_0.95fr_1fr] gap-4 border-b border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <div>Product</div>
            <div>Company</div>
            <div>Catalog</div>
            <div>Live Stock</div>
            <div>Health</div>
          </div>

          <div className="space-y-3 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
            {items.map((item) => {
              const stockToneClassName = getStockToneClassName(item);

              return (
                <div
                  key={item.productId}
                  className="grid grid-cols-[1.35fr_1fr_0.95fr_0.95fr_1fr] gap-4 rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)]"
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 h-14 w-1.5 rounded-full ${getStockAccentBarClassName(item)}`}
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Product #{item.productId}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {item.productName}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {getStockStateSupportCopy(item)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.company?.name ?? `Company #${item.companyId}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.company?.code ?? 'No company code'}
                      </p>
                    </div>
                    <StockFlagBadge
                      label={item.isActive ? 'Active catalog' : 'Inactive catalog'}
                      toneClassName={
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        SKU
                      </p>
                      <p className="mt-2 font-mono text-xs text-slate-700">{item.sku}</p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Unit
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">{item.unit}</p>
                    </div>
                  </div>

                  <div
                    className={`rounded-[24px] border border-white/70 px-4 py-4 shadow-sm ${stockToneClassName}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
                      Available
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {formatNumber(item.currentStock)}
                    </p>
                    <div className="mt-4 h-2 rounded-full bg-white/60">
                      <div
                        className={`h-2 rounded-full ${getStockMeterClassName(item)}`}
                        style={{ width: getStockMeterWidth(item) }}
                      />
                    </div>
                    <p className="mt-3 text-sm opacity-80">
                      {item.isZeroStock
                        ? 'Refill before the next movement cycle.'
                        : item.isLowStock
                          ? 'Approaching the reorder line.'
                          : 'Balance looks strong for daily activity.'}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        <StockFlagBadge
                        label={getStockStateLabel(item)}
                        toneClassName={getStockStateBadgeClassName(item)}
                      />
                      {item.company?.code ? (
                        <StockFlagBadge
                          label={item.company.code}
                          toneClassName="bg-slate-100 text-slate-700"
                        />
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {getStockStateSupportCopy(item)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StockSummaryMetric({
  label,
  value,
  detail,
  surfaceClassName,
  valueClassName,
  dotClassName,
}: {
  label: string;
  value: string;
  detail: string;
  surfaceClassName: string;
  valueClassName: string;
  dotClassName: string;
}) {
  return (
    <div
      className={`rounded-[26px] border border-white/80 px-4 py-4 shadow-sm backdrop-blur ${surfaceClassName}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>
      <p className={`mt-4 text-3xl font-semibold tracking-tight ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function StockFlagBadge({
  label,
  toneClassName,
}: {
  label: string;
  toneClassName: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

function getStockStateLabel(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'Out of stock';
  }

  if (item.isLowStock) {
    return 'Low stock';
  }

  return 'Healthy stock';
}

function getStockStateBadgeClassName(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'bg-rose-100 text-rose-700';
  }

  if (item.isLowStock) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-cyan-100 text-cyan-700';
}

function getStockToneClassName(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'bg-rose-50 text-rose-900';
  }

  if (item.isLowStock) {
    return 'bg-amber-50 text-amber-900';
  }

  return 'bg-cyan-50 text-cyan-900';
}

function getStockAccentBarClassName(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'bg-[linear-gradient(180deg,#fb7185_0%,#e11d48_100%)]';
  }

  if (item.isLowStock) {
    return 'bg-[linear-gradient(180deg,#fbbf24_0%,#f59e0b_100%)]';
  }

  return 'bg-[linear-gradient(180deg,#67e8f9_0%,#0891b2_100%)]';
}

function getStockAuraClassName(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.22),transparent_68%)]';
  }

  if (item.isLowStock) {
    return 'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_68%)]';
  }

  return 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_68%)]';
}

function getStockMeterClassName(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'bg-rose-500';
  }

  if (item.isLowStock) {
    return 'bg-amber-400';
  }

  return 'bg-cyan-500';
}

function getStockMeterWidth(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return '10%';
  }

  if (item.isLowStock) {
    return '42%';
  }

  return '84%';
}

function getStockStateSupportCopy(item: StockSummaryItem) {
  if (item.isZeroStock) {
    return 'Immediate refill recommended before the next sales round.';
  }

  if (item.isLowStock) {
    return 'Reorder soon to keep this product away from a stockout.';
  }

  return 'Comfortable balance for current daily movement activity.';
}
