export type DimKey
  = | 'buyerAgeBucket'
    | 'category'
    | 'listingSize'
    | 'location'
    | 'priceRange';

export interface BreakdownRow {
  key: string;
  orderCount: number;
  refundedComplaintCount: number;
  salesVolume: number;
}

export interface FunnelRow {
  key: string;
  acceptedOfferPairs: number;
  engagedOfferPairs: number;
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
  averageOffersBeforePurchase: DimMap<AvgOffersRow>;
  breakdowns: DimMap<BreakdownRow>;
  funnels: DimMap<FunnelRow>;
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
  priceVariance: DimMap<PriceVarianceRow>;
}

export interface AdminMarketingLead {
  userId: string;
  leadStatus: 'CUSTOMER' | 'ENGAGED' | 'NEW';
  location: string;
  name: string;
  offerCount: number;
  orderCount: number;
  phone: string;
}

export interface AdminMarketingLeadsParams {
  leadStatus?: string;
  page?: number;
  search?: string;
  size?: number;
}
