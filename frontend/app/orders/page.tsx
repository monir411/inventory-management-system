export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Suspense } from 'react';
import { AllOrdersPage } from '@/components/orders/all-orders-page';

export default function OrdersRoute() {
  return (
    <Suspense fallback={<div>Loading orders page...</div>}>
      <AllOrdersPage />
    </Suspense>
  );
}
