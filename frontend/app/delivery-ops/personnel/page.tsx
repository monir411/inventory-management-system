import { DeliveryPersonnelPage } from '@/components/delivery-ops/delivery-personnel-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery Personnel | ERP',
};

export default function Page() {
  return <DeliveryPersonnelPage />;
}
