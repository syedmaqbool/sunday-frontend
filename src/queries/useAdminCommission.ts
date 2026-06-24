import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCommissionTier,
  deleteCommissionTier,
  listCommissionTiers,
  updateCommissionTier,
} from "@/services/commission.service";
import type { CommissionTierPayload } from "@/types/commission";

export const commissionQueryKey = {
  all: () => ["commission-tiers"] as const,
  list: () => [...commissionQueryKey.all(), "list"] as const,
};

export const getCommissionTiersOptions = () =>
  queryOptions({
    queryKey: commissionQueryKey.list(),
    queryFn: async () => {
      const res = await listCommissionTiers();
      return res.data;
    },
  });

export const useCommissionTiers = () => useQuery(getCommissionTiersOptions());

export const useCreateCommissionTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommissionTierPayload) =>
      createCommissionTier(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionQueryKey.all() }),
  });
};

export const useUpdateCommissionTier = () => {
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
};

export const useDeleteCommissionTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commissionTierId: string) =>
      deleteCommissionTier(commissionTierId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionQueryKey.all() }),
  });
};
