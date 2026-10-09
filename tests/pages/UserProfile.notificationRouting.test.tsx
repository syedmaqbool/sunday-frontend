import type { Complaint } from '@/types/complaint.type';
import type { Order, Sale } from '@/types/order.type';
import { infiniteQueryOptions, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UserProfile, { ReturnsTab } from '@/pages/UserProfile';

const { reviewsOptionsMock, sellerOrders, sellerRatingTotal, sellerSales } = vi.hoisted(() => ({
  reviewsOptionsMock: vi.fn(),
  sellerOrders: { value: [] as Order[] },
  sellerRatingTotal: { value: 2 },
  sellerSales: { value: [] as Sale[] },
}));

const complaints: Complaint[] = [
  {
    id: 'buyer-complaint',
    listingTitle: 'Buyer return listing',
    reason: 'Not as described',
    status: 'RAISED',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as Complaint,
  {
    id: 'seller-complaint',
    listingTitle: 'Seller return listing',
    reason: 'Damaged item',
    status: 'RETURN_IN_TRANSIT',
    createdAt: '2026-01-02T00:00:00.000Z',
  } as Complaint,
];

vi.mock('@/services/complaints.service', () => ({
  listComplaintsAgainstMe: async () => ({ data: [complaints[1]] }),
  listMyRefundComplaints: async () => ({ data: [complaints[0]] }),
}));

vi.mock('@/queries/review.query', () => ({
  getOrderItemReviewOptions: () => ({ queryFn: async () => ({ data: [] }), queryKey: ['order-item-review'] }),
  getUserReviewsOptions: reviewsOptionsMock,
  useCreateOrderItemReviewMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    loading: false,
    user: { id: 'current-user', email: 'current@example.com' },
  }),
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/EditProfileDialog', () => ({ EditProfileDialog: () => null }));
vi.mock('@/components/ShareProfileDialog', () => ({ ShareProfileDialog: () => null }));
vi.mock('@/components/BankDetailsModal', () => ({ default: () => null }));

vi.mock('@/queries/myProfile.query', () => ({
  getMyProfileQueryOptions: () => ({
    queryFn: async () => ({ fullName: 'Current User' }),
    queryKey: ['my-profile'],
  }),
  myProfileQueryKey: { all: () => ['my-profile'] },
}));

vi.mock('@/queries/myOrders.query', () => ({
  getMyOrdersOptions: () => ({ queryFn: async () => ({ data: sellerOrders.value }), queryKey: ['orders'] }),
  getMySalesOptions: () => ({ queryFn: async () => ({ data: sellerSales.value }), queryKey: ['sales'] }),
  getMySalesOrderOptions: () => ({ queryFn: async () => ({ data: [] }), queryKey: ['sales-order'] }),
  myOrdersQueryKey: { all: () => ['orders'] },
  useUpdateOrderItemStatusMutation: () => ({}),
}));

vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingOptions: () => ({
    queryFn: async () => ({ reviewedId: 'current-user', avgRating: 4.5, totalReviews: sellerRatingTotal.value }),
    queryKey: ['seller-rating'],
  }),
}));

vi.mock('@/services/myOrders.service', () => ({
  updateItemStatus: vi.fn(),
  uploadShippingProof: vi.fn(),
}));

function LocationControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  );
}

function renderReturns(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationControls />
        <ReturnsTab />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderUserProfile(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationControls />
        <UserProfile />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function createSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    buyerId: 'buyer-1',
    commissionTierId: null,
    listingId: 'listing-1',
    offerId: null,
    orderId: 'order-1',
    reservationId: null,
    sellerId: 'current-user',
    sellerIncentiveId: 'incentive-1',
    brand: 'Vintage',
    buyerFullName: 'Buyer One',
    category: 'Clothing',
    commissionAmount: 0,
    commissionRate: 0,
    commissionTierName: null,
    condition: 'GOOD',
    currency: 'PKR',
    description: 'Vintage jacket',
    discountAmount: 0,
    expectedDelivery: null,
    imageUrl: '',
    platformFeeAmount: 0,
    price: 1000,
    proofImageUrl: null,
    quantity: 1,
    reservedOfferPrice: null,
    sellerFullName: 'Current User',
    sellerIncentiveBonus: 100,
    sellerIncentivePercentage: 10,
    shippingMethod: null,
    size: 'M',
    status: 'CONFIRMED',
    subcategory: 'Jackets',
    taxAmount: 0,
    title: 'Vintage jacket',
    total: 1000,
    trackingNumber: null,
    receivedAt: null,
    shippedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function createBuyerOrder(): Order {
  return {
    id: 'buyer-order-1',
    buyerId: 'current-user',
    buyerFullName: 'Current User',
    canCancel: false,
    cancellationReason: null,
    canResubmit: false,
    commissionAmount: 0,
    currency: 'PKR',
    discountAmount: 125,
    discountCode: 'OLD-SELLER-COUPON',
    items: [createSale({ sellerId: 'seller-1', sellerIncentiveBonus: 0, status: 'DELIVERED' })],
    manualPaymentSubmission: undefined,
    paymentStatus: 'PAID',
    platformFeeAmount: 0,
    refundStatus: null,
    sellerIncentives: [],
    shippingAddress: '1 Example Street',
    shippingCity: 'Lahore',
    shippingFirstName: 'Current',
    shippingLastName: 'User',
    shippingPhone: '03001234567',
    shippingPostal: '54000',
    status: 'DELIVERED',
    subtotal: 1000,
    taxAmount: 0,
    taxRate: 0,
    total: 875,
    cancelledAt: null,
    expiresAt: null,
    paidAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };
}

describe('profile complaint notification navigation', () => {
  it('restores the selected complaint section and complaint from the URL and browser history', async () => {
    renderReturns([
      '/profile?tab=returns&returnsTab=my-returns&complaint=buyer-complaint',
      '/profile?tab=returns&returnsTab=returned-to-me&complaint=seller-complaint',
    ]);

    expect(await screen.findByText('Seller return listing')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Returned to Me/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('[data-selected="true"]')).toHaveTextContent('Seller return listing');

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('returnsTab=my-returns&complaint=buyer-complaint'));
    expect(screen.getByRole('tab', { name: /My Returns/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('[data-selected="true"]')).toHaveTextContent('Buyer return listing');
  });

  it('falls back to the selected returns list when the complaint is unavailable', async () => {
    renderReturns(['/profile?tab=returns&returnsTab=my-returns&complaint=missing-complaint']);

    expect(await screen.findByText('Buyer return listing')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('complaint='));
  });
});

describe('own profile reviews', () => {
  it('shows the review count and current user reviews with the existing empty state', async () => {
    sellerRatingTotal.value = 2;
    reviewsOptionsMock.mockReturnValue(infiniteQueryOptions({
      getNextPageParam: () => null,
      initialPageParam: 1,
      queryFn: async () => ({ data: [], pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 50, prevPage: null, total: 0 } }),
      queryKey: ['own-reviews'],
    }));
    renderUserProfile('/profile?tab=reviews');

    const reviewsTab = await screen.findByRole('tab', { name: 'Reviews (2)' });
    expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument();
    expect(reviewsOptionsMock).toHaveBeenCalledWith('current-user', 50);
  });

  it('omits a zero review count from the tab label', async () => {
    sellerRatingTotal.value = 0;
    reviewsOptionsMock.mockReturnValue(infiniteQueryOptions({
      getNextPageParam: () => null,
      initialPageParam: 1,
      queryFn: async () => ({ data: [], pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 50, prevPage: null, total: 0 } }),
      queryKey: ['own-reviews'],
    }));
    renderUserProfile('/profile?tab=reviews');
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true'));
  });
});

describe('seller sales incentives', () => {
  it('shows pending and payable bonuses separately from the item value', async () => {
    sellerSales.value = [
      createSale({ id: 'pending-sale', sellerIncentiveBonus: 100, title: 'Pending jacket' }),
      createSale({ id: 'maturing-sale', sellerIncentiveBonus: 50, status: 'DELIVERED', title: 'Maturing jacket', receivedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() }),
      createSale({ id: 'payable-sale', sellerIncentiveBonus: 200, status: 'DELIVERED', title: 'Delivered jacket', receivedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }),
      createSale({ id: 'returned-sale', sellerIncentiveBonus: 0, status: 'CANCELLED', title: 'Returned jacket' }),
    ];
    renderUserProfile('/profile?tab=sold');

    expect(await screen.findByText('Pending jacket')).toBeInTheDocument();
    expect(await screen.findAllByText(/Pending seller incentive bonus/)).toHaveLength(2);
    expect(screen.getByText(/Payable seller incentive bonus/)).toBeInTheDocument();
    expect(screen.getByText('Rs 100')).toBeInTheDocument();
    expect(screen.getByText('Rs 50')).toBeInTheDocument();
    expect(screen.getByText('Rs 200')).toBeInTheDocument();
    expect(screen.queryByText('Rs 0')).not.toBeInTheDocument();
    const pendingSale = document.querySelector('#sold-order-item-pending-sale');
    expect(pendingSale).toHaveTextContent('Rs 1,000');
    expect(within(pendingSale as HTMLElement).getByText(/Pending seller incentive bonus/)).toBeInTheDocument();
  });
});

describe('historical order discounts', () => {
  it('keeps a legacy seller coupon discount readable in buyer order details', async () => {
    sellerOrders.value = [createBuyerOrder()];
    renderUserProfile('/profile?tab=bought');

    fireEvent.click(await screen.findByRole('button', { name: /Details/ }));

    expect(await screen.findByText('Discount (OLD-SELLER-COUPON)')).toBeInTheDocument();
    expect(screen.getByText('−Rs 125')).toBeInTheDocument();
  });
});
