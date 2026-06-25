import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  listComplaintsAgainstMe,
  listMyRefundComplaints,
} from '@/services/complaints.service';

export const complaintsQueryKey = {
  againstMe: () => ['complaints-against-me'] as const,
  myRefunds: () => ['my-refund-complaints'] as const,
};

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

export function useMyRefundComplaints() {
  return useQuery(getMyRefundComplaintsOptions());
}

export function useComplaintsAgainstMe() {
  return useQuery(getComplaintsAgainstMeOptions());
}
