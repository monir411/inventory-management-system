
import {
  CreateDeliverySummaryPayload,
  DeliverySummariesQuery,
  DeliverySummary,
  PaginatedResponse,
  UpdateDeliverySummaryPayload,
} from '@/types/api';
import { apiRequest } from './client';

export async function createDeliverySummary(
  payload: CreateDeliverySummaryPayload,
): Promise<DeliverySummary> {
  return apiRequest<DeliverySummary>('delivery-summaries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDeliverySummaries(
  query?: DeliverySummariesQuery,
): Promise<PaginatedResponse<DeliverySummary>> {
  return apiRequest<PaginatedResponse<DeliverySummary>>('delivery-summaries', {
    query: query as Record<string, string | number | boolean | undefined>,
  });
}

export async function getDeliverySummary(id: number): Promise<DeliverySummary> {
  return apiRequest<DeliverySummary>(`delivery-summaries/${id}`);
}

export async function updateDeliverySummary(
  id: number,
  payload: UpdateDeliverySummaryPayload,
): Promise<DeliverySummary> {
  return apiRequest<DeliverySummary>(`delivery-summaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDeliverySummary(id: number): Promise<void> {
  return apiRequest<void>(`delivery-summaries/${id}`, {
    method: 'DELETE',
  });
}
