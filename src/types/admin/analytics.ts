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

export interface AdminMarketingLeadsParams {
  page?: number;
  size?: number;
  search?: string;
  leadStatus?: string;
}
