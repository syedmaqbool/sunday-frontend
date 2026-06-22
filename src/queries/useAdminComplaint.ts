import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminComplaintService,
  type AdminComplaintStatus,
  type ComplaintStatus,
} from "@/services/complain.service";

const COMPLAINTS_KEY = ["admin-complaints"];

export const useAdminComplaints = (status?: ComplaintStatus | "all") =>
  useQuery({
    queryKey: [...COMPLAINTS_KEY, status],
    queryFn: () =>
      adminComplaintService.list({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      }),
    // data is now the full ApiListResponse — access data.data in component
  });

export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      complaintId,
      status,
      adminNotes,
    }: {
      complaintId: string;
      status: AdminComplaintStatus;
      adminNotes?: string;
    }) => adminComplaintService.updateStatus(complaintId, { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};