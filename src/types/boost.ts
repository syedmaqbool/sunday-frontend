export type BoostPlacement = "SEARCH" | "FOR_YOU" | "TRENDING";
export type BoostPaymentStatus = "MOCK" | "PAID" | "CANCELLED";

export interface BoostPackage {
  id: string;
  name: string;
  description: string;
  active: boolean;
  credits: number;
  durationDays: number;
  placement: BoostPlacement;
  price: number;
}

export type BoostPackageAPI = BoostPackage;

export interface ListingBoost {
  id: string;
  listingId: string;
  packageId: string | null;
  packageName: string | null;
  pricePaid: number;
  sellerId: string;
  endsAt: string;
  startsAt: string;
  isActive?: boolean;
  paymentStatus: BoostPaymentStatus;
  placement: BoostPlacement;
  createdAt: string;
  updatedAt: string;
}

export interface BoostableListingItem {
  id: string;
  title: string;
  images: string[];
  price: number;
  [key: string]: unknown;
}

export interface BoostWithPackagePayload {
  packageId: string;
  paymentStatus?: "MOCK" | "PAID";
}

export interface BoostWithCampaignPayload {
  placement: "SEARCH" | "FOR_YOU";
  startsAt: string;
  endsAt: string;
  paymentStatus?: "MOCK" | "PAID";
}
