import { DeliverySummaryDetailsPage } from '../../../components/delivery-summaries/delivery-summary-details-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery Summary Details - Dealer ERP',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeliverySummaryDetailsPage id={id} />;
}
