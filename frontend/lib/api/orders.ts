import { apiRequest } from './client';
import type { Order } from '@/types/api';

export interface CreateOrderPayload {
  orderDate: string;
  companyId: number;
  routeId: number;
  shopId?: number;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  note?: string;
  items: {
    productId: number;
    quantity: number;
    freeQuantity: number;
    unitPrice: number;
    discountType: 'FIXED' | 'PERCENT';
    discountValue: number;
  }[];
}

export function createOrder(payload: CreateOrderPayload) {
  return apiRequest('orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getOrders(query?: Record<string, any>) {
  return apiRequest('orders', { query });
}

export function getOrder(id: number) {
  return apiRequest<Order>(`orders/${id}`);
}

export function getOrderStats() {
  return apiRequest('orders/stats');
}

export function updateOrderStatus(id: number, status: string) {
  return apiRequest(`orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateOrder(id: number, payload: CreateOrderPayload) {
  return apiRequest(`orders/${id}/update`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteOrder(id: number) {
  return apiRequest(`orders/${id}`, {
    method: 'DELETE',
  });
}
