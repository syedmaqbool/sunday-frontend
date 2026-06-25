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
  active?: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
}

export interface UpdateDiscountCodePayload {
  active?: boolean;
  code?: string;
  discountType?: string;
  discountValue?: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  minOrderAmount?: number;
}
