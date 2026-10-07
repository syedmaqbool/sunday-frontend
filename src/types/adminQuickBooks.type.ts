import type { ApiRequestBody, ApiRequestQuery, ApiResponseData, ApiResponseItem, PaginatedResponse } from '@/types/api.type';
import type {
  CreateAdminQuickBooksAccountMappingVersionData,
  CreateAdminQuickBooksSellerVendorMappingData,
  GetAdminQuickBooksAccountMappingVersionsResponses,
  GetAdminQuickBooksReconciliationData,
  GetAdminQuickBooksReconciliationResponses,
  GetAdminQuickBooksRolloutReadinessResponses,
  GetAdminQuickBooksSellerVendorMappingsData,
  GetAdminQuickBooksSellerVendorMappingsResponses,
  GetAdminQuickBooksSyncEventsData,
  GetAdminQuickBooksSyncEventsResponses,
  ReconnectAdminQuickBooksConnectionData,
  StartAdminQuickBooksConnectionData,
} from '@/types/generated-api';

export type AdminQuickBooksEnvironment
  = ApiRequestBody<StartAdminQuickBooksConnectionData>['environment'];
export type AdminQuickBooksReconnectPayload
  = ApiRequestBody<ReconnectAdminQuickBooksConnectionData>;

export type AdminQuickBooksAccountMappingVersionPayload
  = ApiRequestBody<CreateAdminQuickBooksAccountMappingVersionData>;
export type AdminQuickBooksAccountMappingCategory
  = AdminQuickBooksAccountMappingVersionPayload['mappings'][number]['category'];
export type AdminQuickBooksAccountMappingVersion
  = ApiResponseItem<GetAdminQuickBooksAccountMappingVersionsResponses>;

export type AdminQuickBooksSellerVendorMappingPayload
  = ApiRequestBody<CreateAdminQuickBooksSellerVendorMappingData>;
export type AdminQuickBooksSellerVendorMapping
  = ApiResponseItem<GetAdminQuickBooksSellerVendorMappingsResponses> & {
    sellerEmail: string;
    sellerName: string;
  };
export type AdminQuickBooksSellerVendorMappingParameters
  = ApiRequestQuery<GetAdminQuickBooksSellerVendorMappingsData> & { sellerId?: string };

export interface AdminQuickBooksSellerOption {
  id: string;
  email: string;
  name: string;
}

export interface AdminQuickBooksSellerOptionsParameters {
  page: number;
  search?: string;
  size: number;
}

export type AdminQuickBooksPaginatedResponse<T> = PaginatedResponse<T>;

export type AdminQuickBooksReconciliationParameters
  = ApiRequestQuery<GetAdminQuickBooksReconciliationData>;
export type AdminQuickBooksReconciliationRecord
  = ApiResponseItem<GetAdminQuickBooksReconciliationResponses>;

export type AdminQuickBooksSyncEventsParameters
  = ApiRequestQuery<GetAdminQuickBooksSyncEventsData>;
export type AdminQuickBooksSyncEvent
  = ApiResponseItem<GetAdminQuickBooksSyncEventsResponses>;

export type AdminQuickBooksRolloutReadiness
  = ApiResponseData<GetAdminQuickBooksRolloutReadinessResponses>;
