import { apiRequest } from './client';
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from '@/types/api';

export function getProducts(
  query?:
    | number
    | { companyId?: number; search?: string; isActive?: boolean },
) {
  const normalizedQuery =
    typeof query === 'number' ? { companyId: query } : query;

  return apiRequest<Product[]>('products', {
    query: normalizedQuery as Record<string, any>,
  });
}

export function createProduct(payload: CreateProductPayload) {
  return apiRequest<Product>('products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: number, payload: UpdateProductPayload) {
  return apiRequest<Product>(`products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
