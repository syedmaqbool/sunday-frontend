import {
  infiniteQueryOptions,
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import SellerProfile from '@/pages/SellerProfile';
import type { MarketplaceListing } from '@/queries/marketplace.query';

const { soldListingsQueryMock, sellerListingsQueryMock, sellerProfileQueryMock } = vi.hoisted(
  () => ({
    soldListingsQueryMock: vi.fn(),
    sellerListingsQueryMock: vi.fn(),
    sellerProfileQueryMock: vi.fn(),
  }),
);

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ReviewsList', () => ({ ReviewsList: () => <p>Seller reviews</p> }));
vi.mock('@/queries/marketplace.query', () => ({
  getSellerListingsOptions: sellerListingsQueryMock,
  getSellerProfileOptions: sellerProfileQueryMock,
  getSellerSoldListingsOptions: soldListingsQueryMock,
  getListingMediaUrls: () => [],
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingOptions: () =>
    queryOptions({
      queryFn: async () => ({ reviewedId: 'seller-1', avgRating: 4.5, totalReviews: 2 }),
      queryKey: ['seller-rating'],
    }),
}));

function listing(id: string, title: string, status = 'SOLD'): MarketplaceListing {
  return {
    id,
    brand: 'Vintage',
    buyerProtectionFee: { amount: 100, rate: 10 },
    buyerTotalPrice: 1100,
    condition: 'USED_GOOD',
    description: 'A listing',
    images: [],
    media: [],
    price: 1000,
    sellerId: 'seller-1',
    size: 'M',
    status,
    title,
  } as MarketplaceListing;
}

function page(data: MarketplaceListing[], currentPage: number, lastPage: number, total: number) {
  return {
    data,
    pagination: {
      currentPage,
      lastPage,
      nextPage: currentPage < lastPage ? currentPage + 1 : null,
      perPage: 1,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      total,
    },
  };
}

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderSellerProfile(
  initialEntry: string,
  soldPages: ReturnType<typeof page>[] | Error = [page([], 1, 1, 0)],
) {
  sellerProfileQueryMock.mockReturnValue(
    queryOptions({
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
    }),
  );
  sellerListingsQueryMock.mockReturnValue(
    queryOptions({
      queryFn: async () => [listing('active-listing', 'An active listing', 'APPROVED')],
      queryKey: ['seller-listings'],
    }),
  );
  let failedOnce = soldPages instanceof Error;
  soldListingsQueryMock.mockReturnValue(
    infiniteQueryOptions({
      getNextPageParam: (lastPage: ReturnType<typeof page>) =>
        lastPage.pagination.nextPage ?? undefined,
      initialPageParam: 1 as number,
      queryFn: async ({ pageParam }) => {
        if (failedOnce && soldPages instanceof Error) {
          failedOnce = false;
          throw soldPages;
        }
        if (soldPages instanceof Error) {
          return page([listing('recovered', 'Recovered sale')], 1, 1, 1);
        }
        return soldPages[pageParam - 1];
      },
      queryKey: ['seller-sold-listings'],
    }),
  );

  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationObserver />
        <Routes>
          <Route element={<SellerProfile />} path="/seller/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  soldListingsQueryMock.mockReset();
  sellerListingsQueryMock.mockReset();
  sellerProfileQueryMock.mockReset();
});

describe('public seller sold listings', () => {
  it('shows all counted tabs and loads sold cards in API order with public detail links', async () => {
    renderSellerProfile('/seller/seller-1', [
      page([listing('newer', 'Newest sale')], 1, 2, 2),
      page([listing('older', 'Older sale')], 2, 2, 2),
    ]);

    expect(await screen.findByRole('tab', { name: 'Listings (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reviews (2)' })).toBeInTheDocument();
    const soldTab = await screen.findByRole('tab', { name: 'Sold (2)' });
    fireEvent.mouseDown(soldTab, { button: 0 });

    await waitFor(() => expect(soldTab).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1?tab=sold');
    const newest = await screen.findByRole('link', { name: 'Newest sale' });
    const older = screen.getByRole('link', { name: 'Older sale' });
    expect(newest).toHaveAttribute('href', '/listing/newer');
    expect(older).toHaveAttribute('href', '/listing/older');
    expect(newest.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(newest.parentElement!.parentElement!).getByText('Sold')).toBeInTheDocument();
    expect(screen.queryByText('active listing')).not.toBeInTheDocument();
  });

  it('opens the Sold tab on direct URL navigation and shows its empty state when there are no sales', async () => {
    renderSellerProfile('/seller/seller-1?tab=sold', [page([], 1, 1, 0)]);

    expect(await screen.findByRole('tab', { name: 'Sold (0)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('No sold items yet.')).toBeInTheDocument();
  });

  it('shows a recoverable error instead of the empty state when sold listings fail', async () => {
    renderSellerProfile('/seller/seller-1?tab=sold', new Error('Sold listings unavailable'));

    expect(await screen.findByText('Could not load sold items.')).toBeInTheDocument();
    expect(screen.queryByText('No sold items yet.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link', { name: 'Recovered sale' })).toBeInTheDocument();
  });
});
