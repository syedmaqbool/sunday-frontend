import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listingService, type ListingStatus } from "@/services/listing.service";

export const useAdminListings = (status?: ListingStatus | "all") =>
  useQuery({
    queryKey: ["admin-listings", status],
    queryFn: async () => {
      const res = await listingService.listAdmin({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      });
      return res.data;
    },
  });

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
    }) => listingService.moderate(listingId, { status, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing-feedback"] });
    },
  });
};