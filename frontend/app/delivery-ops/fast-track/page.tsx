export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Metadata } from 'next';
import { FastTrackDispatchPage } from '@/components/delivery-ops/fast-track-dispatch-page';

export const metadata: Metadata = {
  title: 'Fast Track Order & Dispatch | ERP',
  description: 'Create an order and dispatch it immediately.',
};

export default function Page() {
  return <FastTrackDispatchPage />;
}
