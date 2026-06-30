import type { AdminComplaintStatus, ComplaintStatus } from '@/types/complaint.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAdminComplaints,
  updateComplaintStatus,
} from '@/services/complain.service';

export const adminComplaintsQueryKey = {
  all: () => ['admin-complaints'] as const,
  list: (status?: 'all' | ComplaintStatus) =>
    [...adminComplaintsQueryKey.all(), 'list', status] as const,
};

export function getAdminComplaintsOptions(status?: 'all' | ComplaintStatus) {
  return queryOptions({
    queryFn: () =>
      listAdminComplaints({
        size: 100,
        status: status && status !== 'all' ? status : undefined,
      }),
    queryKey: adminComplaintsQueryKey.list(status),
  });
}

export function useUpdateComplaintStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      complaintId,
      adminNotes,
      status,
    }: {
      complaintId: string;
      adminNotes?: string;
      status: AdminComplaintStatus;
    }) => updateComplaintStatus(complaintId, { adminNotes, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminComplaintsQueryKey.all(),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

