import { ShopDueDetailsPage } from '@/components/sales/shop-due-details-page';

export default async function ShopDueDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ShopDueDetailsPage shopId={Number(id)} />;
}
