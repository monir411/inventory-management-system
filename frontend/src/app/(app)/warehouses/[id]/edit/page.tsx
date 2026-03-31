import { WarehouseEditPage } from '@/components/warehouses/warehouse-edit-page';

type EditWarehouseRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWarehouseRoutePage({
  params,
}: EditWarehouseRoutePageProps) {
  const { id } = await params;

  return <WarehouseEditPage warehouseId={id} />;
}
