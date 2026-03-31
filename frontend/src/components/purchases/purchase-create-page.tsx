'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { getCompanies } from '@/lib/api/companies';
import { createPurchase } from '@/lib/api/purchases';
import { getProducts } from '@/lib/api/products';
import { getWarehouses } from '@/lib/api/warehouses';
import type { Company } from '@/types/company';
import type { Product } from '@/types/product';
import type { CreatePurchaseInput } from '@/types/purchase';
import type { Warehouse } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

type PurchaseFormItem = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

type FieldErrors = {
  purchaseNo?: string;
  purchaseDate?: string;
  companyId?: string;
  warehouseId?: string;
  items?: string;
  form?: string;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(value);
}

export function PurchaseCreatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [purchaseNo, setPurchaseNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getToday());
  const [companyId, setCompanyId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<PurchaseFormItem[]>([
    { productId: '', quantity: '1', unitPrice: '' },
  ]);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    Promise.all([
      getCompanies({ isActive: true }),
      getWarehouses({ isActive: true }),
      getProducts({ isActive: true, page: 1, limit: 100 }),
    ])
      .then(([companyData, warehouseData, productData]) => {
        setCompanies(companyData);
        setWarehouses(warehouseData);
        setProducts(productData.data);
      })
      .catch((error) => {
        setLookupError(error instanceof Error ? error.message : 'Failed to load lookup data.');
      });
  }, []);

  const computedItems = useMemo(
    () =>
      items.map((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;

        return {
          ...item,
          amount: quantity * unitPrice,
        };
      }),
    [items],
  );

  const totalAmount = computedItems.reduce((sum, item) => sum + item.amount, 0);

  const updateItem = (index: number, nextItem: Partial<PurchaseFormItem>) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextItem } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      { productId: '', quantity: '1', unitPrice: '' },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const applyProductRate = (index: number, productId: string) => {
    const selectedProduct = products.find((product) => product.id === productId);

    updateItem(index, {
      productId,
      unitPrice: selectedProduct ? String(selectedProduct.purchasePrice) : '',
    });
  };

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};

    if (purchaseNo.trim().length < 2) {
      nextErrors.purchaseNo = 'Purchase number is required.';
    }

    if (!purchaseDate) {
      nextErrors.purchaseDate = 'Purchase date is required.';
    }

    if (!companyId) {
      nextErrors.companyId = 'Please select a company.';
    }

    if (!warehouseId) {
      nextErrors.warehouseId = 'Please select a warehouse.';
    }

    const productIds = items.map((item) => item.productId).filter(Boolean);

    if (items.length === 0 || productIds.length !== items.length) {
      nextErrors.items = 'Each item row must have a product.';
    } else if (new Set(productIds).size !== productIds.length) {
      nextErrors.items = 'Duplicate products are not allowed in one purchase.';
    } else if (
      items.some(
        (item) => Number(item.quantity) <= 0 || Number(item.unitPrice) <= 0,
      )
    ) {
      nextErrors.items = 'Quantity and rate must be greater than zero.';
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CreatePurchaseInput = {
      purchaseNo: purchaseNo.trim(),
      purchaseDate,
      companyId,
      warehouseId,
      supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    startTransition(async () => {
      try {
        const purchase = await createPurchase(payload);
        router.replace(`/purchases/${purchase.id}`);
      } catch (error) {
        setErrors({
          form: error instanceof Error ? error.message : 'Failed to create purchase.',
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="New Purchase"
        title="Create purchase"
        description="Operator-friendly purchase entry with multiple items, quick rate fill, and instant total."
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <SectionCard
          title="Purchase info"
          description="Enter purchase header information first."
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Purchase no</label>
              <input
                value={purchaseNo}
                onChange={(event) => setPurchaseNo(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="PUR-001"
              />
              {errors.purchaseNo ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.purchaseNo}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Purchase date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
              />
              {errors.purchaseDate ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.purchaseDate}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Company</label>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.companyId ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.companyId}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouseId ? <p className="mt-2 text-sm text-[var(--danger)]">{errors.warehouseId}</p> : null}
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Supplier invoice no</label>
              <input
                value={supplierInvoiceNo}
                onChange={(event) => setSupplierInvoiceNo(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="Optional supplier invoice"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Note</label>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                placeholder="Optional note"
              />
            </div>
          </div>

          {lookupError ? <p className="mt-4 text-sm text-[var(--danger)]">{lookupError}</p> : null}
        </SectionCard>

        <SectionCard
          title="Purchase items"
          description="Select products, adjust quantity and rate, and review the amount instantly."
        >
          <div className="space-y-3">
            {computedItems.map((item, index) => (
              <div
                key={`purchase-item-${index}`}
                className="grid gap-3 rounded-[1.5rem] border border-[var(--border)] bg-white/85 p-4 lg:grid-cols-[2fr_120px_140px_140px_auto]"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Product</label>
                  <select
                    value={item.productId}
                    onChange={(event) => applyProductRate(index, event.target.value)}
                    className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                    className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                    className="shell-border w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Amount</label>
                  <div className="shell-border rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm font-semibold text-[var(--text)]">
                    {formatCurrency(item.amount)}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full rounded-2xl bg-[#fce9e7] px-4 py-3 text-sm font-medium text-[var(--danger)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {errors.items ? <p className="mt-4 text-sm text-[var(--danger)]">{errors.items}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addItem}
              className="rounded-2xl bg-[var(--primary-soft)] px-5 py-3 text-sm font-semibold text-[var(--text)]"
            >
              Add item
            </button>

            <div className="rounded-[1.5rem] bg-[#fff0d8] px-5 py-4">
              <p className="text-sm text-[var(--muted)]">Total amount</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </SectionCard>

        {errors.form ? <p className="text-sm text-[var(--danger)]">{errors.form}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isPending ? 'Saving purchase...' : 'Submit purchase'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/purchases')}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[var(--text)]"
          >
            Back to list
          </button>
        </div>
      </form>
    </div>
  );
}

