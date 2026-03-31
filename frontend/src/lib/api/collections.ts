import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api';
import type { CollectionFormInput, CollectionItem } from '@/types/collection';

export function getCollections(filters?: {
  routeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (filters?.routeId) {
    searchParams.set('routeId', filters.routeId);
  }

  if (filters?.fromDate) {
    searchParams.set('fromDate', filters.fromDate);
  }

  if (filters?.toDate) {
    searchParams.set('toDate', filters.toDate);
  }

  searchParams.set('page', String(filters?.page ?? 1));
  searchParams.set('limit', String(filters?.limit ?? 20));

  return apiRequest<PaginatedResponse<CollectionItem>>(
    `${apiEndpoints.collections}?${searchParams.toString()}`,
  );
}

export function getCollection(id: string) {
  return apiRequest<CollectionItem>(`${apiEndpoints.collections}/${id}`);
}

export function createCollection(payload: CollectionFormInput) {
  return apiRequest<CollectionItem>(apiEndpoints.collections, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
