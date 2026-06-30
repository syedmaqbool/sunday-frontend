import type { BoostPackage } from '@/types/boost.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBoostPackages,
  listBoosts,
  updateBoostPackages,
} from '@/services/adminBoost.service';

export const adminBoostQueryKey = {
  boosts: (parameters: AdminBoostsParams = {}) =>
    ['admin-all-boosts', parameters] as const,
  packages: () => ['admin-boost-packages'] as const,
};

export interface AdminBoostsParams { page?: number; size?: number }

// ── Packages ──────────────────────────────────────────────────────────────────

export function getAdminBoostPackagesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getBoostPackages();
      return response.data.boostPackages ?? [];
    },
    queryKey: adminBoostQueryKey.packages(),
  });
}

export function useUpdateBoostPackagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packages: BoostPackage[]) => updateBoostPackages(packages),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminBoostQueryKey.packages(),
      });
      queryClient.invalidateQueries({ queryKey: ['boost-packages'] }); // seller-facing cache
    },
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function getAdminBoostsOptions(parameters: AdminBoostsParams = {}) {
  return queryOptions({
    queryFn: () => listBoosts(parameters),
    queryKey: adminBoostQueryKey.boosts(parameters),
  });
}
