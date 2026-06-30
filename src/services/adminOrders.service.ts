import type { AdminOrder, ReservedListing } from '@/types/adminOrder.type';
import type { PaginatedResponse } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminOrders(
  parameters: {
    page?: number;
    size?: number;
    sortOrder?: string;
    sortBy?: string;
  } = {},
) {
  return authInstance
    .get('/api/v1/admin/orders', { searchParams: parameters })
    .json<PaginatedResponse<AdminOrder>>();
}

export function listReservedListings(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/admin/orders/reserved-listings', { searchParams: parameters })
    .json<PaginatedResponse<ReservedListing>>();
}
