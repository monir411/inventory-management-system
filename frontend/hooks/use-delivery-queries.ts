import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getDeliverySummaries, getDeliverySummary } from '@/lib/api/delivery-summaries';
import { DeliverySummariesQuery, DeliverySummary, PaginatedResponse } from '@/types/api';

export function useDeliverySummaries(query: DeliverySummariesQuery) {
  return useQuery({
    queryKey: ['delivery-summaries', 'list', query],
    queryFn: () => getDeliverySummaries(query),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useDeliverySummaryDetails(id: number) {
  return useQuery({
    queryKey: ['delivery-summaries', 'details', id],
    queryFn: () => getDeliverySummary(id),
    enabled: !!id,
    staleTime: 20 * 1000,
  });
}
