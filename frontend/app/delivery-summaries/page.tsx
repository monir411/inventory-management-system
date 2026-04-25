export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { DeliverySummariesListPage } from '@/components/delivery-summaries/delivery-summaries-list-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery Summaries - Dealer ERP',
};

export default function Page() {
  return <DeliverySummariesListPage />;
}
