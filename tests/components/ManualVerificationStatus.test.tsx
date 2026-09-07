import type { Order } from '@/types/order.type';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  getManualVerificationState,
  ManualVerificationStatus,
} from '@/components/ManualVerificationStatus';

function order(overrides: Partial<Pick<Order, 'expiresAt' | 'manualPaymentSubmission' | 'paymentStatus' | 'status'>> = {}) {
  return {
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
    ['SUBMITTED', 'SUBMITTED'],
    ['APPROVED', 'APPROVED'],
    ['REJECTED', 'REJECTED'],
    ['RESUBMISSION_REQUESTED', 'RESUBMISSION_REQUESTED'],
  ] as const)('recognizes the backend %s state', (status, expected) => {
    const baseSubmission = order().manualPaymentSubmission!;
    const testOrder = order({
      manualPaymentSubmission: { ...baseSubmission, status },
    });
    const actualState = getManualVerificationState(testOrder);

    expect(actualState).toBe(expected);
  });

  it('recognizes cancellation and expiry as distinct states', () => {
    expect(getManualVerificationState(order({ status: 'CANCELLED' }))).toBe('CANCELLED');
    expect(getManualVerificationState(order({
      manualPaymentSubmission: null,
      expiresAt: '2020-01-01T00:00:00.000Z',
    }), new Date('2026-09-08T00:00:00.000Z'))).toBe('EXPIRED');
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

  it('shows the review deadline for an active pending submission', () => {
    render(<ManualVerificationStatus order={order()} />);

    expect(screen.getByText(/payment review deadline/i)).toBeInTheDocument();
    expect(screen.getByText('Pending review')).toBeInTheDocument();
  });
});
