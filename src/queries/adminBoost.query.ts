import type {
  ApproveAdminBoostPaymentVariables,
  RejectAdminBoostPaymentVariables,
  RequestAdminBoostPaymentResubmissionVariables,
} from '@/types/adminBoost.type';
import type { ApiRequestQuery } from '@/types/api.type';
import type { BoostPackage } from '@/types/boost.type';
import type {
  GetAdminBoostPaymentSubmissionsData,
  GetAdminBoostsData,
} from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { boostsQueryKey } from '@/queries/boosts.query';
import {
  approveAdminBoostPayment,
  completeAdminBoostRefund,
  getAdminBoostPaymentProofFile,
  getBoostPackages,
  listAdminBoostPaymentSubmissions,
  listBoosts,
  rejectAdminBoostPayment,
  requestAdminBoostPaymentResubmission,
  updateBoostPackages,
} from '@/services/adminBoost.service';

const DEFAULT_ADMIN_BOOST_PAYMENT_SUBMISSIONS_QUERY: GetAdminBoostPaymentSubmissionsData['query'] =
  {
    page: 1,
    size: 20,
  };

export const adminBoostQueryKey = {
  all: () => ['admin-boost'] as const,
  boosts: (parameters: AdminBoostsParams = {}) =>
    [...adminBoostQueryKey.all(), 'boosts', 'list', parameters] as const,
  packages: () => [...adminBoostQueryKey.all(), 'packages', 'list'] as const,
  paymentProof: (fileId: string) =>
    [...adminBoostQueryKey.all(), 'payment-proof', 'detail', fileId] as const,
  paymentSubmissions: (
    parameters: GetAdminBoostPaymentSubmissionsData['query'] = DEFAULT_ADMIN_BOOST_PAYMENT_SUBMISSIONS_QUERY,
  ) => [...adminBoostQueryKey.all(), 'payment-submissions', 'list', parameters] as const,
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
      void queryClient.invalidateQueries({
        queryKey: adminBoostQueryKey.packages(),
      });
      void queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
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
  parameters: GetAdminBoostPaymentSubmissionsData['query'] = DEFAULT_ADMIN_BOOST_PAYMENT_SUBMISSIONS_QUERY,
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
  mutationFunction: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminBoostQueryKey.all() }),
  });
}

export function useApproveAdminBoostPaymentMutation() {
  return useAdminBoostPaymentMutation(
    ({ submissionId, payload }: ApproveAdminBoostPaymentVariables) =>
      approveAdminBoostPayment(submissionId, payload),
  );
}

export function useRejectAdminBoostPaymentMutation() {
  return useAdminBoostPaymentMutation(
    ({ submissionId, payload }: RejectAdminBoostPaymentVariables) =>
      rejectAdminBoostPayment(submissionId, payload),
  );
}

export function useRequestAdminBoostPaymentResubmissionMutation() {
  return useAdminBoostPaymentMutation(
    ({ submissionId, payload }: RequestAdminBoostPaymentResubmissionVariables) =>
      requestAdminBoostPaymentResubmission(submissionId, payload),
  );
}

export function useCompleteAdminBoostRefundMutation() {
  return useAdminBoostPaymentMutation((purchaseId: string) => completeAdminBoostRefund(purchaseId));
}
