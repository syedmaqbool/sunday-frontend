import { formatEnumLabel } from '@/lib/utilities';

export function formatChargeReason(reason: string | null | undefined): string {
  return reason ? formatEnumLabel(reason) : '—';
}

export function formatPurchaseStatus(status: string | null | undefined): string {
  return status ? formatEnumLabel(status) : '—';
}

export function formatChargeAmount(currency: string, amount: number): string {
  return `${currency} ${amount}`;
}

export function formatTransactionId(transactionId: string | null | undefined): string {
  return transactionId ?? '—';
}
