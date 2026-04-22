import { Suspense } from 'react';
import { OrdersListPage } from '@/components/sales/orders-list-page';

export default function OrdersRoute() {
  return (
    <Suspense fallback={<div>Loading orders page...</div>}>
      <OrdersListPage />
    </Suspense>
  );
}
