import { apiRequest } from './client';

export async function getDashboardMetrics(companyId?: number) {
  return apiRequest<any>('/dashboard/metrics', {
    method: 'GET',
    query: { companyId },
  });
}
