import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSellerAnalytics } from "@/services/selleranalytic.service";

export const sellerAnalyticsQueryKey = {
  all: () => ["seller-analytics"] as const,
};

export const getSellerAnalyticsOptions = () =>
  queryOptions({
    queryKey: sellerAnalyticsQueryKey.all(),
    queryFn: () => getSellerAnalytics(),
  });

export const useSellerAnalytics = () => useQuery(getSellerAnalyticsOptions());
