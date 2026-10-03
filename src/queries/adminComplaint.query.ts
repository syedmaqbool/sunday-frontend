import type { InfiniteData } from '@tanstack/react-query';
import type { AdminComplaint, AdminComplaintsParameters, AdminComplaintStatus, ComplaintStatus } from '@/types/complaint.type';
import type { PaginatedResponse } from '@/types/response.type';
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAnalyticsQueryKey } from '@/queries/adminAnalytics.query';
import {
  listAdminComplaints,
  updateComplaintStatus,
} from '@/services/complain.service';

export const adminComplaintsQueryKey = {
  all: () => ['admin-complaints'] as const,
  byOrders: (orderIds: string[]) => [...adminComplaintsQueryKey.all(), 'orders', 'list', orderIds] as const,
  list: (status?: 'all' | ComplaintStatus) =>
    [...adminComplaintsQueryKey.all(), 'list', status] as const,
};

export function getAdminComplaintsForOrdersOptions(orderIds: string[], isEnabled: boolean) {
  return infiniteQueryOptions<
    PaginatedResponse<AdminComplaint>,
    Error,
    InfiniteData<PaginatedResponse<AdminComplaint>>,
    ReturnType<typeof adminComplaintsQueryKey.byOrders>,
    number
  >({
    enabled: isEnabled && orderIds.length > 0,
    getNextPageParam: lastPage => lastPage.pagination.nextPage ?? undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listAdminComplaints({
      orderIds,
      page: pageParam,
      size: 100,
    } satisfies AdminComplaintsParameters),
    queryKey: adminComplaintsQueryKey.byOrders(orderIds),
  });
}

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
      queryClient.invalidateQueries({ queryKey: adminAnalyticsQueryKey.all() });
    },
  });
}
