import type { BoostPackage } from '@/types/boost';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

export const useBoostPackages = () => useQuery(getAdminBoostPackagesOptions());

export function useUpdateBoostPackages() {
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

export function useAdminBoosts(parameters: AdminBoostsParams = {}) {
  return useQuery(getAdminBoostsOptions(parameters));
}
