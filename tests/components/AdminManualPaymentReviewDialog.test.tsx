import type { AdminOrder } from '@/types/adminOrder.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminManualPaymentReviewDialog } from '@/components/admin/AdminManualPaymentReviewDialog';

const state = vi.hoisted(() => ({
  approve: vi.fn(),
  isPending: false,
  order: null as AdminOrder | null,
  proofError: false,
  reject: vi.fn(),
  requestResubmission: vi.fn(),
}));

vi.mock('@/queries/adminOrders.query', () => ({
  getAdminOrderOptions: (orderId: string, isEnabled: boolean) => ({
    enabled: isEnabled,
    queryFn: async () => ({ data: state.order }),
    queryKey: ['admin-orders', 'orders', 'detail', orderId],
  }),
  getAdminPaymentProofOptions: (fileId: string | undefined) => ({
    enabled: Boolean(fileId),
    queryFn: async () => {
      if (state.proofError)
        throw new Error('Proof access denied');
      return new Blob(['proof'], { type: 'image/png' });
    },
    queryKey: ['admin-orders', 'payment-proof', fileId],
  }),
  useApproveAdminManualPaymentMutation: () => ({ isPending: state.isPending, mutateAsync: state.approve }),
  useRejectAdminManualPaymentMutation: () => ({ isPending: state.isPending, mutateAsync: state.reject }),
  useRequestAdminManualPaymentResubmissionMutation: () => ({ isPending: state.isPending, mutateAsync: state.requestResubmission }),
}));

function makeOrder(overrides: Partial<AdminOrder> = {}): AdminOrder {
  const submission = {
    id: 'submission-id',
    orderId: 'order-id',
    proofFileId: 'proof-id',
    reviewerId: null,
    reviewNote: null,
    senderAccountNumber: '123456789012',
    senderAccountTitle: 'Jane Buyer',
    status: 'SUBMITTED' as const,
    reviewedAt: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  };

  return {
    id: 'order-id',
    buyerId: 'buyer-id',
    buyerFullName: 'Jane Buyer',
    cancellationReason: null,
    commissionAmount: 0,
    currency: 'PKR',
    discountAmount: 0,
    discountCode: null,
    items: [],
    itemStatusCounts: { completed: 0, confirmed: 0, received: 0, shipped: 0 },
    manualPaymentSubmissions: [submission],
    paymentStatus: 'PENDING',
    platformFeeAmount: 0,
    refundStatus: null,
    restorableListingIds: [],
    sellerCouponCode: null,
    shippingAddress: '1 Example Street',
    shippingCity: 'Lahore',
    shippingFirstName: 'Jane',
    shippingLastName: 'Buyer',
    shippingPhone: '03001234567',
    shippingPostal: '54000',
    status: 'AWAITING_PAYMENT',
    subtotal: 100,
    taxAmount: 0,
    taxRate: 0,
    total: 100,
    cancelledAt: null,
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

function renderDialog(canReview = true) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminManualPaymentReviewDialog
        orderId="order-id"
        onClose={vi.fn()}
        canReview={canReview}
      />
    </QueryClientProvider>,
  );
}

describe('admin manual payment review dialog', () => {
  beforeEach(() => {
    state.isPending = false;
    state.order = makeOrder();
    state.proofError = false;
    state.approve.mockReset().mockResolvedValue({ data: state.order.manualPaymentSubmissions[0] });
    state.reject.mockReset().mockResolvedValue({ data: state.order.manualPaymentSubmissions[0] });
    state.requestResubmission.mockReset().mockResolvedValue({ data: state.order.manualPaymentSubmissions[0] });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:payment-proof'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('loads fresh order detail, shows authorized sender data, and previews protected proof', async () => {
    renderDialog();

    expect(await screen.findByText('123456789012')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText('Submitted payment proof')).toHaveAttribute('src', 'blob:payment-proof'));
    expect(screen.getByText('Prior review information')).toBeInTheDocument();
  });

  it('masks sender data and removes review actions without ORDERS_UPDATE', async () => {
    renderDialog(false);

    expect(await screen.findByText('••••••••9012')).toBeInTheDocument();
    expect(screen.queryByText('123456789012')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve payment' })).not.toBeInTheDocument();
    expect(screen.getByText(/ORDERS_UPDATE permission is required/i)).toBeInTheDocument();
  });

  it('validates rejection reasons and submits a valid reject action', async () => {
    renderDialog();

    await screen.findByText('123456789012');
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    expect(await screen.findByText('A reason is required for this action.')).toBeInTheDocument();
    expect(state.reject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'The sender name does not match.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));

    await waitFor(() => expect(state.reject).toHaveBeenCalledWith({
      orderId: 'order-id',
      payload: { reviewNote: 'The sender name does not match.' },
    }));
  });

  it('submits approval without a note', async () => {
    renderDialog();

    await screen.findByText('123456789012');
    fireEvent.click(screen.getByRole('button', { name: 'Approve payment' }));

    await waitFor(() => expect(state.approve).toHaveBeenCalledWith('order-id'));
  });

  it('validates and submits a resubmission request', async () => {
    renderDialog();

    await screen.findByText('123456789012');
    fireEvent.click(screen.getByRole('button', { name: 'Request resubmission' }));
    expect(await screen.findByText('A reason is required for this action.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Please submit a clearer proof.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request resubmission' }));

    await waitFor(() => expect(state.requestResubmission).toHaveBeenCalledWith({
      orderId: 'order-id',
      payload: { reviewNote: 'Please submit a clearer proof.' },
    }));
  });

  it('shows a conflict response and keeps the dialog open', async () => {
    state.reject.mockRejectedValue(new Error('Manual payment review is no longer available.'));
    renderDialog();

    await screen.findByText('123456789012');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Please submit a clearer proof.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));

    expect(await screen.findByText('Manual payment review is no longer available.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles a protected proof failure without exposing proof details', async () => {
    state.proofError = true;
    renderDialog();

    await screen.findByText('Proof is unavailable or access was denied.');
    expect(screen.queryByAltText('Submitted payment proof')).not.toBeInTheDocument();
  });

  it('disables every review action while a mutation is pending', async () => {
    state.isPending = true;
    renderDialog();

    await screen.findByText('123456789012');
    expect(screen.getByRole('button', { name: 'Approve payment' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Request resubmission' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject payment' })).toBeDisabled();
  });
});
