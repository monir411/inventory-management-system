import { apiRequest } from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import type { Company } from '@/types/company';

export function getCompanies(params?: { isActive?: boolean }) {
  const searchParams = new URLSearchParams();

  if (params?.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  const query = searchParams.toString();

  return apiRequest<Company[]>(
    `${apiEndpoints.companies}${query ? `?${query}` : ''}`,
  );
}

