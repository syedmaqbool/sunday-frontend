export type OfferStatus
  = | 'ACCEPTED'
    | 'COUNTERED'
    | 'EXPIRED'
    | 'PENDING'
    | 'REJECTED'
    | 'WITHDRAWN';

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
  currency: 'PKR';
  listingCategoryDistribution: CategoryDistribution[];
  monthlyAcceptedOfferValue: MonthlyValue[];
  offerStatusCounts: OfferStatusCount[];
  pendingOffers: number;
  rejectedOffers: number;
  reviewCount: number;
  totalAcceptedOfferValue: number;
  totalOffers: number;
}
