export function getConversationContextLabel(
  type: 'DIRECT' | 'LISTING',
  listingTitle: string | null,
) {
  if (type === 'DIRECT' || listingTitle === null)
    return 'General enquiry';

  return listingTitle;
}
