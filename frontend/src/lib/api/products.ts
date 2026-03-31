import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { PaginatedResponse } from '@/types/api';
import type { Product } from '@/types/product';

export function getProducts(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set('search', params.search);
  }

  if (params?.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  searchParams.set('page', String(params?.page ?? 1));
  searchParams.set('limit', String(params?.limit ?? 100));

  return apiRequest<PaginatedResponse<Product>>(
    `${apiEndpoints.products}?${searchParams.toString()}`,
  );
}

