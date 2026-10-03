import type { Complaint } from '@/types/complaint.type';
import { infiniteQueryOptions, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UserProfile, { ReturnsTab } from '@/pages/UserProfile';

const { reviewsOptionsMock, sellerRatingTotal } = vi.hoisted(() => ({
  reviewsOptionsMock: vi.fn(),
  sellerRatingTotal: { value: 2 },
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
  getUserReviewsOptions: reviewsOptionsMock,
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
  getMyOrdersOptions: () => ({ queryFn: async () => ({ data: [] }), queryKey: ['orders'] }),
  getMySalesOptions: () => ({ queryFn: async () => ({ data: [] }), queryKey: ['sales'] }),
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
      getNextPageParam: () => undefined,
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
      getNextPageParam: () => undefined,
      initialPageParam: 1,
      queryFn: async () => ({ data: [], pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 50, prevPage: null, total: 0 } }),
      queryKey: ['own-reviews'],
    }));
    renderUserProfile('/profile?tab=reviews');
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true'));
  });
});
