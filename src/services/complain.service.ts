import type {
  AdminComplaint,
  AdminComplaintsParameters,
  UpdateComplaintStatusPayload,
} from '@/types/complaint.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminComplaints(
  parameters: AdminComplaintsParameters = {},
) {
  const searchParams = new URLSearchParams();
  if (parameters.page !== undefined)
    searchParams.set('page', String(parameters.page));
  if (parameters.size !== undefined)
    searchParams.set('size', String(parameters.size));
  if (parameters.status)
    searchParams.set('status', parameters.status);
  const orderIds = parameters.orderIds ?? [];
  for (const orderId of orderIds)
    searchParams.append('orderIds', orderId);

  return authInstance
    .get('/api/v1/admin/complaints', { searchParams })
    .json<PaginatedResponse<AdminComplaint>>();
}

export function updateComplaintStatus(
  complaintId: string,
  body: UpdateComplaintStatusPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/complaints/${complaintId}/status`, { json: body })
    .json<Response<AdminComplaint>>();
}
