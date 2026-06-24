import { useQuery } from "@tanstack/react-query";
import { sellerAnalyticsService } from "@/services/sellerAnalytic.service";

export const useSellerAnalytics = () =>
  useQuery({
    queryKey: ["seller-analytics"],
    queryFn: () => sellerAnalyticsService.get(),
    // data is ApiItemResponse<SellerAnalytics> — access data.data in component
  });