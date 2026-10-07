import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Messages from '@/pages/Messages';

const offerlessConversation = {
  id: 'conversation-offerless',
  buyerId: 'user-1',
  listingId: 'listing-1',
  offerId: null,
  sellerId: 'seller-1',
  amount: null,
  buyerFullName: 'Buyer',
  counterAmount: null,
  lastMessageContent: 'Is this still available?',
  listingStatus: 'APPROVED' as const,
  listingTitle: 'Vintage lamp',
  offerStatus: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  unreadCount: 2,
  lastMessageCreatedAt: '2026-10-07T12:00:00.000Z',
  createdAt: '2026-10-07T12:00:00.000Z',
  updatedAt: '2026-10-07T12:00:00.000Z',
};

const deletedListingConversation = {
  ...offerlessConversation,
  id: 'conversation-deleted-listing',
  listingId: null,
  lastMessageContent: 'Thanks for the details.',
  listingStatus: null,
  listingTitle: 'Saved listing title',
  unreadCount: 0,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'user-1' } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));
vi.mock('@/hooks/useConverstion', () => ({
  getConversationMessagesOptions: (conversationId?: string) => queryOptions({
    queryFn: async () => ({
      data: conversationId === deletedListingConversation.id
        ? [{
            id: 'message-deleted-listing',
            conversationId,
            senderId: 'seller-1',
            content: 'The item sold, but here are the details you asked for.',
            flagReasons: [],
            isFlagged: false,
            readAt: null,
            createdAt: '2026-10-07T12:01:00.000Z',
            updatedAt: '2026-10-07T12:01:00.000Z',
          }]
        : [],
    }),
    queryKey: ['test-messages', conversationId],
  }),
  getConversationsOptions: () => queryOptions({
    queryFn: async () => ({ data: [offerlessConversation, deletedListingConversation] }),
    queryKey: ['test-conversations'],
  }),
  useSendMessageMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('offerless conversations in Messages', () => {
  it('shows offerless and deleted-listing conversations and opens the saved thread', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={['/messages']}>
          <Routes>
            <Route
              element={(
                <>
                  <Messages />
                  <LocationObserver />
                </>
              )}
              path="/messages"
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Is this still available?')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('Vintage lamp')).toHaveLength(1);
    expect(screen.getByText('Thanks for the details.')).toBeInTheDocument();
    expect(screen.getByText('Saved listing title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Seller Saved listing title Thanks for the details/ }));

    expect(await screen.findByText('The item sold, but here are the details you asked for.')).toBeInTheDocument();
    expect(screen.getAllByText('Saved listing title')).toHaveLength(2);
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/messages?conversation=conversation-deleted-listing');
    });
  });
});
