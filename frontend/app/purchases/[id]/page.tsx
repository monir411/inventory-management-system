import { PurchaseDetailsPage } from '@/components/purchases/purchase-details-page';

export default async function PurchaseDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PurchaseDetailsPage purchaseId={Number(id)} />;
}
