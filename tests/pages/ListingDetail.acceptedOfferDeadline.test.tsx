import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ListingDetail from '@/pages/ListingDetail';

const { addItemMock, listingState, reservedOfferState, userState } = vi.hoisted(() => ({
  addItemMock: vi.fn(),
  listingState: { listing: undefined as any },
  reservedOfferState: { amount: 100 },
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
    queryFn: async () => reservedOfferState.amount,
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
  reservedOfferState.amount = 100;
  listingState.listing = {
    id: 'listing-1',
    reservedOfferId: 'offer-1',
    sellerId: 'seller-1',
    brand: 'Vintage',
    buyerProtectionFee: { rate: 0, amount: 0 },
    buyerTotalPrice: 150,
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
  it.each(['PENDING', 'REJECTED', 'NEEDS_REVISION'])(
    'shows the owner edit action for %s listings',
    async status => {
      userState.user = { id: 'seller-1' };
      listingState.listing.status = status;
      listingState.listing.reservedOfferId = null;
      listingState.listing.reservedUntil = null;
      listingState.listing.reservedForCurrentUser = false;

      renderListingDetail();

      expect(await screen.findByRole('button', { name: 'Edit Listing' })).toBeInTheDocument();
    },
  );

  it.each(['APPROVED', 'RESERVED', 'SOLD'])(
    'hides the owner edit action for %s listings',
    async status => {
      userState.user = { id: 'seller-1' };
      listingState.listing.status = status;
      listingState.listing.reservedUntil = null;
      listingState.listing.reservedForCurrentUser = false;

      renderListingDetail();

      await screen.findByText('Vintage jacket');
      expect(screen.queryByRole('button', { name: 'Edit Listing' })).not.toBeInTheDocument();
    },
  );

  it('shows the regular listing price without seller incentive savings', async () => {
    listingState.listing.reservedOfferId = null;
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = null;
    listingState.listing.status = 'APPROVED';
    renderListingDetail();

    expect(await screen.findByText('Vintage jacket')).toBeInTheDocument();
    expect(screen.getAllByText('Rs 150')).toHaveLength(2);
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.queryByText(/seller coupon|save rs/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/coupon/i)).not.toBeInTheDocument();
  });

  it('keeps adding a normal listing to the cart with its stored asking price', async () => {
    listingState.listing.reservedOfferId = null;
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = null;
    listingState.listing.status = 'APPROVED';
    listingState.listing.price = 4000;

    renderListingDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Add to Cart' }));

    expect(addItemMock).toHaveBeenCalledWith(listingState.listing, undefined);
  });

  it('shows the regular price without a coupon message when there is no estimate', async () => {
    listingState.listing.reservedOfferId = null;
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = null;
    listingState.listing.status = 'APPROVED';
    renderListingDetail();

    expect(await screen.findAllByText('Rs 150')).toHaveLength(2);
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.queryByText(/seller coupon|save rs/i)).not.toBeInTheDocument();
  });

  it('does not promise a seller coupon on a listing reserved for another buyer', async () => {
    listingState.listing.reservedOfferId = null;
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = '2999-01-01T00:00:00.000Z';

    renderListingDetail();

    expect(await screen.findAllByText('Rs 150')).toHaveLength(2);
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
  });

  it('keeps the accepted-offer price without a seller coupon estimate', async () => {
    listingState.listing.reservedUntil = '2999-01-01T00:00:00.000Z';

    renderListingDetail();

    expect(await screen.findByText('Your accepted offer')).toBeInTheDocument();
    expect(screen.getByText('Rs 100')).toBeInTheDocument();
    expect(screen.getByText('Rs 150')).toHaveClass('line-through');
    expect(screen.queryByText(/including buyer protection/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Buyer protection fee (20%)')).not.toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
  });

  it('keeps the accepted-offer display when the offer equals the asking price', async () => {
    reservedOfferState.amount = listingState.listing.price;
    listingState.listing.reservedUntil = '2999-01-01T00:00:00.000Z';

    renderListingDetail();

    expect(await screen.findByText('Your accepted offer')).toBeInTheDocument();
    expect(
      screen.getAllByText('Rs 150').some(element => element.classList.contains('line-through')),
    ).toBe(true);
    expect(screen.queryByText(/including buyer protection/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Buyer protection fee (20%)')).not.toBeInTheDocument();
  });

  it('shows the buyer that submitted proof is awaiting review when there is no deadline', async () => {
    listingState.listing.reservedUntil = null;

    renderListingDetail();

    expect(
      await screen.findByText(/your payment proof is awaiting admin review/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/payment deadline has passed/i)).not.toBeInTheDocument();
  });

  it('shows the owner that submitted proof is awaiting review and hides reservation cancellation', async () => {
    userState.user = { id: 'seller-1' };
    listingState.listing.reservedForCurrentUser = false;
    listingState.listing.reservedUntil = null;

    renderListingDetail();

    expect(
      await screen.findByText(/the buyer's payment proof is awaiting admin review/i),
    ).toBeInTheDocument();
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
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.getByText(/payment deadline has passed/i)).toBeInTheDocument();
    expect(addItemMock).not.toHaveBeenCalled();
  });
});
