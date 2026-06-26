export interface DiscountCode {
  id: string;
  active: boolean;
  code: string;
  currentUses: number;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  minOrderAmount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateDiscountCodePayload {
  active?: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses?: number | null;
  minOrderAmount?: number;
  expiresAt?: string | null;
}

export interface UpdateDiscountCodePayload {
  active?: boolean;
  code?: string;
  discountType?: string;
  discountValue?: number;
  maxUses?: number | null;
  minOrderAmount?: number;
  expiresAt?: string | null;
}
