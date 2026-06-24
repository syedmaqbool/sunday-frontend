import { authInstance } from "@/services/ky.instance";
import type { SellerAnalytics } from "@/types/seller-analytics";
import type { Response } from "@/types/response.type";

export function getSellerAnalytics() {
  return authInstance
    .get("/api/v1/me/seller-analytics")
    .json<Response<SellerAnalytics>>();
}
