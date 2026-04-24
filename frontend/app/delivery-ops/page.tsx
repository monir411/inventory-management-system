import { Metadata } from 'next';
import { DeliveryOpsDashboardPage } from '@/components/delivery-ops/delivery-ops-dashboard-page';

export const metadata: Metadata = {
  title: 'Dispatch Command Center - Dealer ERP',
};

export default function Page() {
  return <DeliveryOpsDashboardPage />;
}
