import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { listAdminListings, moderateListing } from "@/services/listing.service";
import type { ListingStatus } from "@/types/admin/listing";

export const adminListingsQueryKey = {
  all: () => ["admin-listings"] as const,
  list: (status?: ListingStatus | "all") =>
    [...adminListingsQueryKey.all(), "list", status] as const,
};

export const getAdminListingsOptions = (status?: ListingStatus | "all") =>
  queryOptions({
    queryKey: adminListingsQueryKey.list(status),
    queryFn: async () => {
      const res = await listAdminListings({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      });
      return res.data;
    },
  });

export const useAdminListings = (status?: ListingStatus | "all") =>
  useQuery(getAdminListingsOptions(status));

export const useModerateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      status,
      feedback,
    }: {
      listingId: string;
      status: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
      feedback?: string;
    }) => moderateListing(listingId, { status, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: ["listing-feedback"] });
    },
  });
};
