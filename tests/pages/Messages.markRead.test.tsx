import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Messages from '@/pages/Messages';

const activeConversation = {
  id: 'conversation-1',
  buyerId: 'user-1',
  buyerFullName: 'Buyer',
  lastMessageContent: 'Unread message',
  listingTitle: 'Listing',
  sellerFullName: 'Seller',
  unreadCount: 1,
};

const unreadIncomingMessage = {
  id: 'message-1',
  conversationId: activeConversation.id,
  senderId: 'seller-1',
  content: 'Unread message',
  flagReasons: [],
  isFlagged: false,
  readAt: null,
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

const testState = { messages: [unreadIncomingMessage] };
const markConversationRead = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'user-1' } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));
vi.mock('@/hooks/useConverstion', () => ({
  getConversationMessagesOptions: (conversationId?: string) => queryOptions({
    queryFn: async () => ({ data: conversationId ? testState.messages : [] }),
    queryKey: ['test-messages', conversationId],
  }),
  getConversationsOptions: () => queryOptions({
    queryFn: async () => ({ data: [activeConversation] }),
    queryKey: ['test-conversations'],
  }),
  useMarkConversationReadMutation: () => ({ isPending: false, mutate: markConversationRead }),
  useSendMessageMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function renderMessages(initialEntry = '/messages') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Messages />} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { queryClient, ...view };
}

function setVisibilityState(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

describe('messages mark-read behavior', () => {
  beforeEach(() => {
    testState.messages = [unreadIncomingMessage];
    markConversationRead.mockReset();
    setVisibilityState('visible');
  });

  afterEach(() => {
    cleanup();
    setVisibilityState('visible');
  });

  it('marks an active conversation read after its unread incoming messages load', async () => {
    renderMessages();

    fireEvent.click(await screen.findByRole('button', { name: /Seller/ }));

    await waitFor(() => expect(markConversationRead).toHaveBeenCalled());
    expect(markConversationRead.mock.calls[0][0]).toBe(activeConversation.id);
    expect(markConversationRead).toHaveBeenCalledTimes(1);
  });

  it('does not mark read when incoming messages are already read or only the user sent messages', async () => {
    testState.messages = [
      { ...unreadIncomingMessage, content: 'Read incoming', readAt: '2026-10-20T12:01:00.000Z' },
      { ...unreadIncomingMessage, id: 'message-2', senderId: 'user-1', content: 'My message' },
    ];

    renderMessages(`/messages?conversation=${activeConversation.id}`);

    expect(await screen.findByText('My message')).toBeInTheDocument();
    expect(markConversationRead).not.toHaveBeenCalled();
  });

  it('marks unread messages when the document becomes visible again', async () => {
    setVisibilityState('hidden');
    renderMessages(`/messages?conversation=${activeConversation.id}`);

    expect(await screen.findAllByText('Unread message')).toHaveLength(2);
    expect(markConversationRead).not.toHaveBeenCalled();

    setVisibilityState('visible');
    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => expect(markConversationRead).toHaveBeenCalled());
    expect(markConversationRead.mock.calls[0][0]).toBe(activeConversation.id);
  });

  it('marks new incoming messages while open and avoids duplicate in-flight calls', async () => {
    testState.messages = [];
    const { queryClient } = renderMessages(`/messages?conversation=${activeConversation.id}`);

    expect(await screen.findByText('Start conversation')).toBeInTheDocument();
    queryClient.setQueryData(['test-messages', activeConversation.id], { data: [unreadIncomingMessage] });

    await waitFor(() => expect(markConversationRead).toHaveBeenCalled());
    queryClient.setQueryData(['test-messages', activeConversation.id], {
      data: [{ ...unreadIncomingMessage, id: 'message-2' }],
    });

    expect(markConversationRead).toHaveBeenCalledTimes(1);
    expect(markConversationRead.mock.calls[0][0]).toBe(activeConversation.id);
  });
});
