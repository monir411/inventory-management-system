import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { Warehouse, WarehouseFormInput } from '@/types/warehouse';

export function getWarehouses(params?: { isActive?: boolean }) {
  const searchParams = new URLSearchParams();

  if (params?.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  const query = searchParams.toString();

  return apiRequest<Warehouse[]>(
    `${apiEndpoints.warehouses}${query ? `?${query}` : ''}`,
  );
}

export function getWarehouse(id: string) {
  return apiRequest<Warehouse>(`${apiEndpoints.warehouses}/${id}`);
}

export function createWarehouse(payload: WarehouseFormInput) {
  return apiRequest<Warehouse>(apiEndpoints.warehouses, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWarehouse(id: string, payload: WarehouseFormInput) {
  return apiRequest<Warehouse>(`${apiEndpoints.warehouses}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWarehouse(id: string) {
  return apiRequest<{ message: string }>(`${apiEndpoints.warehouses}/${id}`, {
    method: 'DELETE',
  });
}
