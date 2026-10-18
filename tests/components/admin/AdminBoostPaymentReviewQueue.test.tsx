import type { GetAdminBoostPaymentSubmissionsResponse } from '@/types/generated-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminBoostPaymentReviewQueue } from '@/components/admin/AdminBoostPaymentReviewQueue';

const state = vi.hoisted(() => ({
  completeRefund: vi.fn(),
  approve: vi.fn(),
  canReview: true,
  entries: [] as any[],
  proofError: false,
  reject: vi.fn(),
  requestResubmission: vi.fn(),
}));

vi.mock('@/queries/adminBoost.query', () => ({
  getAdminBoostPaymentSubmissionsOptions: () => ({
    queryFn: async () => ({ data: state.entries }),
    queryKey: ['admin-boost', 'payment-submissions', 'list'],
  }),
  getAdminBoostPaymentProofOptions: (fileId: string | undefined) => ({
    enabled: Boolean(fileId),
    queryFn: async () => {
      if (state.proofError)
        throw new Error('Proof access denied');
      return new Blob(['proof'], { type: 'image/png' });
    },
    queryKey: ['admin-boost', 'payment-proof', fileId],
  }),
  useApproveAdminBoostPaymentMutation: () => ({ isPending: false, mutateAsync: state.approve }),
  useRejectAdminBoostPaymentMutation: () => ({ isPending: false, mutateAsync: state.reject }),
  useRequestAdminBoostPaymentResubmissionMutation: () => ({ isPending: false, mutateAsync: state.requestResubmission }),
  useCompleteAdminBoostRefundMutation: () => ({ isPending: false, mutateAsync: state.completeRefund }),
}));

function makeSubmission(overrides: Record<string, unknown> = {}) {
  return {
    boostPurchase: {
      id: 'purchase-id',
      listingId: 'listing-id',
      sellerId: 'seller-id',
      amount: 1200,
      status: 'REFUND_REQUIRED',
    },
    boosts: [{
      id: 'boost-id',
      boostPurchaseId: 'purchase-id',
      listingId: 'listing-id',
      packageId: 'package-id',
      sellerId: 'seller-id',
      durationDays: 7,
      isActive: false,
      packageName: 'Trending week',
      paymentStatus: 'PENDING',
      placement: 'TRENDING',
      pricePaid: 1200,
      endsAt: '2026-10-25T00:00:00.000Z',
      startsAt: '2026-10-18T00:00:00.000Z',
      createdAt: '2026-10-18T00:00:00.000Z',
      updatedAt: '2026-10-18T00:00:00.000Z',
    }],
    listing: { id: 'listing-id', status: 'SOLD', title: 'Vintage jacket' },
    paymentSubmission: {
      id: 'submission-id',
      boostPurchaseId: 'purchase-id',
      proofFileId: 'proof-id',
      reviewerId: null,
      reviewNote: null,
      senderAccountNumber: '123456789012',
      senderAccountTitle: 'Jane Seller',
      status: 'SUBMITTED',
      reviewedAt: null,
      createdAt: '2026-10-18T00:00:00.000Z',
    },
    proof: { id: 'proof-id', filename: 'transfer.png', mimetype: 'image/png', url: '/proof' },
    seller: { id: 'seller-id', email: 'jane@example.com', firstName: 'Jane', lastName: 'Seller' },
    ...overrides,
  } satisfies GetAdminBoostPaymentSubmissionsResponse['data'][number];
}

function renderQueue() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminBoostPaymentReviewQueue canReview={state.canReview} />
    </QueryClientProvider>,
  );
}

describe('admin boost payment review queue', () => {
  beforeEach(() => {
    state.canReview = true;
    state.proofError = false;
    state.entries = [makeSubmission()];
    state.approve.mockReset().mockResolvedValue({ data: { refundRequired: true, purchase: { status: 'REFUND_REQUIRED' }, paymentSubmission: { status: 'APPROVED' } } });
    state.reject.mockReset().mockResolvedValue({ data: { paymentSubmission: { status: 'REJECTED' } } });
    state.requestResubmission.mockReset().mockResolvedValue({ data: { paymentSubmission: { status: 'RESUBMISSION_REQUESTED' } } });
    state.completeRefund.mockReset().mockResolvedValue({ data: { status: 'REFUNDED' } });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:boost-payment-proof'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('shows purchase proof and identifies an ineligible boost as requiring refund', async () => {
    renderQueue();

    expect(await screen.findByText('Vintage jacket')).toBeInTheDocument();
    expect(screen.getByText('Jane Seller')).toBeInTheDocument();
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
    expect(screen.getByText('Rs 1,200')).toBeInTheDocument();
    expect(screen.getByText('Trending week')).toBeInTheDocument();
    expect(screen.getByText('123456789012')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText('Submitted boost payment proof')).toHaveAttribute('src', 'blob:boost-payment-proof'));
    expect(screen.getByText(/listing is no longer eligible/i)).toBeInTheDocument();
    expect(screen.getByText('REFUND REQUIRED')).toBeInTheDocument();
  });

  it('records the manual refund and shows the server-confirmed refunded outcome', async () => {
    renderQueue();
    await screen.findByText('Vintage jacket');

    fireEvent.click(screen.getByRole('button', { name: 'Record refund completed' }));

    await waitFor(() => expect(state.completeRefund).toHaveBeenCalledWith('purchase-id'));
    expect(await screen.findByText('REFUNDED')).toBeInTheDocument();
    expect(screen.getByText('Refund completed')).toBeInTheDocument();
  });

  it('sends approval to the server and shows the server-confirmed refund requirement', async () => {
    renderQueue();
    await screen.findByText('Vintage jacket');

    fireEvent.click(screen.getByRole('button', { name: 'Approve payment' }));

    await waitFor(() => expect(state.approve).toHaveBeenCalledWith({ submissionId: 'submission-id' }));
    expect(await screen.findByText('REFUND REQUIRED')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve payment' })).not.toBeInTheDocument();
  });

  it('requires a reason and sends rejection to the server', async () => {
    renderQueue();
    await screen.findByText('Vintage jacket');
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    expect(await screen.findByText('A reason is required for this action.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Reason for rejection or replacement proof' }), { target: { value: 'Transfer amount is incorrect.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));

    await waitFor(() => expect(state.reject).toHaveBeenCalledWith({
      submissionId: 'submission-id',
      payload: { reviewNote: 'Transfer amount is incorrect.' },
    }));
    expect(screen.queryByRole('button', { name: 'Reject payment' })).not.toBeInTheDocument();
  });

  it('requires a reason and requests replacement proof from the server', async () => {
    renderQueue();
    await screen.findByText('Vintage jacket');
    fireEvent.change(screen.getByRole('textbox', { name: 'Reason for rejection or replacement proof' }), { target: { value: 'Please include the transfer reference.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request replacement proof' }));

    await waitFor(() => expect(state.requestResubmission).toHaveBeenCalledWith({
      submissionId: 'submission-id',
      payload: { reviewNote: 'Please include the transfer reference.' },
    }));
    expect(screen.queryByRole('button', { name: 'Request replacement proof' })).not.toBeInTheDocument();
  });

  it('does not expose payment decisions without BOOSTS_UPDATE permission', async () => {
    state.canReview = false;
    renderQueue();

    expect(await screen.findByText(/BOOSTS_UPDATE permission is required/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve payment' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record refund completed' })).toBeDisabled();
  });
});
