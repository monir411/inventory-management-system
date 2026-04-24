import { Metadata } from 'next';
import { ConfirmedOrdersPage } from '@/components/delivery-ops/confirmed-orders-page';

export const metadata: Metadata = {
  title: 'Confirmed Orders Queue - Dealer ERP',
};

export default function Page() {
  return <ConfirmedOrdersPage />;
}
