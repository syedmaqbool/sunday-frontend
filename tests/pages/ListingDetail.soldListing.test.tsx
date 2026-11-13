import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ListingDetail from '@/pages/ListingDetail';

const { listingState, userState } = vi.hoisted(() => ({
  listingState: { listing: undefined as any },
  userState: { user: null as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: userState.user }) }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => ['https://cdn.example.com/jacket-1.jpg'],
  getMarketplaceListingOptions: () => ({
    queryFn: async () => listingState.listing,
    queryKey: ['marketplace', 'listing', 'detail', 'listing-1', 'sold-listing'],
  }),
}));
vi.mock('@/queries/myListings.query', () => ({
  useCancelMyListingReservationMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteMyListingMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/components/MakeOfferButton', () => ({
  MakeOfferButton: () => <button>Make Offer</button>,
}));
vi.mock('@/components/MessageSellerButton', () => ({
  MessageSellerButton: () => <button>Message seller</button>,
}));
vi.mock('@/components/MyListingFeedbackWidgets', () => ({
  MyListingFeedbackSection: () => <section>Listing feedback</section>,
}));
vi.mock('@/components/ReportDialog', () => ({
  ReportDialog: ({ label }: { label: string }) => <button>{label}</button>,
}));
vi.mock('@/components/ReviewsList', () => ({ ReviewsList: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

const SELLER_ID = 'seller-1';
const OTHER_USER = { id: 'buyer-1' };

const ACTION_BUTTON_NAMES = [
  'Edit Listing',
  'Delete',
  'Cancel reservation',
  'Add to Cart',
  'Complete Purchase',
  'Make Offer',
  'Message seller',
  'Report listing',
  'Report seller',
];

function renderListingDetail() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/listing/listing-1']}>
        <Routes>
          <Route element={<ListingDetail />} path="/listing/:id" />
          <Route element={<main>Listings page</main>} path="/listings" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  userState.user = { id: SELLER_ID };
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: null,
    reservedOffer: null,
    reservedForCurrentUser: false,
    reservedUntil: null,
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
    seller: { fullName: 'Seller' },
    size: 'M',
    status: 'SOLD',
    title: 'Vintage jacket',
    weight: null,
  };
});

describe('owner view of a sold listing', () => {
  it('renders the page without redirecting the owner to listings', async () => {
    renderListingDetail();

    expect(await screen.findByText('Vintage jacket')).toBeInTheDocument();
    expect(screen.queryByText('Listings page')).not.toBeInTheDocument();
  });

  it('shows a Sold banner with owner copy and no browse call to action', async () => {
    renderListingDetail();

    expect(await screen.findByText('Sold')).toBeInTheDocument();
    expect(screen.getByText(/has been sold/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Browse other listings' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/bears no responsibility over the shipping method/i),
    ).toBeInTheDocument();
  });

  it.each(ACTION_BUTTON_NAMES)('hides the %s action', async name => {
    renderListingDetail();

    await screen.findByText('Vintage jacket');
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  });

  it('keeps the gallery, description, attribute chips and listing feedback', async () => {
    renderListingDetail();

    expect(
      await screen.findByRole('img', { name: 'Vintage jacket - photo 1' }),
    ).toBeInTheDocument();
    expect(screen.getByText('A vintage jacket.')).toBeInTheDocument();
    expect(screen.getByText('Size M')).toBeInTheDocument();
    expect(screen.getByText('Listing feedback')).toBeInTheDocument();
  });
});

describe('non-owner view of a sold listing', () => {
  it.each([
    ['a signed-in shopper', OTHER_USER],
    ['an anonymous visitor', null],
  ])('shows %s the Sold banner with browse CTA and report actions', async (_label, user) => {
    userState.user = user;
    renderListingDetail();

    expect(await screen.findByText('Sold')).toBeInTheDocument();
    expect(screen.getByText(/has already been purchased/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse other listings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report listing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report seller' })).toBeInTheDocument();
  });

  it.each([
    ['a signed-in shopper', OTHER_USER],
    ['an anonymous visitor', null],
  ])('hides cart, offer and message actions from %s', async (_label, user) => {
    userState.user = user;
    renderListingDetail();

    await screen.findByText('Vintage jacket');
    for (const name of [
      'Edit Listing',
      'Delete',
      'Cancel reservation',
      'Add to Cart',
      'Make Offer',
      'Message seller',
    ]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it('sends a shopper from the Browse other listings button to listings', async () => {
    userState.user = OTHER_USER;
    renderListingDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Browse other listings' }));
    expect(await screen.findByText('Listings page')).toBeInTheDocument();
  });
});

describe('owner actions on non-sold listings', () => {
  it.each(['PENDING', 'NEEDS_REVISION'])(
    'keeps Edit and Delete for the owner of a %s listing',
    async status => {
      listingState.listing.status = status;
      renderListingDetail();

      expect(await screen.findByRole('button', { name: 'Edit Listing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel reservation' })).not.toBeInTheDocument();
      expect(screen.queryByText('Sold')).not.toBeInTheDocument();
    },
  );

  it('keeps Delete and hides Edit for the owner of an APPROVED listing', async () => {
    listingState.listing.status = 'APPROVED';
    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Listing' })).not.toBeInTheDocument();
    expect(screen.queryByText('Sold')).not.toBeInTheDocument();
  });

  it('keeps Cancel reservation and Delete for the owner of a RESERVED listing', async () => {
    listingState.listing.status = 'RESERVED';
    listingState.listing.reservedUntil = new Date(Date.now() + 3_600_000).toISOString();
    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Listing' })).not.toBeInTheDocument();
    expect(screen.queryByText('Sold')).not.toBeInTheDocument();
  });

  it('keeps the buyer actions for a shopper on an APPROVED listing', async () => {
    userState.user = OTHER_USER;
    listingState.listing.status = 'APPROVED';
    renderListingDetail();

    expect(await screen.findByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make Offer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message seller' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report listing' })).toBeInTheDocument();
    expect(screen.queryByText('Sold')).not.toBeInTheDocument();
  });
});
