import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  boostWithCampaign,
  boostWithPackage,
  listBoostableListings,
  listBoostPackages,
  listMyBoosts,
} from '@/services/boost-client.service';

export const clientBoostQueryKey = {
  boostableListings: (parameters: BoostListParams = {}) =>
    ['my-boostable-listings', parameters] as const,
  myBoosts: (parameters: BoostListParams = {}) => ['my-boosts', parameters] as const,
  packages: () => ['boost-packages'] as const,
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

export function useBoostWithPackage() {
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
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
    },
  });
}

export function useBoostWithCampaign() {
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
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
    },
  });
}
