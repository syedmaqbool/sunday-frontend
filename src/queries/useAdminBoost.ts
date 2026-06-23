import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boostManagementService, type BoostPackage } from "@/services/adminBoost.service";

const PACKAGES_KEY = ["admin-boost-packages"];
const BOOSTS_KEY = ["admin-all-boosts"];

// ── Packages ──────────────────────────────────────────────────────────────────

export const useBoostPackages = () =>
  useQuery({
    queryKey: PACKAGES_KEY,
    queryFn: () => boostManagementService.getPackages(),
    // data is BoostPackage[] directly
  });

export const useUpdateBoostPackages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packages: BoostPackage[]) =>
      boostManagementService.updatePackages(packages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      queryClient.invalidateQueries({ queryKey: ["boost-packages"] }); // seller-facing cache
    },
  });
};

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const useAdminBoosts = (params: { page?: number; size?: number } = {}) =>
  useQuery({
    queryKey: [...BOOSTS_KEY, params],
    queryFn: () => boostManagementService.getBoosts(params),
    // data is ApiListResponse<ListingBoost> — access data.data in component
  });