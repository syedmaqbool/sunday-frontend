import type { ApiRequestBody, ApiRequestQuery, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  CancelMyListingReservationResponses,
  CreateAdminListingFeedbackData,
  CreateListingData,
  CreateListingResponses,
  GetAdminListingFeedbackData,
  GetAdminListingFeedbackResponses,
  GetAdminListingsData,
  GetMyListingByIdResponses,
  GetMyListingFeedbackData,
  GetMyListingFeedbackResponses,
  GetMyListingsData,
  GetMyListingsResponses,
  ModerateAdminListingResponses,
  UpdateMyListingData,
  UpdateMyListingResponses,
} from '@/types/generated-api';

export type CreateListingPayload = ApiRequestBody<CreateListingData>;
export type UpdateListingPayload = ApiRequestBody<UpdateMyListingData>;
export type AdminListingFeedbackPayload = ApiRequestBody<CreateAdminListingFeedbackData>;

export type MyListing = ApiResponseItem<GetMyListingsResponses>;
export type EditableListing = ApiResponseData<GetMyListingByIdResponses>;
export type CreatedListing = ApiResponseData<CreateListingResponses>;
export type UpdatedMyListing = ApiResponseData<UpdateMyListingResponses>;
export type ModeratedListing = ApiResponseData<ModerateAdminListingResponses>;
export type CancelledListingReservation = ApiResponseData<CancelMyListingReservationResponses>;

export type AdminListingParameters = Partial<ApiRequestQuery<GetAdminListingsData>>;
export type MyListingParameters = Partial<ApiRequestQuery<GetMyListingsData>>;
export type AdminListingFeedbackParameters = Partial<ApiRequestQuery<GetAdminListingFeedbackData>>;
export type MyListingFeedbackParameters = Partial<ApiRequestQuery<GetMyListingFeedbackData>>;

export type AdminListingFeedbackEntry = ApiResponseItem<GetAdminListingFeedbackResponses>;
export type MyListingFeedbackEntry = ApiResponseItem<GetMyListingFeedbackResponses>;
