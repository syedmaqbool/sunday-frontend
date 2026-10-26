import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HTTPError } from 'ky';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import SellerProfile from '@/pages/SellerProfile';

const { profileState, startConversationMutation, toastMock, userState } = vi.hoisted(() => ({
  profileState: { canReceiveMessages: true },
  startConversationMutation: { isPending: false, mutate: vi.fn() },
  toastMock: vi.fn(),
  userState: { user: { id: 'buyer-1' } as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: userState.user }) }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ListingCard', () => ({ default: () => null }));
vi.mock('@/components/ReviewsList', () => ({ ReviewsList: () => null }));
vi.mock('@/queries/marketplace.query', () => ({
  getSellerListingsOptions: () =>
    queryOptions({ queryFn: async () => [], queryKey: ['seller-listings'] }),
  getSellerProfileOptions: () =>
    queryOptions({
      queryFn: async () => ({
        id: 'seller-1',
        userId: 'seller-1',
        avatarUrl: null,
        bio: '',
        canReceiveMessages: profileState.canReceiveMessages,
        fullName: 'Seller',
        image: null,
        location: '',
        phone: '',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      queryKey: ['seller-profile'],
    }),
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingOptions: () =>
    queryOptions({ queryFn: async () => null, queryKey: ['seller-rating'] }),
}));
vi.mock('@/queries/review.query', () => ({
  getUserReviewsOptions: () =>
    queryOptions({ queryFn: async () => ({ data: [] }), queryKey: ['seller-reviews'] }),
}));
vi.mock('@/queries/conversation.query', () => ({
  useStartConversationMutation: () => startConversationMutation,
}));
vi.mock('@/lib/errorToast', () => ({ showErrorToast: toastMock }));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderSellerProfile(initialEntry = '/seller/seller-1') {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationObserver />
        <Routes>
          <Route element={<SellerProfile />} path="/seller/:id" />
          <Route element={<main>Sign in</main>} path="/auth" />
          <Route element={<main>Messages</main>} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  profileState.canReceiveMessages = true;
  userState.user = { id: 'buyer-1' };
  startConversationMutation.isPending = false;
  startConversationMutation.mutate.mockReset();
  toastMock.mockReset();
});

describe('message a seller from their profile', () => {
  it('shows a message button for another active user', async () => {
    renderSellerProfile();

    expect(await screen.findByRole('button', { name: 'Message seller' })).toBeInTheDocument();
  });

  it('hides messaging when the seller is inactive or the viewer owns the profile', async () => {
    profileState.canReceiveMessages = false;
    const inactiveView = renderSellerProfile();
    await screen.findByText('Seller');
    expect(screen.queryByRole('button', { name: 'Message seller' })).not.toBeInTheDocument();
    inactiveView.unmount();

    profileState.canReceiveMessages = true;
    userState.user = { id: 'seller-1' };
    renderSellerProfile();
    await screen.findByText('Seller');
    expect(screen.queryByRole('button', { name: 'Message seller' })).not.toBeInTheDocument();
  });

  it('returns signed-out visitors to the profile after signing in', async () => {
    userState.user = null;
    renderSellerProfile('/seller/seller-1?tab=reviews');

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));

    expect(await screen.findByText('Sign in')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/auth?returnTo=%2Fseller%2Fseller-1%3Ftab%3Dreviews',
    );
  });

  it('sends a trimmed direct message and opens the returned conversation', async () => {
    startConversationMutation.mutate.mockImplementation((_input, callbacks) => {
      callbacks.onSuccess({ data: { id: 'conversation-42' } });
    });
    renderSellerProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    const messageInput = screen.getByRole('textbox', { name: 'Your message' });
    fireEvent.change(messageInput, { target: { value: '  Hello seller  ' } });
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(startConversationMutation.mutate).toHaveBeenCalledWith(
        { recipientUserId: 'seller-1', content: 'Hello seller' },
        expect.objectContaining({ onError: expect.any(Function), onSuccess: expect.any(Function) }),
      ),
    );
    expect(await screen.findByText('Messages')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/messages?conversation=conversation-42',
    );
  });

  it('keeps the draft after the daily new-conversation limit is reached', async () => {
    startConversationMutation.mutate.mockImplementation((_input, callbacks) => {
      const error = Object.assign(
        new HTTPError(
          new Response('{}', { status: 429 }),
          new Request('http://localhost/api/v1/me/conversations'),
          {} as never,
        ),
        { code: 'APP_CONVERSATION_DAILY_LIMIT_REACHED' },
      );
      callbacks.onError(error);
    });
    renderSellerProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), {
      target: { value: 'I have a question' },
    });
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    expect(await screen.findByRole('textbox', { name: 'Your message' })).toHaveValue(
      'I have a question',
    );
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You've reached today's limit for new conversations. Try again tomorrow.",
      }),
      'Failed to send message',
    );
  });

  it('does not allow blank or overlong messages to be sent', async () => {
    renderSellerProfile();
    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    const messageInput = screen.getByRole('textbox', { name: 'Your message' });
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    expect(sendButton).toBeDisabled();
    fireEvent.change(messageInput, { target: { value: ' '.repeat(3) } });
    expect(sendButton).toBeDisabled();
    fireEvent.change(messageInput, { target: { value: 'x'.repeat(2001) } });
    expect(sendButton).toBeDisabled();
    expect(startConversationMutation.mutate).not.toHaveBeenCalled();
  });

  it('disables sending while the first message is pending', async () => {
    startConversationMutation.isPending = true;
    renderSellerProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });
});
