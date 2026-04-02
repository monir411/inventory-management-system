import { apiRequest } from './client';
import type {
  CreateStockMovementPayload,
  StockMovement,
  StockSummaryItem,
} from '@/types/api';

export function getStockSummary(companyId?: number, search?: string) {
  return apiRequest<StockSummaryItem[]>('stock/summary/current', {
    query: { companyId, search },
  });
}

export function getLowStockProducts(
  companyId?: number,
  threshold = 10,
  search?: string,
) {
  return apiRequest<StockSummaryItem[]>('stock/summary/low-stock', {
    query: { companyId, threshold, search },
  });
}

export function getZeroStockProducts(companyId?: number, search?: string) {
  return apiRequest<StockSummaryItem[]>('stock/summary/zero-stock', {
    query: { companyId, search },
  });
}

export function getStockMovements(companyId: number, productId?: number) {
  return apiRequest<StockMovement[]>('stock/movements', {
    query: { companyId, productId },
  });
}

export function addOpeningStock(payload: CreateStockMovementPayload) {
  return apiRequest('stock/opening', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addStockIn(payload: CreateStockMovementPayload) {
  return apiRequest('stock/in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addAdjustment(payload: CreateStockMovementPayload) {
  return apiRequest('stock/adjustment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
