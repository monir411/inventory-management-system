import { CreateDeliverySummaryPage } from '@/components/delivery-summaries/create-delivery-summary-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Delivery Summary - Inventory Management',
};

export default function Page() {
  return <CreateDeliverySummaryPage />;
}
