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

interface AdminSettings {
  boostPackages: BoostPackage[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const boostManagementService = {
  // ── Packages (KV store via admin settings) ─────────────────────────────────

  // GET /api/v1/admin/settings  →  pick boostPackages
  getPackages: async (): Promise<BoostPackage[]> => {
    const res = await apiClient.get<ApiItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
    );
    return res.data?.boostPackages ?? [];
  },

  // PATCH /api/v1/admin/settings  { boostPackages: BoostPackage[] }
  updatePackages: (packages: BoostPackage[]) =>
    apiClient.patch<ApiItemResponse<AdminSettings>>(
      "/api/v1/admin/settings",
      { boostPackages: packages },
    ),

  // ── Campaigns (listingBoost DB table) ─────────────────────────────────────

  // GET /api/v1/admin/boosts  (if endpoint exists)
  getBoosts: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ApiListResponse<ListingBoost>>(
      `/api/v1/admin/boosts${query ? `?${query}` : ""}`,
    );
  },
};