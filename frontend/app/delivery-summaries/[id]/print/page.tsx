import { PrintDeliverySummaryPage } from '../../../../components/delivery-summaries/print-delivery-summary-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Print Delivery Summary - Dealer ERP',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintDeliverySummaryPage id={id} />;
}
