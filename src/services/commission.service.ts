import { apiClient } from "@/lib/apiClient";

export interface CommissionTier {
  id: string;
  name: string;
  categories: string[];
  minPrice: number;
  maxPrice: number | null;
  rate: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CommissionTierPayload {
  name: string;
  categories: string[];
  minPrice?: number;
  maxPrice?: number | null;
  rate: number;
  active?: boolean;
  sortOrder?: number;
}

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

interface ItemResponse<T> {
  data: T;
}

export const commissionService = {
  list: () => 
    apiClient.get<ListResponse<CommissionTier>>("/api/v1/admin/settings/commission-tiers"),

  create: (payload: CommissionTierPayload) => 
    apiClient.post<ItemResponse<CommissionTier>>("/api/v1/admin/settings/commission-tiers", payload),

  update: (commissionTierId: string, payload: Partial<CommissionTierPayload>) => 
    apiClient.patch<ItemResponse<CommissionTier>>(
      `/api/v1/admin/settings/commission-tiers/${commissionTierId}`, 
      payload
    ),

  delete: (commissionTierId: string) => 
    apiClient.delete<void>(`/api/v1/admin/settings/commission-tiers/${commissionTierId}`),
};


