import type {
  BoostPlacement,
} from '@/types/boost.type';
import { queryOptions } from '@tanstack/react-query';
import {
  listActiveBoosts,
  listBoostPackages,
  listMyBoosts,
} from '@/services/clientBoost.service';

export type {
  BoostPackage,
  BoostPlacement,
  ListingBoost,
} from '@/types/boost.type';

export const boostsQueryKey = {
  active: (placement?: BoostPlacement) =>
    [...boostsQueryKey.all(), 'active', 'list', placement ?? 'all'] as const,
  all: () => ['boosts'] as const,
  my: (userId?: string) =>
    [...boostsQueryKey.all(), 'mine', 'list', userId ?? null] as const,
  packages: () => [...boostsQueryKey.all(), 'packages', 'list'] as const,
};

export function getActiveBoostsOptions(placement?: BoostPlacement) {
  return queryOptions({
    queryFn: async () => await listActiveBoosts({ placement }),
    queryKey: boostsQueryKey.active(placement),
    staleTime: 60_000,
  });
}

export function getBoostPackagesOptions() {
  return queryOptions({
    queryFn: async () => await listBoostPackages(),
    queryKey: boostsQueryKey.packages(),
  });
}

export function getMyBoostsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => await listMyBoosts({ page: 1, size: 100 }),
    queryKey: boostsQueryKey.my(userId),
  });
}
