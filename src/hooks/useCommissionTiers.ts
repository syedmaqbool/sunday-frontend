import type { CommissionTier } from '@/lib/commission';
import type { PaginatedResponse } from '@/types/response.type';
import { useQuery } from '@tanstack/react-query';
import { authInstance } from '@/services/ky.instance';

export function useCommissionTiers(options?: { onlyActive?: boolean }) {
  return useQuery<CommissionTier[]>({
    queryFn: async () => {
      const response = await authInstance
        .get('/api/v1/commission-tiers', {
          searchParams: { page: 1, size: 100 },
        })
        .json<PaginatedResponse<CommissionTier>>();
      return response.data;
    },
    queryKey: ['commission-tiers', options?.onlyActive ?? false],
    staleTime: 60_000,
  });
}
