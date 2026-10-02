import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ReceivedOffers } from '@/components/ReceivedOffers';

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return { ...actual, useQuery: useQueryMock };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seller-1' } }),
}));

vi.mock('@/queries/offers.query', () => ({
  getMyReviewedOfferIdsOptions: () => ({ queryKey: ['offers', 'reviewed-ids'] }),
  getReceivedOfferSelectionOptions: () => ({ queryKey: ['offers', 'selection'] }),
  getReceivedOffersOptions: () => ({ queryKey: ['offers', 'received'] }),
  useRespondToOfferMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

const receivedOffer = {
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
  listingStatus: 'APPROVED',
  listingTitle: 'Test listing',
  message: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function LocationOutput() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function ReceivedOffersRoute() {
  const [searchParams] = useSearchParams();
  return (
    <>
      <ReceivedOffers selectedOfferId={searchParams.get('offer')} />
      <LocationOutput />
    </>
  );
}

function renderOffers(initialEntry: string, offers: typeof receivedOffer[]) {
  useQueryMock.mockImplementation((options: any) => ({
    data: options.queryKey.includes('received') ? { data: offers } : { data: [] },
    isLoading: false,
  }) as any);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={<ReceivedOffersRoute />}
            path="/my-listings"
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('received offer notification selection', () => {
  it('selects the received offer from the URL', async () => {
    renderOffers('/my-listings?tab=offers&offer=offer-1', [receivedOffer]);

    expect(await screen.findByTestId('selected-offer')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/my-listings?tab=offers&offer=offer-1');
  });

  it('falls back to the received offers list when the offer no longer exists', async () => {
    renderOffers('/my-listings?tab=offers&offer=missing-offer', []);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-listings?tab=offers'));
    expect(screen.queryByTestId('selected-offer')).not.toBeInTheDocument();
    expect(await screen.findByText('No offers received yet')).toBeInTheDocument();
  });
});
