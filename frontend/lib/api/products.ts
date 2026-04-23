import { apiRequest } from './client';
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from '@/types/api';

export function getProducts(query?: { companyId?: number; search?: string; isActive?: boolean }) {
  return apiRequest<Product[]>('products', {
    query: query as Record<string, any>,
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
