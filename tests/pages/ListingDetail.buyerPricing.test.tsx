import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ListingDetail from '@/pages/ListingDetail';

const { listingState, listPublicCommissionTiersMock } = vi.hoisted(() => ({
  listingState: { listing: undefined as any },
  listPublicCommissionTiersMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => [],
  getMarketplaceListingOptions: () => ({
    queryFn: async () => listingState.listing,
    queryKey: ['marketplace', 'listing', 'detail', 'listing-1', 'buyer-pricing'],
  }),
  getReservedOfferAmountOptions: () => ({
    enabled: false,
    queryFn: async () => null,
    queryKey: ['reserved-offer-amount'],
  }),
}));
vi.mock('@/services/commission.service', () => ({
  listPublicCommissionTiers: listPublicCommissionTiersMock,
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
  listPublicCommissionTiersMock.mockImplementation(() => new Promise(() => {}));
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: null,
    sellerId: 'seller-1',
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
    status: 'APPROVED',
    title: 'Vintage jacket',
    weight: null,
  };
});

describe('buyer pricing on listing detail', () => {
  it('shows backend buyer pricing as soon as the listing loads', async () => {
    renderListingDetail();

    expect(await screen.findByText('Rs 4,480')).toBeInTheDocument();
    expect(screen.getByText('Including Buyer Protection')).toBeInTheDocument();
    expect(screen.getByText('Item price')).toBeInTheDocument();
    expect(screen.getByText('Buyer protection fee (12%)')).toBeInTheDocument();
    expect(screen.getByText('Rs 4,000')).toBeInTheDocument();
    expect(screen.getByText('Rs 480')).toBeInTheDocument();
    expect(listPublicCommissionTiersMock).not.toHaveBeenCalled();
  });

  it('shows the total and a zero-fee breakdown when buyer protection is zero', async () => {
    listingState.listing.buyerProtectionFee = { rate: 0, amount: 0 };
    listingState.listing.buyerTotalPrice = listingState.listing.price;

    renderListingDetail();

    expect(await screen.findAllByText('Rs 4,000')).toHaveLength(2);
    expect(screen.getByText('Including Buyer Protection')).toBeInTheDocument();
    expect(screen.getByText('Buyer protection fee (0%)')).toBeInTheDocument();
    expect(screen.getByText('Rs 0')).toBeInTheDocument();
    expect(listPublicCommissionTiersMock).not.toHaveBeenCalled();
  });
});
