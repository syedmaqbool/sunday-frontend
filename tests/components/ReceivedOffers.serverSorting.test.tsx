import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
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

const earlierOffer = {
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
  listingTitle: 'Earlier listing',
  message: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  status: 'ACCEPTED',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const laterOffer = {
  ...earlierOffer,
  id: 'offer-2',
  buyerId: 'buyer-2',
  amount: 200,
  listingTitle: 'Later listing',
  createdAt: '2026-02-01T00:00:00.000Z',
};

function page<T>(data: T[]) {
  return { data, pagination: { nextPage: null } };
}

function ReceivedOffersFromUrl({ listingId }: { listingId?: string }) {
  const [searchParams] = useSearchParams();

  return <ReceivedOffers listingId={listingId} selectedOfferId={searchParams.get('offer')} />;
}

function renderReceivedOffers(listingId?: string, initialEntry = '/my-listings') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ReceivedOffersFromUrl listingId={listingId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('received offers server sorting', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listReceivedOffersMock.mockResolvedValue(page([earlierOffer, laterOffer]));
    listMyReviewsMock.mockResolvedValue(page([]));
  });

  it('requests newest-first and keeps the response order', async () => {
    renderReceivedOffers();

    expect(await screen.findByText('Earlier listing')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent),
    ).toEqual(['Earlier listing', 'Later listing']);
    expect(listReceivedOffersMock).toHaveBeenCalledWith({
      page: 1,
      size: 100,
      sort: 'newest',
    });
  });

  it('requests highest-price-first for a listing and keeps the response order', async () => {
    renderReceivedOffers('listing-1');

    expect(await screen.findByText('Earlier listing')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Newest First' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Highest to Lowest Price' }));

    await waitFor(() => {
      expect(listReceivedOffersMock).toHaveBeenLastCalledWith({
        page: 1,
        size: 100,
        listingId: 'listing-1',
        sort: 'price_desc',
      });
    });
    expect(await screen.findByText('Earlier listing')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent),
    ).toEqual(['Earlier listing', 'Later listing']);
  });

  it('loads a URL-selected offer outside the first page', async () => {
    const selectedOffer = {
      ...laterOffer,
      id: 'offer-outside-first-page',
      listingTitle: 'Offer outside the first page',
    };
    listReceivedOffersMock.mockImplementation(
      async (parameters: { page?: number; sort?: string }) => {
        if (parameters.sort) return page([earlierOffer]);
        return parameters.page === 1
          ? { ...page([earlierOffer]), pagination: { nextPage: 2 } }
          : page([selectedOffer]);
      },
    );
    renderReceivedOffers(undefined, '/my-listings?tab=offers&offer=offer-outside-first-page');

    expect(await screen.findByTestId('selected-offer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Offer outside the first page' }),
    ).toBeInTheDocument();
  });
});
