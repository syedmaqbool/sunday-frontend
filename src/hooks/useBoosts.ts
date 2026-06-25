import type { BoostPlacement } from '@/queries/useBoosts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getActiveBoostsOptions,
  getBoostPackagesOptions,
  getMyBoostsOptions,
} from '@/queries/useBoosts';

export type {
  BoostPackage,
  BoostPlacement,
  ListingBoost,
} from '@/queries/useBoosts';

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** All active boosts across the marketplace, used to rank listings. */
export function useActiveBoosts(placement?: BoostPlacement) {
  return useQuery(getActiveBoostsOptions(placement));
}

/** Map of listingId -> boost score for a given placement. */
export function useBoostScoreMap(placement: BoostPlacement) {
  const { data: boosts = [] } = useActiveBoosts(placement);
  const map = new Map<string, number>();
  for (const b of boosts)
    map.set(b.listingId, (map.get(b.listingId) ?? 0) + 1);
  return map;
}

/** Sort: boosted listings first, preserve existing order otherwise. */
export function applyBoostRanking<T extends { id: string }>(listings: T[], boostMap: Map<string, number>): T[] {
  return listings.toSorted(
    (a, b) => (boostMap.get(b.id) ?? 0) - (boostMap.get(a.id) ?? 0),
  );
}

export function useBoostPackages() {
  return useQuery(getBoostPackagesOptions());
}

export function useMyBoosts() {
  const { user } = useAuth();
  return useQuery(getMyBoostsOptions(user?.id));
}
