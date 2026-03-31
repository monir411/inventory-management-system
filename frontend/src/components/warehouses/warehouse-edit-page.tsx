'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getWarehouse, updateWarehouse } from '@/lib/api/warehouses';
import type { Warehouse, WarehouseFormInput } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { WarehouseForm } from '@/components/warehouses/warehouse-form';

type WarehouseEditPageProps = {
  warehouseId: string;
};

export function WarehouseEditPage({ warehouseId }: WarehouseEditPageProps) {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWarehouse(warehouseId)
      .then(setWarehouse)
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load warehouse.');
      });
  }, [warehouseId]);

  const handleSubmit = async (values: WarehouseFormInput) => {
    await updateWarehouse(warehouseId, values);
    router.push('/warehouses');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Warehouses"
        title="Edit warehouse"
        description="Update warehouse information without extra steps."
      />

      <SectionCard
        title="Warehouse info"
        description="Edit the key warehouse details used across stock transactions."
      >
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {!warehouse && !error ? (
          <p className="text-sm text-[var(--muted)]">Loading warehouse...</p>
        ) : null}
        {warehouse ? (
          <WarehouseForm
            initialValues={warehouse}
            submitLabel="Update warehouse"
            onSubmit={handleSubmit}
          />
        ) : null}
      </SectionCard>
    </div>
  );
}

