import type {
  BoostPackage,
  BoostPlacement,
  ListingBoost,
} from '@/types/boost';
import { queryOptions } from '@tanstack/react-query';
import {
  listActiveBoosts,
  listBoostPackages,
  listMyBoosts,
} from '@/services/boost-client.service';

export type {
  BoostPackage,
  BoostPlacement,
  ListingBoost,
} from '@/types/boost';

export const boostsQueryKey = {
  active: (placement?: BoostPlacement) => ['active-boosts', placement ?? 'all'] as const,
  my: (userId?: string) => ['my-boosts', userId] as const,
  packages: () => ['boost-packages'] as const,
};

export function getActiveBoostsOptions(placement?: BoostPlacement) {
  return queryOptions({
    queryFn: async (): Promise<ListingBoost[]> => {
      const response = await listActiveBoosts({ placement });
      return response.data;
    },
    queryKey: boostsQueryKey.active(placement),
    staleTime: 60_000,
  });
}

export function getBoostPackagesOptions() {
  return queryOptions({
    queryFn: async (): Promise<BoostPackage[]> => {
      const response = await listBoostPackages();
      return response.data;
    },
    queryKey: boostsQueryKey.packages(),
  });
}

export function getMyBoostsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<ListingBoost[]> => {
      const response = await listMyBoosts({ page: 1, size: 100 });
      return response.data;
    },
    queryKey: boostsQueryKey.my(userId),
  });
}
