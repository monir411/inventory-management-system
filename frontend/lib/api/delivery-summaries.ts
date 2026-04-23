import { apiRequest } from './client';
import type { PaginatedResponse } from '@/types/api';

export interface DeliverySummary {
  id: number;
  deliveryDate: string;
  companyId: number;
  company: { name: string };
  routeId: number;
  route: { name: string };
  status: 'DRAFT' | 'COMPLETED';
  morningPrinted: boolean;
  finalPrinted: boolean;
  totalAmount: number;
  note?: string;
  items: DeliverySummaryItem[];
  createdAt: string;
}

export interface DeliverySummaryItem {
  id: number;
  productId: number;
  product: { name: string; unit: string };
  orderedQuantity: number;
  returnedQuantity: number;
  soldQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export function getDeliverySummaries(query: any = {}) {
  return apiRequest<PaginatedResponse<DeliverySummary>>('delivery-summaries', {
    query,
  });
}

export function getDeliverySummary(id: number) {
  return apiRequest<DeliverySummary>(`delivery-summaries/${id}`);
}

export function syncDeliverySummary(payload: { date: string, companyId: number, routeId: number }) {
  return apiRequest<DeliverySummary>('delivery-summaries/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDeliveryReturns(id: number, items: { productId: number, returnedQuantity: number }[]) {
  return apiRequest<DeliverySummary>(`delivery-summaries/${id}/returns`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export function markDeliveryAsPrinted(id: number, mode: 'morning' | 'final') {
  return apiRequest<DeliverySummary>(`delivery-summaries/${id}/print`, {
    method: 'PATCH',
    query: { mode },
  });
}

export function deleteDeliverySummary(id: number) {
  return apiRequest<{ success: boolean }>(`delivery-summaries/${id}`, {
    method: 'DELETE',
  });
}
