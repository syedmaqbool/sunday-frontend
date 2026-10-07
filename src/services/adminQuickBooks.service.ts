import type {
  AdminQuickBooksAccountMappingVersionPayload,
  AdminQuickBooksEnvironment,
  AdminQuickBooksPaginatedResponse,
  AdminQuickBooksReconciliationParameters,
  AdminQuickBooksReconnectPayload,
  AdminQuickBooksSellerOption,
  AdminQuickBooksSellerOptionsParameters,
  AdminQuickBooksSellerVendorMapping,
  AdminQuickBooksSellerVendorMappingParameters,
  AdminQuickBooksSellerVendorMappingPayload,
  AdminQuickBooksSyncEventsParameters,
} from '@/types/adminQuickBooks.type';
import type { ApiSuccessResponse, Response } from '@/types/api.type';
import type {
  CreateAdminQuickBooksAccountMappingVersionResponses,
  GetAdminQuickBooksAccountMappingVersionsData,
  GetAdminQuickBooksAccountMappingVersionsResponses,
  GetAdminQuickBooksConnectionResponses,
  GetAdminQuickBooksReconciliationResponses,
  GetAdminQuickBooksRolloutReadinessResponses,
  GetAdminQuickBooksSyncEventsResponses,
  ReconnectAdminQuickBooksConnectionResponses,
  StartAdminQuickBooksConnectionResponses,
} from '@/types/generated-api';
import { authInstance } from '@/services/ky.instance';

export function getAdminQuickBooksConnection(environment: AdminQuickBooksEnvironment) {
  return authInstance
    .get('/api/v1/admin/quickbooks-connection', {
      searchParams: { environment },
    })
    .json<ApiSuccessResponse<GetAdminQuickBooksConnectionResponses>>();
}

export function startAdminQuickBooksConnection(environment: AdminQuickBooksEnvironment) {
  return authInstance
    .post('/api/v1/admin/quickbooks-connection/connect', {
      json: { environment },
    })
    .json<ApiSuccessResponse<StartAdminQuickBooksConnectionResponses>>();
}

export function reconnectAdminQuickBooksConnection(payload: AdminQuickBooksReconnectPayload) {
  return authInstance
    .post('/api/v1/admin/quickbooks-connection/reconnect', { json: payload })
    .json<ApiSuccessResponse<ReconnectAdminQuickBooksConnectionResponses>>();
}

export function getAdminQuickBooksAccountMappingVersions(parameters: GetAdminQuickBooksAccountMappingVersionsData['query']) {
  return authInstance
    .get('/api/v1/admin/quickbooks-account-mappings', { searchParams: parameters })
    .json<ApiSuccessResponse<GetAdminQuickBooksAccountMappingVersionsResponses>>();
}

export function createAdminQuickBooksAccountMappingVersion(payload: AdminQuickBooksAccountMappingVersionPayload) {
  return authInstance
    .post('/api/v1/admin/quickbooks-account-mappings', { json: payload })
    .json<ApiSuccessResponse<CreateAdminQuickBooksAccountMappingVersionResponses>>();
}

export function getAdminQuickBooksSellerVendorMappings(parameters: AdminQuickBooksSellerVendorMappingParameters) {
  return authInstance
    .get('/api/v1/admin/quickbooks-seller-vendor-mappings', { searchParams: parameters })
    .json<AdminQuickBooksPaginatedResponse<AdminQuickBooksSellerVendorMapping>>();
}

export function createAdminQuickBooksSellerVendorMapping(payload: AdminQuickBooksSellerVendorMappingPayload) {
  return authInstance
    .post('/api/v1/admin/quickbooks-seller-vendor-mappings', { json: payload })
    .json<Response<AdminQuickBooksSellerVendorMapping>>();
}

export function getAdminQuickBooksSellers(parameters: AdminQuickBooksSellerOptionsParameters) {
  return authInstance
    .get('/api/v1/admin/quickbooks-sellers', { searchParams: { ...parameters } })
    .json<AdminQuickBooksPaginatedResponse<AdminQuickBooksSellerOption>>();
}

export function getAdminQuickBooksReconciliation(parameters: AdminQuickBooksReconciliationParameters) {
  return authInstance
    .get('/api/v1/admin/quickbooks-reconciliation', { searchParams: parameters })
    .json<ApiSuccessResponse<GetAdminQuickBooksReconciliationResponses>>();
}

export function getAdminQuickBooksSyncEvents(parameters: AdminQuickBooksSyncEventsParameters) {
  return authInstance
    .get('/api/v1/admin/quickbooks-sync', { searchParams: parameters })
    .json<ApiSuccessResponse<GetAdminQuickBooksSyncEventsResponses>>();
}

export function getAdminQuickBooksRolloutReadiness() {
  return authInstance
    .get('/api/v1/admin/quickbooks-rollout')
    .json<ApiSuccessResponse<GetAdminQuickBooksRolloutReadinessResponses>>();
}
