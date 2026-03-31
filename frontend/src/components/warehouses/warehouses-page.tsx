'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { deleteWarehouse, getWarehouses } from '@/lib/api/warehouses';
import type { Warehouse } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWarehouses();
  }, []);

  const filteredWarehouses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        warehouse.name.toLowerCase().includes(normalizedSearch) ||
        (warehouse.code ?? '').toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && warehouse.isActive) ||
        (statusFilter === 'inactive' && !warehouse.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, warehouses]);

  const handleDelete = async (warehouseId: string, warehouseName: string) => {
    const confirmed = window.confirm(`Delete warehouse "${warehouseName}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteWarehouse(warehouseId);
      await loadWarehouses();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to delete warehouse.');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Warehouses"
        title="Warehouse management"
        description="Manage warehouse records simply for stock movements, purchases, and sales."
      />

      <SectionCard
        title="Filters"
        description="Use a quick name/code search and active status filter."
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="Search by warehouse name or code"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
            }
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <Link
            href="/warehouses/new"
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            Add warehouse
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title="Warehouse list"
        description="Clean list for operators with quick edit and delete actions."
      >
        {loading ? <p className="text-sm text-[var(--muted)]">Loading warehouses...</p> : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        {!loading && !error && filteredWarehouses.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 px-4 py-6 text-sm text-[var(--muted)]">
            No warehouses found for the current filter.
          </div>
        ) : null}

        {!loading && !error && filteredWarehouses.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
            <div className="hidden grid-cols-5 gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] lg:grid">
              <div>Name</div>
              <div>Code</div>
              <div>Status</div>
              <div>Note</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {filteredWarehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-5 lg:items-center lg:gap-4"
                >
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Name
                    </span>
                    <p className="font-semibold text-[var(--text)]">{warehouse.name}</p>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Code
                    </span>
                    <p className="text-sm text-[var(--text)]">{warehouse.code || '-'}</p>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Status
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        warehouse.isActive
                          ? 'bg-[var(--primary-soft)] text-[var(--text)]'
                          : 'bg-[#fce9e7] text-[var(--danger)]'
                      }`}
                    >
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] lg:hidden">
                      Note
                    </span>
                    <p className="text-sm text-[var(--muted)]">{warehouse.note || '-'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/warehouses/${warehouse.id}/edit`}
                      className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-[var(--text)]"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(warehouse.id, warehouse.name)}
                      className="rounded-full bg-[#fce9e7] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

