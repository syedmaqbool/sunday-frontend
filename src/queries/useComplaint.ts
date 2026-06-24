import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  listComplaintsAgainstMe,
  listMyRefundComplaints,
} from "@/services/complaints.service";

export const complaintsQueryKey = {
  myRefunds: () => ["my-refund-complaints"] as const,
  againstMe: () => ["complaints-against-me"] as const,
};

export const getMyRefundComplaintsOptions = () =>
  queryOptions({
    queryKey: complaintsQueryKey.myRefunds(),
    queryFn: async () => {
      const res = await listMyRefundComplaints();
      return res.data;
    },
  });

export const getComplaintsAgainstMeOptions = () =>
  queryOptions({
    queryKey: complaintsQueryKey.againstMe(),
    queryFn: async () => {
      const res = await listComplaintsAgainstMe();
      return res.data;
    },
  });

export const useMyRefundComplaints = () =>
  useQuery(getMyRefundComplaintsOptions());

export const useComplaintsAgainstMe = () =>
  useQuery(getComplaintsAgainstMeOptions());
