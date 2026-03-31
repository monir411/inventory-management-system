import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { RouteItem } from '@/types/route';

export function getRoutes(params?: { isActive?: boolean }) {
  const searchParams = new URLSearchParams();

  if (params?.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  const query = searchParams.toString();

  return apiRequest<RouteItem[]>(
    `${apiEndpoints.routes}${query ? `?${query}` : ''}`,
  );
}

