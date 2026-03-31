import { PurchaseDetailsPage } from '@/components/purchases/purchase-details-page';

type PurchaseDetailsRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PurchaseDetailsRoutePage({
  params,
}: PurchaseDetailsRoutePageProps) {
  const { id } = await params;

  return <PurchaseDetailsPage purchaseId={id} />;
}

