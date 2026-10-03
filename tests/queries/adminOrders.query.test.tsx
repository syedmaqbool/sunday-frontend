import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminOrdersQueryKey,
  getAdminOrdersOptions,
  useApproveAdminManualPaymentMutation,
} from '@/queries/adminOrders.query';

const { approveAdminManualPaymentMock, listAdminOrdersMock } = vi.hoisted(() => ({
  approveAdminManualPaymentMock: vi.fn(),
  listAdminOrdersMock: vi.fn(),
}));

vi.mock('@/services/adminOrders.service', () => ({
  approveAdminManualPayment: approveAdminManualPaymentMock,
  getAdminOrder: vi.fn(),
  getPaymentProofFile: vi.fn(),
  listAdminOrders: listAdminOrdersMock,
  listReservedListings: vi.fn(),
  rejectAdminManualPayment: vi.fn(),
  requestAdminManualPaymentResubmission: vi.fn(),
}));

function MutationHarness({ onReady }: { onReady: (mutation: ReturnType<typeof useApproveAdminManualPaymentMutation>) => void }) {
  const mutation = useApproveAdminManualPaymentMutation();

  useEffect(() => onReady(mutation), [mutation, onReady]);
  return null;
}

describe('admin order query mutations', () => {
  beforeEach(() => {
    approveAdminManualPaymentMock.mockReset().mockResolvedValue({
      data: {
        id: 'submission-id',
        status: 'APPROVED',
      },
    });
  });

  it('invalidates the owning admin order list and detail keys after approval', async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    let mutation: ReturnType<typeof useApproveAdminManualPaymentMutation> | undefined;

    render(
      <QueryClientProvider client={queryClient}>
        <MutationHarness onReady={(value) => { mutation = value; }} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mutation).toBeDefined());
    await mutation!.mutateAsync('order-id');

    expect(approveAdminManualPaymentMock).toHaveBeenCalledWith('order-id', expect.anything());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminOrdersQueryKey.all() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminOrdersQueryKey.detail('order-id') });
  });
});

describe('admin order list query', () => {
  it('includes the search term in the request and cache key', async () => {
    const parameters = { page: 1, search: '# AbCd1234', size: 100 };
    const response = { data: [] };
    listAdminOrdersMock.mockResolvedValue(response);
    const options = getAdminOrdersOptions(parameters);

    expect(options.queryKey).toEqual(adminOrdersQueryKey.orders(parameters));
    expect(options.queryKey).toContainEqual(parameters);
    await expect(new QueryClient().fetchQuery(options)).resolves.toBe(response);
    expect(listAdminOrdersMock).toHaveBeenCalledWith(parameters);
  });
});
