import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  listComplaintsAgainstMe,
  listMyRefundComplaints,
} from '@/services/complaints.service';

export const complaintsQueryKey = {
  againstMe: () => ['complaints-against-me'] as const,
  detail: (orderId: string, listingId: string) =>
    ['complaint', orderId, listingId] as const,
  myRefunds: () => ['my-refund-complaints'] as const,
  orderShipment: (orderId: string, listingId: string) =>
    ['order-shipment', orderId, listingId] as const,
};

export interface ComplaintDetails {
  id: string;
  admin_notes: string;
  created_at: string;
  evidence_urls: string[];
  reason: string;
  return_carrier: string | null;
  return_expected_date?: string | null;
  return_proof_urls: string[];
  return_to_address: string | null;
  return_to_city: string | null;
  return_to_name: string | null;
  return_to_notes: string | null;
  return_to_phone: string | null;
  return_to_postal: string | null;
  return_tracking: string | null;
  status: string;
  updated_at?: string;
}

export interface OrderShipmentInfo {
  expected_delivery?: string;
  shipped_at?: string;
}

export function getMyRefundComplaintsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listMyRefundComplaints();
      return response.data;
    },
    queryKey: complaintsQueryKey.myRefunds(),
  });
}

export function getComplaintsAgainstMeOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listComplaintsAgainstMe();
      return response.data;
    },
    queryKey: complaintsQueryKey.againstMe(),
  });
}

export function getComplaintDetailsOptions(orderId: string, listingId: string) {
  return queryOptions({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select(
          'id, status, reason, evidence_urls, return_proof_urls, return_carrier, return_tracking, return_expected_date, admin_notes, created_at, updated_at, return_to_name, return_to_address, return_to_city, return_to_postal, return_to_phone, return_to_notes',
        )
        .eq('order_id', orderId)
        .eq('listing_id', listingId)
        .maybeSingle();
      if (error)
        throw error;
      return (data as ComplaintDetails | null) ?? null;
    },
    queryKey: complaintsQueryKey.detail(orderId, listingId),
  });
}

export function getOrderShipmentOptions(orderId: string, listingId: string) {
  return queryOptions({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('item_status')
        .eq('id', orderId)
        .maybeSingle();
      if (error)
        throw error;
      const entry = (data?.item_status as any)?.[listingId] ?? null;
      return entry as OrderShipmentInfo | null;
    },
    queryKey: complaintsQueryKey.orderShipment(orderId, listingId),
  });
}
