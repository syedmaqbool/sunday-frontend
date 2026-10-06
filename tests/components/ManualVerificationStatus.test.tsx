import type { Order } from '@/types/order.type';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  getManualVerificationState,
  ManualVerificationStatus,
} from '@/components/ManualVerificationStatus';

function order(overrides: Partial<Pick<Order, 'cancellationReason' | 'expiresAt' | 'manualPaymentSubmission' | 'paymentStatus' | 'status'>> = {}) {
  return {
    cancellationReason: null,
    manualPaymentSubmission: {
      id: 'submission-id',
      orderId: 'order-id',
      proofFileId: 'proof-id',
      reviewNote: null,
      status: 'SUBMITTED' as const,
      reviewedAt: null,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    },
    paymentStatus: 'PENDING' as const,
    status: 'AWAITING_PAYMENT' as const,
    expiresAt: '2099-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('manual verification state', () => {
  it.each([
    ['APPROVED', 'APPROVED'],
    ['REJECTED', 'REJECTED'],
    ['RESUBMISSION_REQUESTED', 'RESUBMISSION_REQUESTED'],
  ] as const)('uses the backend %s state when its previous deadline has elapsed', (status, expected) => {
    const baseSubmission = order().manualPaymentSubmission!;
    const testOrder = order({
      manualPaymentSubmission: { ...baseSubmission, status },
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    const actualState = getManualVerificationState(testOrder);

    expect(actualState).toBe(expected);
  });

  it('keeps accepted-offer proof pending review without a deadline', () => {
    expect(getManualVerificationState(order({ expiresAt: null }))).toBe('SUBMITTED');
  });

  it('recognizes an ordinary submitted order as expired when its review window passed before backend cleanup', () => {
    expect(getManualVerificationState(order({ expiresAt: '2020-01-01T00:00:00.000Z' }))).toBe('EXPIRED');
  });

  it('recognizes payment expiry from the backend cancellation reason', () => {
    expect(getManualVerificationState(order({
      cancellationReason: 'PAYMENT_EXPIRED',
      status: 'CANCELLED',
    }))).toBe('EXPIRED');
    expect(getManualVerificationState(order({ status: 'CANCELLED' }))).toBe('CANCELLED');
  });

  it('recognizes an unpaid order as expired when its deadline passed before backend cleanup', () => {
    expect(getManualVerificationState(order({
      manualPaymentSubmission: null,
      expiresAt: '2020-01-01T00:00:00.000Z',
    }))).toBe('EXPIRED');
  });

  it('keeps orders without a manual submission on the legacy path', () => {
    expect(getManualVerificationState(order({ manualPaymentSubmission: null }))).toBe('LEGACY');
  });
});

describe('manualVerificationStatus', () => {
  it('shows review feedback without exposing proof identifiers or URLs', () => {
    render(
      <ManualVerificationStatus
        order={order({
          manualPaymentSubmission: {
            ...order().manualPaymentSubmission!,
            proofFileId: 'private-proof-id',
            reviewNote: 'The account holder name does not match the transfer.',
            status: 'REJECTED',
          },
        })}
      />,
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText(/account holder name does not match/i)).toBeInTheDocument();
    expect(screen.queryByText(/private-proof-id/i)).not.toBeInTheDocument();
  });

  it('shows awaiting review without a payment deadline after accepted-offer proof is submitted', () => {
    render(<ManualVerificationStatus order={order({ expiresAt: null })} />);

    expect(screen.queryByText(/deadline/i)).not.toBeInTheDocument();
    expect(screen.getByText('Pending review')).toBeInTheDocument();
  });

  it('keeps the review deadline for an ordinary submitted order', () => {
    render(<ManualVerificationStatus order={order()} />);

    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(screen.getByText(/payment review deadline/i)).toBeInTheDocument();
  });

  it('shows the expired payment deadline before backend cleanup updates the order', () => {
    render(
      <ManualVerificationStatus order={order({
        manualPaymentSubmission: null,
        expiresAt: '2020-01-01T00:00:00.000Z',
      })}
      />,
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText(/payment deadline:/i)).toBeInTheDocument();
  });

  it('shows the correction deadline when the backend requests resubmission', () => {
    const submission = order().manualPaymentSubmission!;
    render(
      <ManualVerificationStatus order={order({
        manualPaymentSubmission: { ...submission, status: 'RESUBMISSION_REQUESTED' },
        expiresAt: '2099-01-01T00:00:00.000Z',
      })}
      />,
    );

    expect(screen.getByText('Resubmission requested')).toBeInTheDocument();
    expect(screen.getByText(/payment correction deadline/i)).toBeInTheDocument();
  });
});
