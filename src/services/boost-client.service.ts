import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // other listing fields from ListingSchema
  [key: string]: any;
}

interface ApiItemResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface ApiListResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    prevPage: number | null;
    perPage: number;
    total: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const boostClientService = {
  // GET /api/v1/boost-packages  — public, no auth needed
  getPackages: () =>
    apiClient.get<ApiItemResponse<BoostPackage[]>>("/api/v1/boost-packages"),

  // GET /api/v1/me/boosts
  getMyBoosts: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ApiListResponse<ListingBoost>>(
      `/api/v1/me/boosts${query ? `?${query}` : ""}`,
    );
  },

  // GET /api/v1/me/listings/boostable
  getBoostableListings: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ApiListResponse<BoostableListingItem>>(
      `/api/v1/me/listings/boostable${query ? `?${query}` : ""}`,
    );
  },

  // POST /api/v1/me/listings/:listingId/boosts/package
  boostWithPackage: (
    listingId: string,
    body: { packageId: string; paymentStatus?: "MOCK" | "PAID" },
  ) =>
    apiClient.post<ApiItemResponse<ListingBoost>>(
      `/api/v1/me/listings/${listingId}/boosts/package`,
      body,
    ),

  // POST /api/v1/me/listings/:listingId/boosts/campaign
  boostWithCampaign: (
    listingId: string,
    body: {
      placement: "SEARCH" | "FOR_YOU";
      startsAt: string;
      endsAt: string;
      paymentStatus?: "MOCK" | "PAID";
    },
  ) =>
    apiClient.post<ApiItemResponse<ListingBoost>>(
      `/api/v1/me/listings/${listingId}/boosts/campaign`,
      body,
    ),
};