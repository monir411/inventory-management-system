'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCompanies } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import { getStockMovements } from '@/lib/api/stock';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { useToastNotification } from '@/components/ui/toast-provider';
import { StockMovementList } from './stock-movement-list';
import type { Company, Product, StockMovement } from '@/types/api';

const movementPageSize = 12;

function parseId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function StockMovementsPage() {
  const searchParams = useSearchParams();
  const requestedCompanyIdRef = useRef<number | null>(
    parseId(searchParams.get('companyId')),
  );
  const requestedProductIdRef = useRef<number | null>(
    parseId(searchParams.get('productId')),
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [movementPage, setMovementPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load stock movements',
    tone: 'error',
  });

  useEffect(() => {
    async function loadCompaniesList() {
      try {
        setIsLoading(true);
        setError(null);

        const companyData = await getCompanies();
        setCompanies(companyData);

        const requestedCompanyId = requestedCompanyIdRef.current;
        const nextCompanyId =
          requestedCompanyId &&
          companyData.some((company) => company.id === requestedCompanyId)
            ? requestedCompanyId
            : companyData[0]?.id ?? null;

        setSelectedCompanyId(nextCompanyId);
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
  }, []);

  useEffect(() => {
    async function loadProductsForCompany() {
      if (!selectedCompanyId) {
        setProducts([]);
        setSelectedProductId(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const productData = await getProducts(selectedCompanyId);
        setProducts(productData);
        setSelectedProductId((current) => {
          const requestedProductId = requestedProductIdRef.current;
          const nextProductId =
            current && productData.some((product) => product.id === current)
              ? current
              : requestedProductId &&
                  productData.some((product) => product.id === requestedProductId)
                ? requestedProductId
                : null;

          requestedProductIdRef.current = null;
          return nextProductId;
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load products.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProductsForCompany();
  }, [selectedCompanyId]);

  useEffect(() => {
    async function loadMovements() {
      if (!selectedCompanyId) {
        setMovements([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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
      } finally {
        setIsLoading(false);
      }
    }

    void loadMovements();
  }, [selectedCompanyId, selectedProductId]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (movementPage - 1) * movementPageSize;
    return movements.slice(startIndex, startIndex + movementPageSize);
  }, [movementPage, movements]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  return (
    <div className="space-y-6">
      <PageCard
        title="All Stock Movements"
        description="Review the full stock movement history for the selected company and optional product filter."
        action={
          <Link
            href="/stock"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Back to stock
          </Link>
        }
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <select
            value={selectedCompanyId ?? ''}
            onChange={(event) => {
              setMovementPage(1);
              setSelectedProductId(null);
              setSelectedCompanyId(Number(event.target.value));
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProductId ?? ''}
            onChange={(event) => {
              setMovementPage(1);
              setSelectedProductId(
                event.target.value ? Number(event.target.value) : null,
              );
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.unit})
              </option>
            ))}
          </select>
        </div>

        {isLoading ? <LoadingBlock label="Loading stock movements..." /> : null}

        {!isLoading && !error ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm text-slate-300">Selected company</p>
              <p className="mt-2 text-xl font-semibold">
                {selectedCompany?.name ?? 'None'}
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-5 text-cyan-900">
              <p className="text-sm">Total stock movements</p>
              <p className="mt-2 text-3xl font-semibold">{movements.length}</p>
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title="Movement History"
        description="This page shows all stock movement entries, not just today's records."
      >
        {isLoading ? <LoadingBlock label="Loading movement history..." /> : null}
        {!isLoading && !error ? (
          <StockMovementList
            movements={paginatedMovements}
            totalItems={movements.length}
            currentPage={movementPage}
            pageSize={movementPageSize}
            onPageChange={setMovementPage}
            emptyTitle="No stock movements found"
            emptyDescription="Create opening stock, stock-in, or adjustment entries to see movement history here."
          />
        ) : null}
      </PageCard>
    </div>
  );
}
