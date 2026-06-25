export type BoostPlacement = 'FOR_YOU' | 'SEARCH' | 'TRENDING';
export type BoostPaymentStatus = 'CANCELLED' | 'MOCK' | 'PAID';

export interface BoostPackage {
  id: string;
  active: boolean;
  credits: number;
  description: string;
  durationDays: number;
  name: string;
  placement: BoostPlacement;
  price: number;
}

export type BoostPackageAPI = BoostPackage;

export interface ListingBoost {
  id: string;
  listingId: string;
  packageId: string | null;
  sellerId: string;
  endsAt: string;
  isActive?: boolean;
  packageName: string | null;
  paymentStatus: BoostPaymentStatus;
  placement: BoostPlacement;
  pricePaid: number;
  startsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoostableListingItem {
  id: string;
  [key: string]: unknown;
  images: string[];
  price: number;
  title: string;
}

export interface BoostWithPackagePayload {
  packageId: string;
  paymentStatus?: 'MOCK' | 'PAID';
}

export interface BoostWithCampaignPayload {
  endsAt: string;
  paymentStatus?: 'MOCK' | 'PAID';
  placement: 'FOR_YOU' | 'SEARCH';
  startsAt: string;
}
