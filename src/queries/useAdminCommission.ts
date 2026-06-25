import type { CommissionTierPayload } from '@/types/commission';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createCommissionTier,
  deleteCommissionTier,
  listCommissionTiers,
  updateCommissionTier,
} from '@/services/commission.service';

export const commissionQueryKey = {
  all: () => ['commission-tiers'] as const,
  list: () => [...commissionQueryKey.all(), 'list'] as const,
};

export function getCommissionTiersOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listCommissionTiers();
      return response.data;
    },
    queryKey: commissionQueryKey.list(),
  });
}

export const useCommissionTiers = () => useQuery(getCommissionTiersOptions());

export function useCreateCommissionTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommissionTierPayload) =>
      createCommissionTier(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionQueryKey.all() }),
  });
}

export function useUpdateCommissionTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commissionTierId,
      payload,
    }: {
      commissionTierId: string;
      payload: Partial<CommissionTierPayload>;
    }) => updateCommissionTier(commissionTierId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionQueryKey.all() }),
  });
}

export function useDeleteCommissionTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commissionTierId: string) =>
      deleteCommissionTier(commissionTierId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionQueryKey.all() }),
  });
}
