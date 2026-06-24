import { authInstance } from "@/services/ky.instance";
import type { AdminSettings } from "@/types/admin/settings";
import type { Response } from "@/types/response.type";

export async function getFlagKeywords() {
  return await authInstance
    .get("/api/v1/admin/settings")
    .json<Response<AdminSettings>>();
}

export function updateFlagKeywords(keywords: string[]) {
  return authInstance
    .patch("/api/v1/admin/settings", { json: { flagKeywords: keywords } })
    .json<Response<AdminSettings>>();
}
