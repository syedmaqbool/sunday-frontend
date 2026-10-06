import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingDetail from '@/pages/ListingDetail';

const { addItemMock, listingState, userState } = vi.hoisted(() => ({
  addItemMock: vi.fn(),
  listingState: { listing: undefined as any },
  userState: { user: { id: 'buyer-1' } as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: userState.user }),
}));

vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: addItemMock, items: [] }),
}));

vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => [],
  getMarketplaceListingOptions: () => ({
    queryFn: async () => listingState.listing,
    queryKey: ['marketplace', 'listing', 'detail', 'listing-1', 'auth'],
  }),
  getReservedOfferAmountOptions: () => ({
    enabled: true,
    queryFn: async () => 100,
    queryKey: ['marketplace', 'reserved-offer-amount', 'detail', 'offer-1'],
  }),
}));

vi.mock('@/queries/myListings.query', () => ({
  useCancelMyListingReservationMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteMyListingMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock('@/components/MakeOfferButton', () => ({ MakeOfferButton: () => null }));
vi.mock('@/components/MarketplaceNotices', () => ({
  ListingDetailsNotice: () => null,
  SoldListingNotice: () => null,
}));
vi.mock('@/components/MyListingFeedbackWidgets', () => ({ MyListingFeedbackSection: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ReportDialog', () => ({ ReportDialog: () => null }));
vi.mock('@/components/ReviewsList', () => ({ ReviewsList: () => null }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

function renderListingDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/listing/listing-1']}>
        <Routes>
          <Route element={<ListingDetail />} path="/listing/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  addItemMock.mockReset();
  userState.user = { id: 'buyer-1' };
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: 'offer-1',
    sellerId: 'seller-1',
    brand: 'Vintage',
    categoryValue: 'clothing',
    condition: 'USED_GOOD',
    coverImageUrl: null,
    description: 'A vintage jacket.',
    imageUrls: [],
    media: [],
    price: 150,
    reservedForCurrentUser: true,
    reservedUntil: '2000-01-01T00:00:00.000Z',
    seller: { fullName: 'Seller' },
    size: 'M',
    status: 'RESERVED',
    title: 'Vintage jacket',
    weight: null,
  };
});

describe('accepted offer deadline on listing detail', () => {
  it('shows the buyer that submitted proof is awaiting review when there is no deadline', async () => {
    listingState.listing.reservedUntil = null;

    renderListingDetail();

    expect(await screen.findByText(/your payment proof is awaiting admin review/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment deadline has passed/i)).not.toBeInTheDocument();
  });

  it('shows the owner that submitted proof is awaiting review and hides reservation cancellation', async () => {
    userState.user = { id: 'seller-1' };
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = null;

    renderListingDetail();

    expect(await screen.findByText(/the buyer's payment proof is awaiting admin review/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel reservation' })).not.toBeInTheDocument();
  });

  it('keeps seller reservation cancellation available during a timed initial window', async () => {
    userState.user = { id: 'seller-1' };
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = '2099-01-01T00:00:00.000Z';

    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
  });

  it('blocks adding an accepted offer to checkout after its deadline', async () => {
    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Payment Window Closed' })).toBeDisabled();
    expect(screen.getByText(/payment deadline has passed/i)).toBeInTheDocument();
    expect(addItemMock).not.toHaveBeenCalled();
  });
});
