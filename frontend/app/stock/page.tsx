import { Metadata } from 'next';
import { StockPage } from '@/components/stock/stock-page';

export const metadata: Metadata = {
  title: 'Stock Management | ERP',
  description: 'Manage inventory, track movements, and monitor stock levels across all companies.',
};

export default function Page() {
  return <StockPage />;
}
