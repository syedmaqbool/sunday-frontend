const SELLER_EDITABLE_LISTING_STATUSES = ['PENDING', 'REJECTED', 'NEEDS_REVISION'] as const;

export function isSellerEditableListingStatus(status: string): boolean {
  return SELLER_EDITABLE_LISTING_STATUSES.includes(status as typeof SELLER_EDITABLE_LISTING_STATUSES[number]);
}
