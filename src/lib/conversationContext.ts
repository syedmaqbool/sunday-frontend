import type { Conversation } from '@/types/conversation.type';

export function getConversationContextLabel(
  type: Conversation['type'],
  listingTitle: string | null,
) {
  if (type === 'DIRECT' || listingTitle === null)
    return 'General enquiry';

  return listingTitle;
}
