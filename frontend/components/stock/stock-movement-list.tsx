'use client';

import { Pagination } from '@/components/ui/pagination';
import { StateMessage } from '@/components/ui/state-message';
import { formatDateTime, formatNumber } from '@/lib/utils/format';
import type { StockMovement, StockMovementType } from '@/types/api';

const movementToneClasses: Record<StockMovementType, string> = {
  OPENING: 'bg-cyan-100 text-cyan-800',
  STOCK_IN: 'bg-emerald-100 text-emerald-800',
  SALE_OUT: 'bg-amber-100 text-amber-800',
  RETURN_IN: 'bg-violet-100 text-violet-800',
  ADJUSTMENT: 'bg-rose-100 text-rose-800',
};

const movementLabels: Record<StockMovementType, string> = {
  OPENING: 'Opening',
  STOCK_IN: 'Stock In',
  SALE_OUT: 'Sale Out',
  RETURN_IN: 'Return In',
  ADJUSTMENT: 'Adjustment',
};

type StockMovementListProps = {
  movements: StockMovement[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
};

function formatMovementQuantity(movement: StockMovement) {
  const value = formatNumber(movement.quantity);

  if (movement.quantity > 0) {
    return `+${value}`;
  }

  return value;
}

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
      {movements.map((movement) => {
        const quantityToneClassName =
          movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700';

        return (
          <div
            key={movement.id}
            className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {movement.product?.name ?? `Product #${movement.productId}`}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${movementToneClasses[movement.type]}`}
                  >
                    {movementLabels[movement.type]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span>{movement.company?.name ?? `Company #${movement.companyId}`}</span>
                  <span>{movement.product?.sku ?? 'No SKU'}</span>
                  <span>{movement.product?.unit ?? 'Unit missing'}</span>
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className={`text-2xl font-semibold ${quantityToneClassName}`}>
                  {formatMovementQuantity(movement)} {movement.product?.unit ?? ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(movement.movementDate)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
              {movement.note || 'No note provided for this movement.'}
            </div>
          </div>
        );
      })}

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
