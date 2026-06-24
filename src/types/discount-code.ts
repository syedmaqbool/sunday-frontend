export interface DiscountCode {
  id: string;
  active: boolean;
  code: string;
  currentUses: number;
  discountType: string;
  discountValue: number;
  expiresAt: string | null;
  maxUses: number | null;
  minOrderAmount: number;
  createdAt: string;
}

export interface CreateDiscountCodePayload {
  code: string;
  active?: boolean;
  discountType: string;
  discountValue: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
}

export interface UpdateDiscountCodePayload {
  code?: string;
  active?: boolean;
  discountType?: string;
  discountValue?: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
}
