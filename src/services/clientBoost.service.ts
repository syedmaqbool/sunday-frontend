import type {
  ActiveBoostParameters,
  ActiveListingBoost,
  BoostableListingItem,
  BoostableListingsParameters,
  BoostCampaignQuote,
  BoostCampaignQuoteParameters,
  BoostPackage,
  BoostPurchase,
  BoostPurchaseResponse,
  BoostWithCampaignPayload,
  BoostWithPackagePayload,
  ListingBoost,
  MyBoostParameters,
  MyBoostPurchasesParameters,
  ResubmitBoostPaymentProofPayload,
} from '@/types/boost.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import type { ApiSuccessResponse } from '@/types/api.type';
import type { ResubmitBoostPaymentProofResponses } from '@/types/generated-api';
import { authInstance } from '@/services/ky.instance';

export function listActiveBoosts(parameters: ActiveBoostParameters = {}): Promise<Response<ActiveListingBoost[]>> {
  return authInstance
    .get('/api/v1/boosts/active', { searchParams: parameters })
    .json<Response<ActiveListingBoost[]>>();
}

export function listBoostPackages(): Promise<Response<BoostPackage[]>> {
  return authInstance
    .get('/api/v1/boost-packages')
    .json<Response<BoostPackage[]>>();
}

export function listMyBoosts(parameters: MyBoostParameters = {}): Promise<PaginatedResponse<ListingBoost>> {
  return authInstance
    .get('/api/v1/me/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}

export function listMyBoostPurchases(
  parameters: MyBoostPurchasesParameters = {},
): Promise<PaginatedResponse<BoostPurchase>> {
  return authInstance
    .get('/api/v1/me/boost-purchases', { searchParams: parameters })
    .json<PaginatedResponse<BoostPurchase>>();
}

export function getListingBoostCampaignQuote(
  listingId: string,
  parameters: BoostCampaignQuoteParameters,
): Promise<Response<BoostCampaignQuote>> {
  return authInstance
    .get(`/api/v1/me/listings/${listingId}/boosts/campaign/quote`, { searchParams: parameters })
    .json<Response<BoostCampaignQuote>>();
}

export function resubmitBoostPaymentProof(
  listingId: string,
  purchaseId: string,
  body: ResubmitBoostPaymentProofPayload,
): Promise<ApiSuccessResponse<ResubmitBoostPaymentProofResponses>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/purchases/${purchaseId}/payment-submission`, { json: body })
    .json<ApiSuccessResponse<ResubmitBoostPaymentProofResponses>>();
}

export function listBoostableListings(
  parameters: BoostableListingsParameters = {},
): Promise<PaginatedResponse<BoostableListingItem>> {
  return authInstance
    .get('/api/v1/me/listings/boostable', { searchParams: parameters })
    .json<PaginatedResponse<BoostableListingItem>>();
}

export function boostWithPackage(
  listingId: string,
  body: BoostWithPackagePayload,
): Promise<BoostPurchaseResponse> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/package`, { json: body })
    .json<BoostPurchaseResponse>();
}

export function boostWithCampaign(
  listingId: string,
  body: BoostWithCampaignPayload,
): Promise<BoostPurchaseResponse> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/campaign`, { json: body })
    .json<BoostPurchaseResponse>();
}
