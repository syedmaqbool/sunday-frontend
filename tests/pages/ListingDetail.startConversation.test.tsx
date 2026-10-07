import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingDetail from '@/pages/ListingDetail';

const { listingState, userState, startConversationMutation, showErrorToastMock } = vi.hoisted(() => ({
  listingState: { listing: undefined as any },
  userState: { user: { id: 'buyer-1' } as { id: string } | null },
  startConversationMutation: {
    isPending: false,
    mutate: vi.fn(),
  },
  showErrorToastMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: userState.user }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => [],
  getMarketplaceListingOptions: () => ({
    queryFn: async () => listingState.listing,
    queryKey: ['marketplace', 'listing', 'detail', 'listing-1', 'start-conversation'],
  }),
  getReservedOfferAmountOptions: () => ({ enabled: false, queryFn: async () => null, queryKey: ['reserved-offer-amount'] }),
}));
vi.mock('@/queries/myListings.query', () => ({
  useCancelMyListingReservationMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteMyListingMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/queries/conversation.query', () => ({
  useStartConversationMutation: () => startConversationMutation,
}));
vi.mock('@/components/MakeOfferButton', () => ({ MakeOfferButton: () => <button>Make Offer</button> }));
vi.mock('@/components/MarketplaceNotices', () => ({ ListingDetailsNotice: () => null, SoldListingNotice: () => null }));
vi.mock('@/components/MyListingFeedbackWidgets', () => ({ MyListingFeedbackSection: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ReportDialog', () => ({ ReportDialog: () => null }));
vi.mock('@/components/ReviewsList', () => ({ ReviewsList: () => null }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/errorToast', () => ({ showErrorToast: showErrorToastMock }));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderListingDetail() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/listing/listing-1']}>
        <LocationObserver />
        <Routes>
          <Route element={<ListingDetail />} path="/listing/:id" />
          <Route element={<main>Sign in</main>} path="/auth" />
          <Route element={<main>Messages</main>} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  userState.user = { id: 'buyer-1' };
  startConversationMutation.isPending = false;
  startConversationMutation.mutate.mockReset();
  showErrorToastMock.mockReset();
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: null,
    sellerId: 'seller-1',
    brand: 'Vintage',
    categoryValue: 'clothing',
    condition: 'USED_GOOD',
    coverImageUrl: null,
    description: 'A vintage jacket.',
    imageUrls: [],
    media: [],
    price: 150,
    reservedForCurrentUser: false,
    reservedUntil: null,
    seller: { fullName: 'Seller' },
    size: 'M',
    status: 'APPROVED',
    title: 'Vintage jacket',
    weight: null,
  };
});

describe('start a conversation from listing detail', () => {
  it.each(['APPROVED', 'RESERVED'])('lets a buyer message a %s listing seller', async (status) => {
    listingState.listing.status = status;
    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Message seller' })).toBeInTheDocument();
    if (status === 'APPROVED') {
      expect(screen.getByRole('button', { name: 'Make Offer' })).toBeInTheDocument();
    }
  });

  it.each(['PENDING', 'NEEDS_REVISION', 'REJECTED', 'SOLD'])('hides messaging for a %s listing', async (status) => {
    listingState.listing.status = status;
    renderListingDetail();

    await screen.findByText('Vintage jacket');
    expect(screen.queryByRole('button', { name: 'Message seller' })).not.toBeInTheDocument();
  });

  it('hides messaging from the listing owner', async () => {
    userState.user = { id: 'seller-1' };
    renderListingDetail();

    await screen.findByText('Vintage jacket');
    expect(screen.queryByRole('button', { name: 'Message seller' })).not.toBeInTheDocument();
  });

  it('returns a signed-out visitor to this listing after sign in', async () => {
    userState.user = null;
    renderListingDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    await screen.findByText('Sign in');
    expect(screen.getByTestId('location')).toHaveTextContent('/auth?returnTo=%2Flisting%2Flisting-1');
  });

  it('sends a non-empty first message and opens the returned conversation', async () => {
    startConversationMutation.mutate.mockImplementation((_input, callbacks) => {
      callbacks.onSuccess({ data: { id: 'conversation-42' } });
    });
    renderListingDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
    expect(startConversationMutation.mutate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: 'Is this still available?' } });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(startConversationMutation.mutate).toHaveBeenCalledWith(
      { listingId: 'listing-1', content: 'Is this still available?' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    ));
    expect(await screen.findByText('Messages')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/messages?conversation=conversation-42');
  });

  it('keeps the composer open and reports a failed send', async () => {
    startConversationMutation.mutate.mockImplementation((_input, callbacks) => {
      callbacks.onError(new Error('Request failed'));
    });
    renderListingDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: 'Is this still available?' } });
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(startConversationMutation.mutate).toHaveBeenCalled());
    expect(await screen.findByRole('textbox', { name: 'Your message' })).toHaveValue('Is this still available?');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
    expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), 'Failed to send message');
  });

  it('disables sending while the first message is pending', async () => {
    startConversationMutation.isPending = true;
    renderListingDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Message seller' }));
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });
});
