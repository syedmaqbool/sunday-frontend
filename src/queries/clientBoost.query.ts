import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { boostsQueryKey } from '@/queries/boosts.query';
import {
  boostWithCampaign,
  boostWithPackage,
  listBoostableListings,
  listBoostPackages,
  listMyBoosts,
} from '@/services/clientBoost.service';

export const clientBoostQueryKey = {
  all: () => ['client-boost'] as const,
  boostableListings: (parameters: BoostListParams = {}) =>
    [...clientBoostQueryKey.all(), 'boostable-listings', 'list', parameters] as const,
  myBoosts: (parameters: BoostListParams = {}) =>
    [...clientBoostQueryKey.all(), 'my-boosts', 'list', parameters] as const,
  packages: () => [...clientBoostQueryKey.all(), 'packages', 'list'] as const,
};

export interface BoostListParams { page?: number; size?: number }

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
    mutationFn: ({
      listingId,
      packageIds,
      paymentStatus,
    }: {
      listingId: string;
      packageIds: string[];
      paymentStatus?: 'MOCK' | 'PAID';
    }) => boostWithPackage(listingId, { packageIds, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientBoostQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}

export function useBoostWithCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      paymentStatus,
      placement,
      endsAt,
      startsAt,
    }: {
      listingId: string;
      paymentStatus?: 'MOCK' | 'PAID';
      placement: 'FOR_YOU' | 'SEARCH';
      endsAt: string;
      startsAt: string;
    }) =>
      boostWithCampaign(listingId, {
        paymentStatus,
        placement,
        endsAt,
        startsAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientBoostQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: boostsQueryKey.all() });
    },
  });
}
