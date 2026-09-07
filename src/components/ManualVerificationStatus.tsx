import type { Order } from '@/types/order.type';
import { AlertCircle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utilities';

export type ManualVerificationState
  = 'APPROVED' | 'CANCELLED' | 'EXPIRED' | 'LEGACY' | 'REJECTED' | 'RESUBMISSION_REQUESTED' | 'SUBMITTED';

export interface ManualVerificationCopy {
  description: string;
  heading: string;
  label: string;
}

export function getManualVerificationState(
  order: Pick<Order, 'expiresAt' | 'manualPaymentSubmission' | 'paymentStatus' | 'status'>,
  now = new Date(),
): ManualVerificationState {
  if (order.status === 'CANCELLED')
    return 'CANCELLED';

  const submissionStatus = order.manualPaymentSubmission?.status;
  if (submissionStatus === 'APPROVED')
    return 'APPROVED';
  if (submissionStatus === 'REJECTED')
    return 'REJECTED';
  if (submissionStatus === 'RESUBMISSION_REQUESTED')
    return 'RESUBMISSION_REQUESTED';

  if (order.expiresAt && new Date(order.expiresAt) <= now && order.paymentStatus !== 'PAID')
    return 'EXPIRED';

  if (submissionStatus === 'SUBMITTED')
    return 'SUBMITTED';

  return 'LEGACY';
}

export function getManualVerificationCopy(
  state: ManualVerificationState,
): ManualVerificationCopy {
  switch (state) {
    case 'APPROVED': {
      return {
        description: 'Your payment has been approved and your order is being prepared.',
        heading: 'Payment approved',
        label: 'Approved',
      };
    }
    case 'CANCELLED': {
      return {
        description: 'This order has been cancelled before payment verification was completed.',
        heading: 'Order cancelled',
        label: 'Cancelled',
      };
    }
    case 'EXPIRED': {
      return {
        description: 'The payment review window for this order has expired.',
        heading: 'Payment window expired',
        label: 'Expired',
      };
    }
    case 'REJECTED': {
      return {
        description: 'The store rejected this payment proof. Review the reason below and contact the store if you need help.',
        heading: 'Payment proof rejected',
        label: 'Rejected',
      };
    }
    case 'RESUBMISSION_REQUESTED': {
      return {
        description: 'The store needs a new payment proof before it can approve this order.',
        heading: 'Resubmission requested',
        label: 'Resubmission requested',
      };
    }
    case 'SUBMITTED': {
      return {
        description: 'Your payment proof was submitted and is waiting for manual review.',
        heading: 'Payment pending verification',
        label: 'Pending review',
      };
    }
    default: {
      return {
        description: '',
        heading: '',
        label: '',
      };
    }
  }
}

function stateIcon(state: ManualVerificationState) {
  if (state === 'APPROVED')
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (state === 'SUBMITTED')
    return <Clock3 className="h-4 w-4 text-primary" />;
  if (state === 'REJECTED' || state === 'RESUBMISSION_REQUESTED')
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <XCircle className="h-4 w-4 text-muted-foreground" />;
}

export function ManualVerificationStatus({
  className,
  compact = false,
  order,
}: {
  className?: string;
  compact?: boolean;
  order: Pick<Order, 'expiresAt' | 'manualPaymentSubmission' | 'paymentStatus' | 'status'>;
}) {
  const state = getManualVerificationState(order);
  if (state === 'LEGACY' || (state === 'CANCELLED' && !order.manualPaymentSubmission))
    return null;

  const copy = getManualVerificationCopy(state);
  const reviewNote = order.manualPaymentSubmission?.reviewNote;
  const deadline = order.expiresAt ? new Date(order.expiresAt) : null;

  return (
    <div className={cn(compact ? 'space-y-1' : 'rounded-md border border-border bg-muted/30 p-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {stateIcon(state)}
        <Badge variant={state === 'APPROVED' ? 'default' : state === 'REJECTED' || state === 'RESUBMISSION_REQUESTED' ? 'destructive' : 'outline'}>
          {copy.label}
        </Badge>
      </div>
      <p className={cn('text-sm text-muted-foreground', compact ? 'text-xs' : 'mt-2')}>
        {copy.description}
      </p>
      {reviewNote && (
        <p className="text-sm text-foreground">
          Review note:
          {' '}
          {reviewNote}
        </p>
      )}
      {deadline && state !== 'APPROVED' && state !== 'CANCELLED' && (
        <p className="text-xs text-muted-foreground">
          Payment review deadline:
          {' '}
          {deadline.toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </div>
  );
}
