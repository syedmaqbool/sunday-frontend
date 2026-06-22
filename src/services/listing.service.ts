import { apiClient } from "@/lib/apiClient";

export type ListingStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "SOLD" | "RESERVED";

export interface ListingMediaFile {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface ListingMedia {
  id: string;
  type: "IMAGE" | "VIDEO";
  sortOrder: number;
  createdAt: string;
  file: ListingMediaFile | null;
}

export interface AdminListing {
  id: string;
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  price: number;
  reservedUntil: string | null;
  brand: string;
  condition: string;
  size: string;
  weight: number | null;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  categoryLabel: string;
  categoryValue: string;
  subcategoryLabel: string;
  subcategoryValue: string;
  coverImage: ListingMediaFile | null;
  media: ListingMedia[];
}

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

export const listingService = {
  listAdmin: (params: { status?: ListingStatus; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("size", String(params.size ?? 100));
    return apiClient.get<ListResponse<AdminListing>>(`/api/v1/admin/listings?${query.toString()}`);
  },

  moderate: (listingId: string, payload: { status: "APPROVED" | "REJECTED" | "NEEDS_REVISION"; feedback?: string }) =>
    apiClient.patch<{ data: AdminListing }>(`/api/v1/admin/listings/${listingId}/moderate`, payload),
};