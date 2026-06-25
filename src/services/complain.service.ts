import type {
  Complaint,
  ComplaintStatus,
  UpdateComplaintStatusPayload,
} from '@/types/complaint';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminComplaints(
  parameters: { page?: number; size?: number; status?: ComplaintStatus } = {},
) {
  return authInstance
    .get('/api/v1/admin/complaints', { searchParams: parameters })
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
