import type {
  AdminPayFastChargeReviewListParameters,
  ResolveAdminPayFastChargeReviewVariables,
} from '@/types/adminPayFastChargeReview.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminPayFastChargeReview,
  listAdminPayFastChargeReviews,
  resolveAdminPayFastChargeReview,
} from '@/services/adminPayFastChargeReview.service';

export const adminPayFastChargeReviewQueryKey = {
  all: () => ['admin-payfast-charge-reviews'] as const,
  detail: (chargeRecordId: string) =>
    [...adminPayFastChargeReviewQueryKey.all(), 'detail', chargeRecordId] as const,
  list: (parameters: AdminPayFastChargeReviewListParameters) =>
    [...adminPayFastChargeReviewQueryKey.all(), 'list', parameters] as const,
};

export function getAdminPayFastChargeReviewsOptions(
  parameters: AdminPayFastChargeReviewListParameters,
) {
  return queryOptions({
    queryFn: () => listAdminPayFastChargeReviews(parameters),
    queryKey: adminPayFastChargeReviewQueryKey.list(parameters),
  });
}

export function getAdminPayFastChargeReviewOptions(chargeRecordId: string) {
  return queryOptions({
    enabled: Boolean(chargeRecordId),
    queryFn: () => getAdminPayFastChargeReview(chargeRecordId),
    queryKey: adminPayFastChargeReviewQueryKey.detail(chargeRecordId),
  });
}

export function useResolveAdminPayFastChargeReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chargeRecordId, payload }: ResolveAdminPayFastChargeReviewVariables) =>
      resolveAdminPayFastChargeReview(chargeRecordId, payload),
    onSuccess: async (response, { chargeRecordId }) => {
      queryClient.setQueryData(adminPayFastChargeReviewQueryKey.detail(chargeRecordId), response);
      await queryClient.invalidateQueries({ queryKey: adminPayFastChargeReviewQueryKey.all() });
    },
  });
}
