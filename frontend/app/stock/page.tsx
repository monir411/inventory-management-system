import { Suspense } from 'react';
import { StockPage } from '@/components/stock/stock-page';
import { LoadingBlock } from '@/components/ui/loading-block';

export default function StockRoute() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading stock workspace..." />}>
      <StockPage />
    </Suspense>
  );
}
