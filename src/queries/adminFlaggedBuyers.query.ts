import type { AdminFlaggedBuyerRuleUpdate } from '@/types/adminFlaggedBuyer.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminFlaggedBuyerRules,
  updateAdminFlaggedBuyerRules,
} from '@/services/adminFlaggedBuyers.service';

export const adminFlaggedBuyersQueryKey = {
  all: () => ['admin-flagged-buyers'] as const,
  history: (buyerId: string) => [...adminFlaggedBuyersQueryKey.all(), 'history', buyerId] as const,
  list: (params?: Record<string, unknown>) => [...adminFlaggedBuyersQueryKey.all(), 'list', params] as const,
  rules: () => [...adminFlaggedBuyersQueryKey.all(), 'rules'] as const,
};

export function getAdminFlaggedBuyerRulesOptions() {
  return queryOptions({
    queryFn: () => getAdminFlaggedBuyerRules(),
    queryKey: adminFlaggedBuyersQueryKey.rules(),
  });
}

export function useUpdateAdminFlaggedBuyerRulesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: AdminFlaggedBuyerRuleUpdate) => updateAdminFlaggedBuyerRules(rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminFlaggedBuyersQueryKey.all() }),
  });
}
