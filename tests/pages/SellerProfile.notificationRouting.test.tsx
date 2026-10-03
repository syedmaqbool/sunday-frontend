import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SellerProfile from '@/pages/SellerProfile';

const { reviewsQueryMock, sellerListingsQueryMock, sellerProfileQueryMock } = vi.hoisted(() => ({
  reviewsQueryMock: vi.fn(),
  sellerListingsQueryMock: vi.fn(),
  sellerProfileQueryMock: vi.fn(),
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/queries/marketplace.query', () => ({
  getSellerListingsOptions: sellerListingsQueryMock,
  getSellerProfileOptions: sellerProfileQueryMock,
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingOptions: () => queryOptions({
    queryFn: async () => ({ reviewedId: 'seller-1', avgRating: 5, totalReviews: 1 }),
    queryKey: ['seller-rating'],
  }),
}));
vi.mock('@/queries/review.query', () => ({
  getUserReviewsOptions: reviewsQueryMock,
}));

const review = {
  id: 'review-1',
  listingId: 'listing-1',
  offerId: null,
  orderId: 'order-1',
  reviewedId: 'seller-1',
  reviewerId: 'buyer-1',
  comment: 'Great seller',
  imageUrls: [],
  listingTitle: 'Listing',
  rating: 5,
  reviewedFullName: 'Seller',
  reviewerFullName: 'Buyer',
  role: 'BUYER' as const,
  videoUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function LocationObserver() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  );
}

function renderSellerProfile(initialEntry: string, reviews = [review]) {
  sellerProfileQueryMock.mockReturnValue(queryOptions({
    queryFn: async () => ({
      id: 'seller-1',
      userId: 'seller-1',
      avatarUrl: null,
      bio: '',
      fullName: 'Seller',
      image: null,
      location: '',
      phone: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
    queryKey: ['seller-profile'],
  }));
  sellerListingsQueryMock.mockReturnValue(queryOptions({
    queryFn: async () => [],
    queryKey: ['seller-listings'],
  }));
  reviewsQueryMock.mockReturnValue(queryOptions({
    queryFn: async () => ({ data: reviews }),
    queryKey: ['seller-reviews'],
  }));

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationObserver />
        <Routes>
          <Route element={<SellerProfile />} path="/seller/:id" />
          <Route element={<div data-testid="listings-page" />} path="/listings" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('seller review notification routing', () => {
  it('selects and focuses the destination review, and keeps selection in history', async () => {
    renderSellerProfile('/seller/seller-1?tab=reviews&review=review-1');

    const reviewsTab = await screen.findByRole('tab', { name: /Reviews/ });
    await waitFor(() => expect(reviewsTab).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(document.activeElement).toHaveAttribute('id', 'seller-review-review-1'));
    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1?tab=reviews&review=review-1');

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Listings/ }), { button: 0 });
    await waitFor(() => expect(screen.getByRole('tab', { name: /Listings/ })).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1?tab=listings');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1?tab=reviews&review=review-1'));
    expect(screen.getByRole('tab', { name: /Reviews/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps Reviews selected and removes an unavailable review identifier', async () => {
    renderSellerProfile('/seller/seller-1?tab=reviews&review=missing-review');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1?tab=reviews'));
    expect(await screen.findByRole('tab', { name: /Reviews/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to listings when the seller is unavailable', async () => {
    sellerProfileQueryMock.mockReturnValue(queryOptions({
      queryFn: async () => null,
      queryKey: ['seller-profile-unavailable'],
    }));
    sellerListingsQueryMock.mockReturnValue(queryOptions({
      queryFn: async () => [],
      queryKey: ['seller-listings-unavailable'],
    }));
    reviewsQueryMock.mockReturnValue(queryOptions({
      queryFn: async () => ({ data: [] }),
      queryKey: ['seller-reviews-unavailable'],
    }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/seller/missing-seller?tab=reviews&review=review-1']}>
          <LocationObserver />
          <Routes>
            <Route element={<SellerProfile />} path="/seller/:id" />
            <Route element={<div data-testid="listings-page" />} path="/listings" />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId('listings-page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/listings');
  });
});
