import { authInstance } from "@/services/ky.instance";
import type {
  CreateTaxSettingPayload,
  TaxSetting,
  UpdateTaxSettingPayload,
} from "@/types/tax-setting";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listTaxSettings() {
  return authInstance
    .get("/api/v1/admin/settings/tax-settings")
    .json<PaginatedResponse<TaxSetting>>();
}

export function createTaxSetting(payload: CreateTaxSettingPayload) {
  return authInstance
    .post("/api/v1/admin/settings/tax-settings", { json: payload })
    .json<Response<TaxSetting>>();
}

export function updateTaxSetting(
  resourceId: string,
  payload: UpdateTaxSettingPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/settings/tax-settings/${resourceId}`, {
      json: payload,
    })
    .json<Response<TaxSetting>>();
}

export function deleteTaxSetting(resourceId: string) {
  return authInstance
    .delete(`/api/v1/admin/settings/tax-settings/${resourceId}`)
    .json<Response>();
}
