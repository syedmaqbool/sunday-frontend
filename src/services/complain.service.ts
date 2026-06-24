import { authInstance } from "@/services/ky.instance";
import type {
  Complaint,
  ComplaintStatus,
  UpdateComplaintStatusPayload,
} from "@/types/complaint";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listAdminComplaints(
  params: { status?: ComplaintStatus; page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/admin/complaints", { searchParams: params })
    .json<PaginatedResponse<Complaint>>();
}

export function updateComplaintStatus(
  complaintId: string,
  body: UpdateComplaintStatusPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/complaints/${complaintId}/status`, { json: body })
    .json<Response<Complaint>>();
}
