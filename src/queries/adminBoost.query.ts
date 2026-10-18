import type { ApiRequestQuery } from '@/types/api.type';
import type { BoostPackage } from '@/types/boost.type';
import type { GetAdminBoostPaymentSubmissionsData, GetAdminBoostsData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { boostsQueryKey } from '@/queries/boosts.query';
import {
  getBoostPackages,
  approveAdminBoostPayment,
  completeAdminBoostRefund,
  getAdminBoostPaymentProofFile,
  listAdminBoostPaymentSubmissions,
  listBoosts,
  rejectAdminBoostPayment,
  requestAdminBoostPaymentResubmission,
  updateBoostPackages,
} from '@/services/adminBoost.service';

export const adminBoostQueryKey = {
  all: () => ['admin-boost'] as const,
  boosts: (parameters: AdminBoostsParams = {}) =>
    [...adminBoostQueryKey.all(), 'boosts', 'list', parameters] as const,
  paymentSubmissions: (parameters: GetAdminBoostPaymentSubmissionsData['query'] = { page: 1, size: 20 }) =>
    [...adminBoostQueryKey.all(), 'payment-submissions', 'list', parameters] as const,
  paymentProof: (fileId: string) =>
    [...adminBoostQueryKey.all(), 'payment-proof', 'detail', fileId] as const,
  packages: () => [...adminBoostQueryKey.all(), 'packages', 'list'] as const,
};

export type AdminBoostsParams = Partial<ApiRequestQuery<GetAdminBoostsData>>;

// ── Packages ──────────────────────────────────────────────────────────────────

export function getAdminBoostPackagesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getBoostPackages();
      return response.data.boostPackages ?? [];
    },
    queryKey: adminBoostQueryKey.packages(),
  });
}

export function useUpdateBoostPackagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packages: BoostPackage[]) => updateBoostPackages(packages),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminBoostQueryKey.packages(),
      });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function getAdminBoostsOptions(parameters: AdminBoostsParams = {}) {
  return queryOptions({
    queryFn: () => listBoosts(parameters),
    queryKey: adminBoostQueryKey.boosts(parameters),
  });
}

export function getAdminBoostPaymentSubmissionsOptions(
  parameters: GetAdminBoostPaymentSubmissionsData['query'] = { page: 1, size: 20 },
) {
  return queryOptions({
    queryFn: () => listAdminBoostPaymentSubmissions(parameters),
    queryKey: adminBoostQueryKey.paymentSubmissions(parameters),
  });
}

export function getAdminBoostPaymentProofOptions(fileId: string | undefined) {
  return queryOptions({
    enabled: Boolean(fileId),
    queryFn: () => getAdminBoostPaymentProofFile(fileId!),
    queryKey: adminBoostQueryKey.paymentProof(fileId ?? 'missing'),
    retry: false,
  });
}

function useAdminBoostPaymentMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminBoostQueryKey.all() }),
  });
}

export function useApproveAdminBoostPaymentMutation() {
  return useAdminBoostPaymentMutation(({ submissionId, payload }: {
    submissionId: string;
    payload?: Parameters<typeof approveAdminBoostPayment>[1];
  }) => approveAdminBoostPayment(submissionId, payload));
}

export function useRejectAdminBoostPaymentMutation() {
  return useAdminBoostPaymentMutation(({ submissionId, payload }: {
    submissionId: string;
    payload: Parameters<typeof rejectAdminBoostPayment>[1];
  }) => rejectAdminBoostPayment(submissionId, payload));
}

export function useRequestAdminBoostPaymentResubmissionMutation() {
  return useAdminBoostPaymentMutation(({ submissionId, payload }: {
    submissionId: string;
    payload: Parameters<typeof requestAdminBoostPaymentResubmission>[1];
  }) => requestAdminBoostPaymentResubmission(submissionId, payload));
}

export function useCompleteAdminBoostRefundMutation() {
  return useAdminBoostPaymentMutation((purchaseId: string) => completeAdminBoostRefund(purchaseId));
}
