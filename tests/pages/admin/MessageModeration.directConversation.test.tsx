import { infiniteQueryOptions, QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MessageModeration from '@/pages/admin/MessageModeration';

const flaggedMessages = [
  {
    id: 'flagged-direct',
    buyerId: 'buyer-1',
    conversationId: 'conversation-direct',
    listingId: null,
    sellerId: 'seller-1',
    senderId: 'buyer-1',
    buyerFullName: 'Buyer',
    content: 'A direct message needing review.',
    flagReasons: ['PHONE_NUMBER'],
    isFlagged: true,
    listingTitle: null,
    sellerFullName: 'Seller',
    type: 'DIRECT' as const,
    conversationCreatedAt: '2026-10-07T12:00:00.000Z',
    readAt: null,
    createdAt: '2026-10-07T12:01:00.000Z',
    updatedAt: '2026-10-07T12:01:00.000Z',
  },
  {
    id: 'flagged-listing',
    buyerId: 'buyer-2',
    conversationId: 'conversation-listing',
    listingId: 'listing-1',
    sellerId: 'seller-2',
    senderId: 'buyer-2',
    buyerFullName: 'Another Buyer',
    content: 'A listing message needing review.',
    flagReasons: ['PHONE_NUMBER'],
    isFlagged: true,
    listingTitle: 'Antique chair',
    sellerFullName: 'Another Seller',
    type: 'LISTING' as const,
    conversationCreatedAt: '2026-10-06T12:00:00.000Z',
    readAt: null,
    createdAt: '2026-10-06T12:01:00.000Z',
    updatedAt: '2026-10-06T12:01:00.000Z',
  },
];

vi.mock('@/queries/adminMessageModeration.query', () => ({
  getFlaggedConversationOptions: () => infiniteQueryOptions({
    enabled: false,
    getNextPageParam: () => 1,
    initialPageParam: 1,
    queryFn: async () => ({ data: { messages: [] }, pagination: { nextPage: null } }),
    queryKey: ['test-flagged-conversation'],
  }),
  getFlaggedMessageHistoryOptions: () => infiniteQueryOptions({
    enabled: false,
    getNextPageParam: () => null,
    initialPageParam: 1,
    queryFn: async () => ({ data: [], pagination: { nextPage: null } }),
    queryKey: ['test-flagged-message-history'],
  }),
  getFlaggedMessagesOptions: () => queryOptions({
    queryFn: async () => ({ data: flaggedMessages }),
    queryKey: ['test-flagged-messages'],
  }),
  getResolvedFlaggedConversationOptions: () => infiniteQueryOptions({
    enabled: false,
    getNextPageParam: () => null,
    initialPageParam: 1,
    queryFn: async () => ({ data: { messages: [] }, pagination: { nextPage: null } }),
    queryKey: ['test-resolved-flagged-conversation'],
  }),
  useDeleteMessageMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useDismissFlagMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe('admin direct conversation moderation', () => {
  it('shows the direct context in the list and detail while preserving listing titles', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <MessageModeration />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('A direct message needing review.')).toBeInTheDocument();
    expect(screen.getByText('Antique chair')).toBeInTheDocument();
    expect(screen.getByText('General enquiry')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Review/ })[0]);

    expect(await screen.findByRole('heading', { name: 'Conversation Review' })).toBeInTheDocument();
    expect(screen.getByText(/Conversation: General enquiry/)).toBeInTheDocument();
    expect(screen.getByText('General enquiry')).toBeInTheDocument();
  });
});
