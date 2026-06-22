import { apiClient } from "@/lib/apiClient";

export type ComplaintStatus =
  | "RAISED"
  | "UNDER_REVIEW"
  | "RETURN_APPROVED"
  | "RETURN_ADDRESS_PROVIDED"
  | "RETURN_IN_TRANSIT"
  | "RETURN_RECEIVED"
  | "REFUNDED"
  | "REJECTED";

export type AdminComplaintStatus =
  | "RETURN_APPROVED"
  | "REJECTED"
  | "RETURN_RECEIVED"
  | "REFUNDED";

export interface Complaint {
  id: string;
  orderId: string;
  orderItemId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  evidenceUrls: string[];
  returnProofUrls: string[];
  returnCarrier: string | null;
  returnTracking: string | null;
  returnAddress: string | null;
  returnAddressPhone: string | null;
  returnAddressRecipient: string | null;
  returnInstructions: string | null;
  expectedReturnDate: string | null;
  status: ComplaintStatus;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolverFullName: string | null;
  listingTitle: string;
  buyerFullName: string;
  sellerFullName: string;
  createdAt: string;
  updatedAt: string;
}

// API returns { statusCode, message, data: T[], pagination, aggregates }
interface ApiListResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    prevPage: number | null;
    perPage: number;
    total: number;
  };
}

interface ApiItemResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const adminComplaintService = {
  // GET /api/v1/admin/complaints?status=...&page=...&size=...
  list: (params: { status?: ComplaintStatus; page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.size) qs.set("size", String(params.size));
    const query = qs.toString();
    return apiClient.get<ApiListResponse<Complaint>>(
      `/api/v1/admin/complaints${query ? `?${query}` : ""}`,
    );
  },

  // PATCH /api/v1/admin/complaints/:complaintId/status
  updateStatus: (
    complaintId: string,
    body: { status: AdminComplaintStatus; adminNotes?: string },
  ) =>
    apiClient.patch<ApiItemResponse<Complaint>>(
      `/api/v1/admin/complaints/${complaintId}/status`,
      body,
    ),
};