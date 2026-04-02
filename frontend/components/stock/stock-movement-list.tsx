'use client';

import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { formatDateTime, formatNumber } from '@/lib/utils/format';
import type { StockMovement } from '@/types/api';

type StockMovementListProps = {
  movements: StockMovement[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
};

export function StockMovementList({
  movements,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  emptyTitle,
  emptyDescription,
}: StockMovementListProps) {
  return (
    <div className="space-y-3">
      {movements.map((movement) => (
        <div
          key={movement.id}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                {movement.product?.name ?? `Product #${movement.productId}`}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {movement.type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">
                {formatNumber(movement.quantity)} {movement.product?.unit ?? ''}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateTime(movement.movementDate)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {movement.note || 'No note provided.'}
          </p>
        </div>
      ))}

      {totalItems === 0 ? (
        <StateMessage title={emptyTitle} description={emptyDescription} />
      ) : null}

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
