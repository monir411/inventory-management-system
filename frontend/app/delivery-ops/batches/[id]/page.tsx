import { Metadata } from 'next';
import { DispatchBatchDetailsPage } from '@/components/delivery-ops/dispatch-batch-details-page';

export const metadata: Metadata = {
  title: 'Dispatch Batch Details - Dealer ERP',
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DispatchBatchDetailsPage id={id} />;
}
