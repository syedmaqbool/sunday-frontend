import { apiClient } from "@/lib/apiClient";

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

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

interface ItemResponse<T> {
  data: T;
}

export const discountCodeService = {
  list: () =>
    apiClient.get<ListResponse<DiscountCode>>(
      "/api/v1/admin/settings/discount-codes"
    ),

  create: (payload: CreateDiscountCodePayload) =>
    apiClient.post<ItemResponse<DiscountCode>>(
      "/api/v1/admin/settings/discount-codes",
      payload
    ),

  update: (
    discountCodeId: string,
    payload: UpdateDiscountCodePayload
  ) =>
    apiClient.patch<ItemResponse<DiscountCode>>(
      `/api/v1/admin/settings/discount-codes/${discountCodeId}`,
      payload
    ),

  delete: (discountCodeId: string) =>
    apiClient.delete<void>(
      `/api/v1/admin/settings/discount-codes/${discountCodeId}`
    ),
};
