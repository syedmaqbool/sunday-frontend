import {
  queryOptions,
  useMutation,
  useQuery,
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

export const useBoostPackages = () => useQuery(getBoostPackagesOptions());

export function getMyBoostsOptions(parameters: BoostListParams = {}) {
  return queryOptions({
    queryFn: () => listMyBoosts({ ...parameters, size: parameters.size ?? 100 }),
    queryKey: clientBoostQueryKey.myBoosts(parameters),
  });
}

export function useMyBoosts(parameters: BoostListParams = {}) {
  return useQuery(getMyBoostsOptions(parameters));
}

export function getBoostableListingsOptions(parameters: BoostListParams = {}) {
  return queryOptions({
    queryFn: () =>
      listBoostableListings({ ...parameters, size: parameters.size ?? 100 }),
    queryKey: clientBoostQueryKey.boostableListings(parameters),
  });
}

export function useBoostableListings(parameters: BoostListParams = {}) {
  return useQuery(getBoostableListingsOptions(parameters));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useBoostWithPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      packageId,
      paymentStatus,
    }: {
      listingId: string;
      packageId: string;
      paymentStatus?: 'MOCK' | 'PAID';
    }) => boostWithPackage(listingId, { packageId, paymentStatus }),
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
      endsAt,
      paymentStatus,
      placement,
      startsAt,
    }: {
      listingId: string;
      endsAt: string;
      paymentStatus?: 'MOCK' | 'PAID';
      placement: 'FOR_YOU' | 'SEARCH';
      startsAt: string;
    }) =>
      boostWithCampaign(listingId, {
        endsAt,
        paymentStatus,
        placement,
        startsAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-boosts'] });
    },
  });
}
