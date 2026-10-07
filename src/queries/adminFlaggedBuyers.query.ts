import type { AdminFlaggedBuyerComplaintHistoryParameters, AdminFlaggedBuyerRuleUpdate, AdminFlaggedBuyersParameters, AdminFlaggedBuyerWarningSubmission } from '@/types/adminFlaggedBuyer.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminFlaggedBuyerComplaintHistory,
  getAdminFlaggedBuyerRules,
  getAdminFlaggedBuyers,
  updateAdminFlaggedBuyerRules,
  warnAdminFlaggedBuyer,
} from '@/services/adminFlaggedBuyers.service';

export const adminFlaggedBuyersQueryKey = {
  all: () => ['admin-flagged-buyers'] as const,
  history: (buyerId: string, parameters: AdminFlaggedBuyerComplaintHistoryParameters) => [...adminFlaggedBuyersQueryKey.all(), 'history', buyerId, parameters] as const,
  list: (parameters: AdminFlaggedBuyersParameters) => [...adminFlaggedBuyersQueryKey.all(), 'list', parameters] as const,
  rules: () => [...adminFlaggedBuyersQueryKey.all(), 'rules'] as const,
};

export function getAdminFlaggedBuyerComplaintHistoryOptions(buyerId: string, parameters: AdminFlaggedBuyerComplaintHistoryParameters) {
  return queryOptions({
    queryFn: () => getAdminFlaggedBuyerComplaintHistory(buyerId, parameters),
    queryKey: adminFlaggedBuyersQueryKey.history(buyerId, parameters),
  });
}

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

export function useWarnAdminFlaggedBuyerMutation() {
  return useMutation({
    mutationFn: ({ buyerId, body }: AdminFlaggedBuyerWarningSubmission) => warnAdminFlaggedBuyer(buyerId, body),
  });
}
