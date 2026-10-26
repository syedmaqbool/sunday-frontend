import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Messages from '@/pages/Messages';

const { auth } = vi.hoisted(() => ({ auth: { userId: 'buyer-1' } }));

const buyerDirectConversation = {
  id: 'direct-as-buyer',
  buyerId: 'buyer-1',
  listingId: null,
  offerId: null,
  sellerId: 'seller-1',
  amount: null,
  buyerFullName: 'Buyer Person',
  counterAmount: null,
  lastMessageContent: 'Hello',
  listingStatus: null,
  listingTitle: null,
  offerStatus: null,
  reservedUntil: null,
  sellerFullName: 'Seller Person',
  type: 'DIRECT' as const,
  unreadCount: 0,
  lastMessageCreatedAt: '2026-10-20T12:00:00.000Z',
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

const listingConversation = {
  ...buyerDirectConversation,
  id: 'listing-conversation',
  listingId: 'listing-1',
  listingTitle: 'Vintage lamp',
  type: 'LISTING' as const,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: auth.userId } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));
vi.mock('@/hooks/useConverstion', () => ({
  getConversationMessagesOptions: (conversationId?: string) =>
    queryOptions({
      queryFn: async () => ({ data: [] }),
      queryKey: ['test-messages', conversationId],
    }),
  getConversationsOptions: () =>
    queryOptions({
      queryFn: async () => ({ data: [buyerDirectConversation, listingConversation] }),
      queryKey: ['test-conversations'],
    }),
  useMarkConversationReadMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useSendMessageMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function renderMessages(conversationId: string) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[`/messages?conversation=${conversationId}`]}
      >
        <Routes>
          <Route element={<Messages />} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('direct conversation profile links in Messages', () => {
  beforeEach(() => {
    auth.userId = 'buyer-1';
  });

  it('links the seller name to their profile when the signed-in user is the buyer', async () => {
    renderMessages(buyerDirectConversation.id);

    expect(await screen.findByRole('link', { name: 'Seller Person' })).toHaveAttribute(
      'href',
      '/seller/seller-1',
    );
  });

  it('links the buyer name to their profile when the signed-in user is the seller', async () => {
    auth.userId = 'seller-1';
    renderMessages(buyerDirectConversation.id);

    expect(await screen.findByRole('link', { name: 'Buyer Person' })).toHaveAttribute(
      'href',
      '/seller/buyer-1',
    );
  });

  it('keeps the listing conversation header name as plain text', async () => {
    renderMessages(listingConversation.id);

    expect(await screen.findAllByText('Seller Person')).not.toHaveLength(0);
    expect(screen.queryByRole('link', { name: 'Seller Person' })).not.toBeInTheDocument();
  });
});
