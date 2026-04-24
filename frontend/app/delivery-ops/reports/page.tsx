import { Metadata } from 'next';
import { DeliveryReportsPage } from '@/components/delivery-ops/delivery-reports-page';

export const metadata: Metadata = {
  title: 'Delivery Reports - Dealer ERP',
};

export default function Page() {
  return <DeliveryReportsPage />;
}
