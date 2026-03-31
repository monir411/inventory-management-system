import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreatePurchaseInput,
  PurchaseDetails,
  PurchaseListFilters,
  PurchaseListItem,
} from '@/types/purchase';

export function getPurchases(filters: PurchaseListFilters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.companyId) {
    searchParams.set('companyId', filters.companyId);
  }

  if (filters.warehouseId) {
    searchParams.set('warehouseId', filters.warehouseId);
  }

  if (filters.fromDate) {
    searchParams.set('fromDate', filters.fromDate);
  }

  if (filters.toDate) {
    searchParams.set('toDate', filters.toDate);
  }

  searchParams.set('page', String(filters.page ?? 1));
  searchParams.set('limit', String(filters.limit ?? 20));

  return apiRequest<PaginatedResponse<PurchaseListItem>>(
    `${apiEndpoints.purchases}?${searchParams.toString()}`,
  );
}

export function getPurchase(id: string) {
  return apiRequest<PurchaseDetails>(`${apiEndpoints.purchases}/${id}`);
}

export function createPurchase(payload: CreatePurchaseInput) {
  return apiRequest<PurchaseDetails>(apiEndpoints.purchases, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
