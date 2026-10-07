import type { AdminFlaggedBuyerRuleUpdate, AdminFlaggedBuyersParameters } from '@/types/adminFlaggedBuyer.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminFlaggedBuyerRules,
  getAdminFlaggedBuyers,
  updateAdminFlaggedBuyerRules,
} from '@/services/adminFlaggedBuyers.service';

export const adminFlaggedBuyersQueryKey = {
  all: () => ['admin-flagged-buyers'] as const,
  history: (buyerId: string) => [...adminFlaggedBuyersQueryKey.all(), 'history', buyerId] as const,
  list: (parameters: AdminFlaggedBuyersParameters) => [...adminFlaggedBuyersQueryKey.all(), 'list', parameters] as const,
  rules: () => [...adminFlaggedBuyersQueryKey.all(), 'rules'] as const,
};

export function getAdminFlaggedBuyersOptions(parameters: AdminFlaggedBuyersParameters) {
  return queryOptions({
    queryFn: () => getAdminFlaggedBuyers(parameters),
    queryKey: adminFlaggedBuyersQueryKey.list(parameters),
  });
}

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
