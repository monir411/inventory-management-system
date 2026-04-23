import { apiRequest } from './client';

export type StockMovementType = 'OPENING' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN_IN' | 'DAMAGE' | 'SALE';

export interface CreateStockMovementPayload {
  productId: number;
  companyId: number;
  type: StockMovementType;
  quantity: number;
  note?: string;
  reference?: string;
}

export function createStockMovement(payload: CreateStockMovementPayload) {
  return apiRequest('stock/movements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getStockHistory(params: {
  companyId?: number;
  productId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  return apiRequest('stock/history', {
    query: params as Record<string, any>,
  });
}

export function getStockSummary(companyId?: number) {
  return apiRequest('stock/summary', {
    query: companyId ? { companyId } : {},
  });
}
