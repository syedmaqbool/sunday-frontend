import type { AdminQuickBooksAccountMappingVersionPayload, AdminQuickBooksEnvironment, AdminQuickBooksReconciliationParameters, AdminQuickBooksReconnectPayload, AdminQuickBooksSellerOptionsParameters, AdminQuickBooksSellerVendorMappingParameters, AdminQuickBooksSellerVendorMappingPayload, AdminQuickBooksSyncEventsParameters } from '@/types/adminQuickBooks.type';
import type { GetAdminQuickBooksAccountMappingVersionsData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdminQuickBooksAccountMappingVersion,
  createAdminQuickBooksSellerVendorMapping,
  getAdminQuickBooksAccountMappingVersions,
  getAdminQuickBooksConnection,
  getAdminQuickBooksReconciliation,
  getAdminQuickBooksRolloutReadiness,
  getAdminQuickBooksSellers,
  getAdminQuickBooksSellerVendorMappings,
  getAdminQuickBooksSyncEvents,
  reconnectAdminQuickBooksConnection,
  startAdminQuickBooksConnection,
} from '@/services/adminQuickBooks.service';

export const adminQuickBooksQueryKey = {
  accountMappingVersions: (parameters: GetAdminQuickBooksAccountMappingVersionsData['query']) =>
    [...adminQuickBooksQueryKey.all(), 'account-mapping-versions', 'list', parameters] as const,
  all: () => ['admin-quickbooks'] as const,
  connection: (environment: AdminQuickBooksEnvironment) =>
    [...adminQuickBooksQueryKey.all(), 'connection', environment] as const,
  reconciliation: (parameters: AdminQuickBooksReconciliationParameters) =>
    [...adminQuickBooksQueryKey.all(), 'reconciliation', 'list', parameters] as const,
  rolloutReadiness: () => [...adminQuickBooksQueryKey.all(), 'rollout-readiness', 'detail'] as const,
  sellers: (parameters: AdminQuickBooksSellerOptionsParameters) =>
    [...adminQuickBooksQueryKey.all(), 'sellers', 'list', parameters] as const,
  sellerVendorMappings: (parameters: AdminQuickBooksSellerVendorMappingParameters) =>
    [...adminQuickBooksQueryKey.all(), 'seller-vendor-mappings', 'list', parameters] as const,
  syncEvents: (parameters: AdminQuickBooksSyncEventsParameters) =>
    [...adminQuickBooksQueryKey.all(), 'sync-events', 'list', parameters] as const,
};

export function getAdminQuickBooksConnectionQueryOptions(
  environment: AdminQuickBooksEnvironment,
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksConnection(environment),
    queryKey: adminQuickBooksQueryKey.connection(environment),
    retry: false,
  });
}

export function useStartAdminQuickBooksConnectionMutation() {
  return useMutation({
    mutationFn: (environment: AdminQuickBooksEnvironment) =>
      startAdminQuickBooksConnection(environment),
  });
}

export function useReconnectAdminQuickBooksConnectionMutation() {
  return useMutation({
    mutationFn: (payload: AdminQuickBooksReconnectPayload) =>
      reconnectAdminQuickBooksConnection(payload),
  });
}

export function getAdminQuickBooksAccountMappingVersionsQueryOptions(
  parameters: GetAdminQuickBooksAccountMappingVersionsData['query'],
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksAccountMappingVersions(parameters),
    queryKey: adminQuickBooksQueryKey.accountMappingVersions(parameters),
    retry: false,
  });
}

export function useCreateAdminQuickBooksAccountMappingVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminQuickBooksAccountMappingVersionPayload) =>
      createAdminQuickBooksAccountMappingVersion(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQuickBooksQueryKey.all() });
    },
  });
}

export function getAdminQuickBooksSellerVendorMappingsQueryOptions(
  parameters: AdminQuickBooksSellerVendorMappingParameters,
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksSellerVendorMappings(parameters),
    queryKey: adminQuickBooksQueryKey.sellerVendorMappings(parameters),
    retry: false,
  });
}

export function getAdminQuickBooksSellersQueryOptions(
  parameters: AdminQuickBooksSellerOptionsParameters,
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksSellers(parameters),
    queryKey: adminQuickBooksQueryKey.sellers(parameters),
    retry: false,
  });
}

export function useCreateAdminQuickBooksSellerVendorMappingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminQuickBooksSellerVendorMappingPayload) =>
      createAdminQuickBooksSellerVendorMapping(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQuickBooksQueryKey.all() });
    },
  });
}

export function getAdminQuickBooksReconciliationQueryOptions(
  parameters: AdminQuickBooksReconciliationParameters,
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksReconciliation(parameters),
    queryKey: adminQuickBooksQueryKey.reconciliation(parameters),
    retry: false,
  });
}

export function getAdminQuickBooksSyncEventsQueryOptions(
  parameters: AdminQuickBooksSyncEventsParameters,
) {
  return queryOptions({
    queryFn: () => getAdminQuickBooksSyncEvents(parameters),
    queryKey: adminQuickBooksQueryKey.syncEvents(parameters),
    retry: false,
  });
}

export function getAdminQuickBooksRolloutReadinessQueryOptions() {
  return queryOptions({
    queryFn: () => getAdminQuickBooksRolloutReadiness(),
    queryKey: adminQuickBooksQueryKey.rolloutReadiness(),
    retry: false,
  });
}
