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
