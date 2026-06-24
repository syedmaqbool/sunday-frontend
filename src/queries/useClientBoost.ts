import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boostClientService } from "@/services/boost-client.service";

const PACKAGES_KEY = ["boost-packages"];
const MY_BOOSTS_KEY = ["my-boosts"];
const BOOSTABLE_LISTINGS_KEY = ["my-boostable-listings"];

// ── Queries ───────────────────────────────────────────────────────────────────

export const useBoostPackages = () =>
  useQuery({
    queryKey: PACKAGES_KEY,
    queryFn: () => boostClientService.getPackages(),
    staleTime: 5 * 60 * 1000, // packages rarely change
  });

export const useMyBoosts = (params: { page?: number; size?: number } = {}) =>
  useQuery({
    queryKey: [...MY_BOOSTS_KEY, params],
    queryFn: () => boostClientService.getMyBoosts({ ...params, size: params.size ?? 100 }),
  });

export const useBoostableListings = (params: { page?: number; size?: number } = {}) =>
  useQuery({
    queryKey: [...BOOSTABLE_LISTINGS_KEY, params],
    queryFn: () => boostClientService.getBoostableListings({ ...params, size: params.size ?? 100 }),
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useBoostWithPackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      packageId,
      paymentStatus,
    }: {
      listingId: string;
      packageId: string;
      paymentStatus?: "MOCK" | "PAID";
    }) =>
      boostClientService.boostWithPackage(listingId, { packageId, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BOOSTS_KEY });
    },
  });
};

export const useBoostWithCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      placement,
      startsAt,
      endsAt,
      paymentStatus,
    }: {
      listingId: string;
      placement: "SEARCH" | "FOR_YOU";
      startsAt: string;
      endsAt: string;
      paymentStatus?: "MOCK" | "PAID";
    }) =>
      boostClientService.boostWithCampaign(listingId, {
        placement,
        startsAt,
        endsAt,
        paymentStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BOOSTS_KEY });
    },
  });
};