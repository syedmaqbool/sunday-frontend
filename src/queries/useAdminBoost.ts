import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getBoostPackages,
  listBoosts,
  updateBoostPackages,
} from "@/services/adminBoost.service";
import type { BoostPackage } from "@/types/boost";

export const adminBoostQueryKey = {
  packages: () => ["admin-boost-packages"] as const,
  boosts: (params: AdminBoostsParams = {}) =>
    ["admin-all-boosts", params] as const,
};

export type AdminBoostsParams = { page?: number; size?: number };

// ── Packages ──────────────────────────────────────────────────────────────────

export const getAdminBoostPackagesOptions = () =>
  queryOptions({
    queryKey: adminBoostQueryKey.packages(),
    queryFn: () => getBoostPackages(),
  });

export const useBoostPackages = () => useQuery(getAdminBoostPackagesOptions());

export const useUpdateBoostPackages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packages: BoostPackage[]) => updateBoostPackages(packages),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminBoostQueryKey.packages(),
      });
      queryClient.invalidateQueries({ queryKey: ["boost-packages"] }); // seller-facing cache
    },
  });
};

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const getAdminBoostsOptions = (params: AdminBoostsParams = {}) =>
  queryOptions({
    queryKey: adminBoostQueryKey.boosts(params),
    queryFn: () => listBoosts(params),
  });

export const useAdminBoosts = (params: AdminBoostsParams = {}) =>
  useQuery(getAdminBoostsOptions(params));
