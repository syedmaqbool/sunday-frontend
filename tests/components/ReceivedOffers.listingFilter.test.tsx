import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ReceivedOffers } from '@/components/ReceivedOffers';

const { listMyReviewsMock, listReceivedOffersMock } = vi.hoisted(() => ({
  listMyReviewsMock: vi.fn(),
  listReceivedOffersMock: vi.fn(),
}));

vi.mock('@/services/offers.service', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services/offers.service')>();
  return {
    ...actual,
    listMyReviews: listMyReviewsMock,
    listReceivedOffers: listReceivedOffersMock,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seller-1' } }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/errorToast', () => ({ showErrorToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn() } }));

const firstOffer = {
  id: 'offer-1',
  buyerId: 'buyer-1',
  conversationId: null,
  listingId: 'listing-1',
  sellerId: 'seller-1',
  amount: 100,
  buyerFullName: 'Buyer One',
  counterAmount: null,
  coverImage: null,
  isPaused: false,
  listingPrice: 150,
  listingStatus: 'APPROVED',
  listingTitle: 'Vintage Lamp',
  message: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  status: 'ACCEPTED',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const secondOffer = {
  ...firstOffer,
  id: 'offer-2',
  buyerId: 'buyer-2',
  listingId: 'listing-2',
  listingTitle: 'Desk Chair',
};

function page<T>(data: T[]) {
  return { data, pagination: { nextPage: null } };
}

function renderReceivedOffers(listingId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ReceivedOffers listingId={listingId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('received offers by listing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listReceivedOffersMock.mockResolvedValue(page([firstOffer, secondOffer]));
    listMyReviewsMock.mockResolvedValue(page([]));
  });

  it('requests the selected listing and displays the API response without filtering it again', async () => {
    renderReceivedOffers('listing-1');

    expect(await screen.findByText('Vintage Lamp')).toBeInTheDocument();
    expect(screen.getByText('Desk Chair')).toBeInTheDocument();
    expect(listReceivedOffersMock).toHaveBeenCalledWith({
      page: 1,
      size: 100,
      listingId: 'listing-1',
      sort: 'newest',
    });
  });

  it('requests all received offers without a listing filter', async () => {
    renderReceivedOffers();

    expect(await screen.findByText('Vintage Lamp')).toBeInTheDocument();
    expect(screen.getByText('Desk Chair')).toBeInTheDocument();
    expect(listReceivedOffersMock).toHaveBeenCalledWith({ page: 1, size: 100, sort: 'newest' });
  });
});
