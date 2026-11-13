import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ListingDetail from '@/pages/ListingDetail';

const { listingState, authState } = vi.hoisted(() => ({
  listingState: { listing: undefined as any },
  authState: { user: null as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => [],
  getMarketplaceListingOptions: vi.fn(() => ({
    queryFn: async () => listingState.listing,
    queryKey: ['marketplace', 'listing', 'detail', 'listing-1', 'sold-pricing'],
  })),
}));
vi.mock('@/services/commission.service', () => ({
  listPublicCommissionTiers: vi.fn(() => new Promise(() => {})),
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

const SELLER_ID = 'seller-1';
const viewers = [
  { name: 'owner', user: { id: SELLER_ID } },
  { name: 'signed-in non-owner', user: { id: 'buyer-1' } },
  { name: 'anonymous', user: null },
];

function renderListingDetail() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/listing/listing-1']}>
        <Routes>
          <Route element={<ListingDetail />} path="/listing/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  authState.user = null;
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: null,
    reservedOffer: null,
    sellerId: SELLER_ID,
    brand: 'Vintage',
    buyerProtectionFee: { rate: 12, amount: 480 },
    buyerTotalPrice: 4480,
    categoryValue: 'clothing',
    condition: 'USED_GOOD',
    coverImageUrl: null,
    description: 'A vintage jacket.',
    imageUrls: [],
    media: [],
    price: 4000,
    reservedForCurrentUser: false,
    reservedUntil: null,
    seller: { fullName: 'Seller' },
    size: 'M',
    status: 'SOLD',
    title: 'Vintage jacket',
    weight: null,
  };
});

describe('sold listing pricing on listing detail', () => {
  it.each(viewers)(
    'shows only the listed price and no fee or buyer total for $name',
    async ({ user }) => {
      authState.user = user;
      renderListingDetail();

      expect(await screen.findByText('Rs 4,000')).toBeInTheDocument();
      expect(screen.queryByText('Including Platform Fee')).not.toBeInTheDocument();
      expect(screen.queryByText('Item price')).not.toBeInTheDocument();
      expect(screen.queryByText(/Platform fee \(/)).not.toBeInTheDocument();
      expect(screen.queryByText('Rs 4,480')).not.toBeInTheDocument();
      expect(screen.queryByText('Rs 480')).not.toBeInTheDocument();
    },
  );

  it('hides the buyer total and breakdown even when a sold listing carries an accepted offer', async () => {
    listingState.listing.reservedOfferId = 'offer-1';
    listingState.listing.reservedOffer = {
      amount: 3500,
      buyerProtectionFee: { rate: 12, amount: 420 },
      buyerTotalPrice: 3920,
    };
    renderListingDetail();

    expect(await screen.findByText('Rs 4,000')).toBeInTheDocument();
    expect(screen.queryByText('Rs 3,920')).not.toBeInTheDocument();
    expect(screen.queryByText('Rs 4,480')).not.toBeInTheDocument();
    expect(screen.queryByText('Including Platform Fee')).not.toBeInTheDocument();
    expect(screen.queryByText('Offer amount')).not.toBeInTheDocument();
    expect(screen.queryByText('Your accepted offer')).not.toBeInTheDocument();
  });
});

describe('available and reserved pricing on listing detail is unchanged', () => {
  it.each(viewers)(
    'shows the buyer total and fee breakdown for an APPROVED listing for $name',
    async ({ user }) => {
      authState.user = user;
      listingState.listing.status = 'APPROVED';
      renderListingDetail();

      expect(await screen.findByText('Rs 4,480')).toBeInTheDocument();
      expect(screen.getByText('Including Platform Fee')).toBeInTheDocument();
      expect(screen.getByText('Item price')).toBeInTheDocument();
      expect(screen.getByText('Platform fee (12%)')).toBeInTheDocument();
      expect(screen.getByText('Rs 4,000')).toBeInTheDocument();
      expect(screen.getByText('Rs 480')).toBeInTheDocument();
    },
  );

  it.each(viewers)(
    'shows the buyer total and fee breakdown for a RESERVED listing for $name',
    async ({ user }) => {
      authState.user = user;
      listingState.listing.status = 'RESERVED';
      renderListingDetail();

      expect(await screen.findByText('Rs 4,480')).toBeInTheDocument();
      expect(screen.getByText('Including Platform Fee')).toBeInTheDocument();
      expect(screen.getByText('Item price')).toBeInTheDocument();
      expect(screen.getByText('Platform fee (12%)')).toBeInTheDocument();
      expect(screen.getByText('Rs 4,000')).toBeInTheDocument();
      expect(screen.getByText('Rs 480')).toBeInTheDocument();
    },
  );
});
