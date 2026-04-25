export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Suspense } from 'react';
import { NewOrderPage } from '@/components/orders/new-order-page';

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading edit order...</div>}>
      <NewOrderPage orderId={Number(id)} />
    </Suspense>
  );
}
