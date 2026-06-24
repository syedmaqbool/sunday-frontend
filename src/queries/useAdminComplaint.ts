import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listAdminComplaints,
  updateComplaintStatus,
} from "@/services/complain.service";
import type { AdminComplaintStatus, ComplaintStatus } from "@/types/complaint";

export const adminComplaintsQueryKey = {
  all: () => ["admin-complaints"] as const,
  list: (status?: ComplaintStatus | "all") =>
    [...adminComplaintsQueryKey.all(), "list", status] as const,
};

export const getAdminComplaintsOptions = (status?: ComplaintStatus | "all") =>
  queryOptions({
    queryKey: adminComplaintsQueryKey.list(status),
    queryFn: () =>
      listAdminComplaints({
        status: status && status !== "all" ? status : undefined,
        size: 100,
      }),
  });

export const useAdminComplaints = (status?: ComplaintStatus | "all") =>
  useQuery(getAdminComplaintsOptions(status));

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
    }) => updateComplaintStatus(complaintId, { status, adminNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminComplaintsQueryKey.all(),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};
