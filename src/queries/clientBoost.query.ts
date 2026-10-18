import type { ApiRequestQuery } from '@/types/api.type';
import type {
  BoostCampaignQuoteParameters,
  BoostWithCampaignPayload,
  BoostWithPackagePayload,
  MyBoostPurchasesParameters,
  ResubmitBoostPaymentProofPayload,
} from '@/types/boost.type';
import type { GetMyBoostableListingsData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { boostsQueryKey } from '@/queries/boosts.query';
import {
  boostWithCampaign,
  boostWithPackage,
  getListingBoostCampaignQuote,
  listBoostableListings,
  listBoostPackages,
  listMyBoosts,
  listMyBoostPurchases,
  resubmitBoostPaymentProof,
} from '@/services/clientBoost.service';

export const clientBoostQueryKey = {
  all: () => ['client-boost'] as const,
  boostableListings: (parameters: BoostListParams = {}) =>
    [...clientBoostQueryKey.all(), 'boostable-listings', 'list', parameters] as const,
  myBoosts: (parameters: BoostListParams = {}) =>
    [...clientBoostQueryKey.all(), 'my-boosts', 'list', parameters] as const,
  myBoostPurchases: (parameters: MyBoostPurchasesParameters = {}) =>
    [...clientBoostQueryKey.all(), 'my-boost-purchases', 'list', parameters] as const,
  campaignQuote: (listingId: string, parameters: BoostCampaignQuoteParameters) =>
    [...clientBoostQueryKey.all(), 'campaign-quote', listingId, parameters] as const,
  packages: () => [...clientBoostQueryKey.all(), 'packages', 'list'] as const,
};

export type BoostListParams = Partial<ApiRequestQuery<GetMyBoostableListingsData>>;

// ── Queries ───────────────────────────────────────────────────────────────────

export function getBoostPackagesOptions() {
  return queryOptions({
    queryFn: () => listBoostPackages(),
    queryKey: clientBoostQueryKey.packages(),
    staleTime: 5 * 60 * 1000, // packages rarely change
  });
}

export function getMyBoostsOptions(parameters: BoostListParams = {}) {
  return queryOptions({
    queryFn: () => listMyBoosts({ ...parameters, size: parameters.size ?? 100 }),
    queryKey: clientBoostQueryKey.myBoosts(parameters),
  });
}

export function getMyBoostPurchasesOptions(parameters: MyBoostPurchasesParameters = {}) {
  return queryOptions({
    queryFn: () => listMyBoostPurchases({ ...parameters, size: parameters.size ?? 100 }),
    queryKey: clientBoostQueryKey.myBoostPurchases(parameters),
  });
}

export function getListingBoostCampaignQuoteOptions(
  listingId: string,
  parameters: BoostCampaignQuoteParameters,
) {
  return queryOptions({
    queryFn: () => getListingBoostCampaignQuote(listingId, parameters),
    queryKey: clientBoostQueryKey.campaignQuote(listingId, parameters),
  });
}

export function getBoostableListingsOptions(parameters: BoostListParams = {}) {
  return queryOptions({
    queryFn: () =>
      listBoostableListings({ ...parameters, size: parameters.size ?? 100 }),
    queryKey: clientBoostQueryKey.boostableListings(parameters),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useBoostWithPackageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, ...payload }: { listingId: string } & BoostWithPackagePayload) =>
      boostWithPackage(listingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientBoostQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}

export function useBoostWithCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, ...payload }: { listingId: string } & BoostWithCampaignPayload) =>
      boostWithCampaign(listingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientBoostQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}

export function useResubmitBoostPaymentProofMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, purchaseId, ...payload }: {
      listingId: string;
      purchaseId: string;
    } & ResubmitBoostPaymentProofPayload) => resubmitBoostPaymentProof(listingId, purchaseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientBoostQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}
