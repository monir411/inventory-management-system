import { CreateSalePage } from '@/components/sales/create-sale-page';

export default async function EditSaleRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CreateSalePage saleId={id} />;
}
