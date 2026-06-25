import type { Complaint } from '@/types/complaint';
import type { PaginatedResponse } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listMyRefundComplaints() {
  return authInstance
    .get('/api/v1/me/complaints/refunds', { searchParams: { size: 100 } })
    .json<PaginatedResponse<Complaint>>();
}

export function listComplaintsAgainstMe() {
  return authInstance
    .get('/api/v1/me/complaints/against-me', { searchParams: { size: 100 } })
    .json<PaginatedResponse<Complaint>>();
}
