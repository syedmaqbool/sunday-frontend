import { apiClient } from "@/lib/apiClient";

export interface TaxSetting {
  id:        string;
  name:      string;
  rate:      number;
  active:    boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxSettingPayload {
  name:   string;
  rate:   number;
  active?: boolean;
}

export interface UpdateTaxSettingPayload {
  name?:   string;
  rate?:   number;
  active?: boolean;
}

interface ListResponse<T> { data: T[]; pagination: unknown; }
interface ItemResponse<T> { data: T; }

export const taxSettingService = {
  list: () =>
    apiClient.get<ListResponse<TaxSetting>>("/api/v1/admin/settings/tax-settings"),

  create: (payload: CreateTaxSettingPayload) =>
    apiClient.post<ItemResponse<TaxSetting>>("/api/v1/admin/settings/tax-settings", payload),

  update: (resourceId: string, payload: UpdateTaxSettingPayload) =>
    apiClient.patch<ItemResponse<TaxSetting>>(`/api/v1/admin/settings/tax-settings/${resourceId}`, payload),

  delete: (resourceId: string) =>
    apiClient.delete<void>(`/api/v1/admin/settings/tax-settings/${resourceId}`),
};

