import { apiClient } from "@/lib/apiClient";

// ─── Types (from SellerAnalyticsSchema) ──────────────────────────────────────

export type OfferStatus =
  | "PENDING"
  | "COUNTERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export interface OfferStatusCount {
  count: number;
  status: OfferStatus;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface MonthlyValue {
  label: string;
  month: string;
  totalValue: number;
}

export interface SellerAnalytics {
  acceptedOffers: number;
  activeListings: number;
  averageRating: number;
  conversionRate: number;
  currency: "PKR";
  listingCategoryDistribution: CategoryDistribution[];
  monthlyAcceptedOfferValue: MonthlyValue[];
  offerStatusCounts: OfferStatusCount[];
  pendingOffers: number;
  rejectedOffers: number;
  reviewCount: number;
  totalAcceptedOfferValue: number;
  totalOffers: number;
}

interface ApiItemResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const sellerAnalyticsService = {
  // GET /api/v1/me/seller-analytics
  get: () =>
    apiClient.get<ApiItemResponse<SellerAnalytics>>("/api/v1/me/seller-analytics"),
};