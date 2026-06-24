import { authInstance } from "@/services/ky.instance";
import type { AdminOrder, ReservedListing } from "@/types/admin/order";
import type { PaginatedResponse } from "@/types/response.type";

export function listAdminOrders(
  params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {},
) {
  return authInstance
    .get("/api/v1/admin/orders", { searchParams: params })
    .json<PaginatedResponse<AdminOrder>>();
}

export function listReservedListings(
  params: { page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/admin/orders/reserved-listings", { searchParams: params })
    .json<PaginatedResponse<ReservedListing>>();
}
