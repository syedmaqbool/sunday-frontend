import { apiClient } from "@/lib/apiClient";

export type DimKey =
  | "location"
  | "category"
  | "priceRange"
  | "buyerAgeBucket"
  | "listingSize";

export interface BreakdownRow {
  key: string;
  orderCount: number;
  refundedComplaintCount: number;
  salesVolume: number;
}

export interface FunnelRow {
  key: string;
  engagedOfferPairs: number;
  acceptedOfferPairs: number;
  orderedPairs: number;
}

export interface AvgOffersRow {
  key: string;
  averageOffersBeforePurchase: number;
  orderedPairs: number;
}

export interface PriceVarianceRow {
  key: string;
  averageVarianceAmount: number;
  averageVariancePercentage: number;
}

type DimMap<T> = Record<DimKey, T[]>;

export interface AdminAnalytics {
  kpis: {
    approvedListings: number;
    averageOfferToOrderConversionRate: number;
    currency: string;
    flaggedMessages: number;
    itemsSold: number;
    orderCount: number;
    pendingListings: number;
    refundRate: number;
    totalListings: number;
    totalRevenue: number;
    totalUsers: number;
  };

  breakdowns: DimMap<BreakdownRow>;
  funnels: DimMap<FunnelRow>;
  averageOffersBeforePurchase: DimMap<AvgOffersRow>;
  priceVariance: DimMap<PriceVarianceRow>;
}

export interface AdminMarketingLead {
  userId: string;
  leadStatus: "CUSTOMER" | "ENGAGED" | "NEW";
  location: string;
  name: string;
  offerCount: number;
  orderCount: number;
  phone: string;
}

interface ItemResponse<T> {
  data: T;
}

interface ListResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
}

export const adminAnalyticsService = {
  get: () =>
    apiClient.get<ItemResponse<AdminAnalytics>>(
      "/api/v1/admin/analytics"
    ),

  marketingLeads: (
    params: {
      page?: number;
      size?: number;
      search?: string;
      leadStatus?: string;
    } = {}
  ) => {
    const qs = new URLSearchParams();

    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    if (params.search) qs.set("search", params.search);
    if (params.leadStatus) qs.set("leadStatus", params.leadStatus);

    const query = qs.toString();

    return apiClient.get<ListResponse<AdminMarketingLead>>(
      `/api/v1/admin/analytics/marketing-leads${
        query ? `?${query}` : ""
      }`
    );
  },
};