import { useQuery } from "@tanstack/react-query";
import { complaintsService } from "@/services/complaints.service";

export const useMyRefundComplaints = () =>
  useQuery({
    queryKey: ["my-refund-complaints"],
    queryFn: async () => {
      const res = await complaintsService.myRefunds();
      return res.data;
    },
  });

export const useComplaintsAgainstMe = () =>
  useQuery({
    queryKey: ["complaints-against-me"],
    queryFn: async () => {
      const res = await complaintsService.againstMe();
      return res.data;
    },
  });