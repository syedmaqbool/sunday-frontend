
import { apiClient } from "@/lib/apiClient";

export interface SellerCoupon {
  id: string;
  listingId: string | null;
  sellerId: string;
  active: boolean;
  code: string;
  currentUses: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  expiresAt: string | null;
  maxUses: number | null;
  minOrderAmount: number;
  perUserLimit: number | null;
  scope: "SELLER_WIDE" | "ITEM_BASED";
  startsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerCouponPayload {
  listingId?: string | null;
  sellerId: string;
  active?: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
  perUserLimit?: number | null;
  scope: string;
  startsAt?: string | null;
}

export interface UpdateSellerCouponPayload {
  listingId?: string | null;
  sellerId?: string;
  active?: boolean;
  code?: string;
  discountType?: string;
  discountValue?: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
  perUserLimit?: number | null;
  scope?: string;
  startsAt?: string | null;
}

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

interface ItemResponse<T> {
  data: T;
}

export const sellerCouponService = {
  list: () =>
    apiClient.get<ListResponse<SellerCoupon>>(
      "/api/v1/admin/seller-coupons"
    ),

  create: (payload: CreateSellerCouponPayload) =>
    apiClient.post<ItemResponse<SellerCoupon>>(
      "/api/v1/admin/seller-coupons",
      payload
    ),

  update: (id: string, payload: UpdateSellerCouponPayload) =>
    apiClient.patch<ItemResponse<SellerCoupon>>(
      `/api/v1/admin/seller-coupons/${id}`,
      payload
    ),

  delete: (id: string) =>
    apiClient.delete<void>(
      `/api/v1/admin/seller-coupons/${id}`
    ),
};
