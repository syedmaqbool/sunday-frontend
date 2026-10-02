import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Messages from '@/pages/Messages';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'user-1' } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));
vi.mock('@/hooks/useConverstion', () => ({
  getConversationMessagesOptions: () => queryOptions({
    queryFn: async () => ({ data: [] }),
    queryKey: ['test-messages'],
  }),
  getConversationsOptions: () => queryOptions({
    queryFn: async () => ({ data: [{
      id: 'conversation-1',
      buyerId: 'user-1',
      buyerFullName: 'Buyer',
      lastMessageContent: 'Hello',
      listingTitle: 'Listing',
      sellerFullName: 'Seller',
      unreadCount: 0,
    }] }),
    queryKey: ['test-conversations'],
  }),
  useSendMessageMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('messages notification routing', () => {
  it('drops a missing focused message while keeping its conversation selected', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={['/messages?conversation=conversation-1&message=missing-message']}>
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

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/messages?conversation=conversation-1'));
    expect(screen.getAllByText('Seller')).toHaveLength(2);
  });
});
