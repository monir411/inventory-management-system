'use client';

import { useRouter } from 'next/navigation';

import { createWarehouse } from '@/lib/api/warehouses';
import type { WarehouseFormInput } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { WarehouseForm } from '@/components/warehouses/warehouse-form';

export function WarehouseCreatePage() {
  const router = useRouter();

  const handleSubmit = async (values: WarehouseFormInput) => {
    await createWarehouse(values);
    router.push('/warehouses');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Warehouses"
        title="Create warehouse"
        description="Simple warehouse setup for stock movement and purchase/sales operations."
      />
      <SectionCard
        title="Warehouse info"
        description="Keep warehouse setup short so operators can create it quickly."
      >
        <WarehouseForm submitLabel="Create warehouse" onSubmit={handleSubmit} />
      </SectionCard>
    </div>
  );
}

