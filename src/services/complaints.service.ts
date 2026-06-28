import type { Complaint } from '@/types/complaint';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { HTTPError } from 'ky';
import { authInstance } from '@/services/ky.instance';

export interface CreateComplaintPayload {
  orderId: string;
  orderItemId: string;
  evidenceUrls: string[];
  reason: string;
}

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

export function createComplaint(payload: CreateComplaintPayload) {
  return authInstance
    .post('/api/v1/complaints', { json: payload })
    .json<Response<Complaint>>();
}

export async function getOrderItemComplaint(
  orderId: string,
  orderItemId: string,
) {
  try {
    return await authInstance
      .get(`/api/v1/orders/${orderId}/items/${orderItemId}/complaint`)
      .json<Response<Complaint>>();
  }
  catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) {
      return null;
    }

    throw error;
  }
}

export interface ProvideReturnAddressPayload {
  returnAddress: string;
  returnAddressCity?: string;
  returnAddressPhone?: string;
  returnAddressPostal?: string;
  returnAddressRecipient?: string;
  returnInstructions?: string;
}

export function provideReturnAddress(
  complaintId: string,
  payload: ProvideReturnAddressPayload,
) {
  return authInstance
    .post(`/api/v1/complaints/${complaintId}/return-address`, { json: payload })
    .json<Response<Complaint>>();
}

export function markComplaintReturnReceived(complaintId: string) {
  return authInstance
    .post(`/api/v1/complaints/${complaintId}/return-received`)
    .json<Response<Complaint>>();
}
