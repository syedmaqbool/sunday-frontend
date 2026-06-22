import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commissionService, type CommissionTierPayload } from "@/services/commission.service";

const COMMISSION_KEY = ["commission-tiers"];

export const useCommissionTiers = () =>
  useQuery({
    queryKey: COMMISSION_KEY,
    queryFn: async () => {
      const res = await commissionService.list();
      return res.data;
    },
  });

export const useCreateCommissionTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommissionTierPayload) => commissionService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMISSION_KEY }),
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
    }) => commissionService.update(commissionTierId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMISSION_KEY }),
  });
};

export const useDeleteCommissionTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commissionTierId: string) => commissionService.delete(commissionTierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMISSION_KEY }),
  });
};