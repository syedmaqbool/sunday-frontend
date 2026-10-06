import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyOffers from '@/pages/MyOffers';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import { myListingsQueryKey } from '@/queries/myListings.query';

const { serviceMocks } = vi.hoisted(() => ({
  serviceMocks: {
    listMyOffers: vi.fn(),
    listMyReviews: vi.fn(),
    listOrders: vi.fn(),
    marketplaceFetch: vi.fn(),
    myListingsFetch: vi.fn(),
    offer: undefined as any,
    withdrawOffer: vi.fn(),
  },
}));

vi.mock('@/services/offers.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/offers.service')>();
  return {
    ...actual,
    listMyOffers: serviceMocks.listMyOffers,
    listMyReviews: serviceMocks.listMyReviews,
    withdrawOffer: serviceMocks.withdrawOffer,
  };
});

vi.mock('@/services/myOrders.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/myOrders.service')>();
  return { ...actual, listOrders: serviceMocks.listOrders };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'buyer-1' } }),
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ReviewForm', () => ({ ReviewForm: () => null }));

const reservationDeadline = '2026-10-06T18:30:00.000Z';

function makePaginatedResponse(data: any[]) {
  return {
    data,
    message: 'ok',
    pagination: {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      perPage: 100,
      prevPage: null,
      total: data.length,
    },
    statusCode: 200,
  };
}

function QueryRefreshObservers() {
  useQuery({
    queryFn: serviceMocks.marketplaceFetch,
    queryKey: marketplaceQueryKey.listings(),
  });
  useQuery({
    queryFn: serviceMocks.myListingsFetch,
    queryKey: myListingsQueryKey.list(),
  });
  return null;
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/my-offers']}>
        <Routes>
          <Route
            element={(
              <>
                <MyOffers />
                <QueryRefreshObservers />
              </>
            )}
            path="/my-offers"
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  serviceMocks.offer = {
    id: 'offer-1',
    buyerId: 'buyer-1',
    conversationId: null,
    listingId: 'listing-1',
    sellerId: 'seller-1',
    amount: 100,
    buyerFullName: 'Buyer',
    counterAmount: null,
    coverImage: null,
    listingPrice: 150,
    listingStatus: 'RESERVED',
    listingTitle: 'Vintage jacket',
    message: null,
    reservedUntil: reservationDeadline,
    sellerFullName: 'Seller',
    status: 'ACCEPTED',
    createdAt: '2026-10-05T18:30:00.000Z',
    updatedAt: '2026-10-05T18:30:00.000Z',
  };
  serviceMocks.listMyOffers.mockReset().mockImplementation(async () => makePaginatedResponse([serviceMocks.offer]));
  serviceMocks.listMyReviews.mockReset().mockImplementation(async () => makePaginatedResponse([]));
  serviceMocks.listOrders.mockReset().mockImplementation(async () => makePaginatedResponse([]));
  serviceMocks.withdrawOffer.mockReset();
  serviceMocks.marketplaceFetch.mockReset().mockResolvedValue([]);
  serviceMocks.myListingsFetch.mockReset().mockResolvedValue(makePaginatedResponse([]));
});

describe('accepted offer payment window', () => {
  it('shows the deadline returned with the accepted offer reservation', async () => {
    renderPage();

    expect(await screen.findByText(/payment deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('datetime', reservationDeadline);
  });

  it('asks the buyer to confirm before cancelling an accepted offer', async () => {
    serviceMocks.withdrawOffer.mockResolvedValue({
      data: { ...serviceMocks.offer, reservedUntil: null, status: 'EXPIRED' },
      message: 'Offer cancelled',
      statusCode: 200,
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel offer' }));

    expect(await screen.findByRole('heading', { name: 'Cancel accepted offer?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));

    await waitFor(() => expect(serviceMocks.withdrawOffer).toHaveBeenCalledWith('offer-1'));
  });

  it('refreshes buyer offers and listing queries after cancellation succeeds', async () => {
    serviceMocks.withdrawOffer.mockImplementation(async () => {
      serviceMocks.offer = { ...serviceMocks.offer, reservedUntil: null, status: 'EXPIRED' };
      return { data: serviceMocks.offer, message: 'Offer cancelled', statusCode: 200 };
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel offer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm cancellation' }));

    expect(await screen.findByText('Expired')).toBeInTheDocument();
    await waitFor(() => {
      expect(serviceMocks.listMyOffers).toHaveBeenCalledTimes(2);
      expect(serviceMocks.marketplaceFetch).toHaveBeenCalledTimes(2);
      expect(serviceMocks.myListingsFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('keeps the confirmation open and offer accepted when cancellation fails', async () => {
    serviceMocks.withdrawOffer.mockRejectedValue(new Error('Reservation has already changed'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel offer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm cancellation' }));

    expect(await screen.findByRole('heading', { name: 'Cancel accepted offer?' })).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('hides buyer cancellation after checkout created an active order', async () => {
    serviceMocks.listOrders.mockResolvedValue(makePaginatedResponse([{
      id: 'order-1',
      items: [{
        offerId: 'offer-1',
        status: 'AWAITING_PAYMENT',
      }],
      status: 'AWAITING_PAYMENT',
    }]));

    renderPage();

    expect(await screen.findByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel offer' })).not.toBeInTheDocument();
  });

  it('hides buyer cancellation after the reservation deadline', async () => {
    serviceMocks.offer = { ...serviceMocks.offer, reservedUntil: '2000-01-01T00:00:00.000Z' };

    renderPage();

    expect(await screen.findByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel offer' })).not.toBeInTheDocument();
  });
});
