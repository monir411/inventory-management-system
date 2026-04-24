import { Metadata } from 'next';
import { DispatchBatchPrintPage } from '@/components/delivery-ops/dispatch-batch-print-page';

export const metadata: Metadata = {
  title: 'Morning Delivery Summary - Dealer ERP',
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DispatchBatchPrintPage id={id} mode="morning" />;
}
