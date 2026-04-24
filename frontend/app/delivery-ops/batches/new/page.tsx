import { Metadata } from 'next';
import { DispatchBatchCreatePage } from '@/components/delivery-ops/dispatch-batch-create-page';

export const metadata: Metadata = {
  title: 'Create Dispatch Batch - Dealer ERP',
};

export default function Page() {
  return <DispatchBatchCreatePage />;
}
