import { Metadata } from 'next';
import { NewOrderPage } from '@/components/orders/new-order-page';

export const metadata: Metadata = {
  title: 'New Order | ERP',
  description: 'Create a new order for a shop.',
};

export default function Page() {
  return <NewOrderPage />;
}
