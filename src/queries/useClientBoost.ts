import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  boostWithCampaign,
  boostWithPackage,
  listBoostableListings,
  listBoostPackages,
  listMyBoosts,
} from "@/services/boost-client.service";

export const clientBoostQueryKey = {
  packages: () => ["boost-packages"] as const,
  myBoosts: (params: BoostListParams = {}) => ["my-boosts", params] as const,
  boostableListings: (params: BoostListParams = {}) =>
    ["my-boostable-listings", params] as const,
};

export type BoostListParams = { page?: number; size?: number };

// ── Queries ───────────────────────────────────────────────────────────────────

export const getBoostPackagesOptions = () =>
  queryOptions({
    queryKey: clientBoostQueryKey.packages(),
    queryFn: () => listBoostPackages(),
    staleTime: 5 * 60 * 1000, // packages rarely change
  });

export const useBoostPackages = () => useQuery(getBoostPackagesOptions());

export const getMyBoostsOptions = (params: BoostListParams = {}) =>
  queryOptions({
    queryKey: clientBoostQueryKey.myBoosts(params),
    queryFn: () => listMyBoosts({ ...params, size: params.size ?? 100 }),
  });

export const useMyBoosts = (params: BoostListParams = {}) =>
  useQuery(getMyBoostsOptions(params));

export const getBoostableListingsOptions = (params: BoostListParams = {}) =>
  queryOptions({
    queryKey: clientBoostQueryKey.boostableListings(params),
    queryFn: () =>
      listBoostableListings({ ...params, size: params.size ?? 100 }),
  });

export const useBoostableListings = (params: BoostListParams = {}) =>
  useQuery(getBoostableListingsOptions(params));

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
    }) => boostWithPackage(listingId, { packageId, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-boosts"] });
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
      boostWithCampaign(listingId, {
        placement,
        startsAt,
        endsAt,
        paymentStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-boosts"] });
    },
  });
};
