import type { MarketplaceListing } from '@/types/marketplace.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Listings from '@/pages/Listings';

const { boostScoreMap, marketplaceListingsOptionsMock, subcategoriesOptionsMock } = vi.hoisted(
  () => ({
    boostScoreMap: { current: new Map<string, number>() },
    marketplaceListingsOptionsMock: vi.fn(),
    subcategoriesOptionsMock: vi.fn(),
  }),
);

vi.mock('framer-motion', () => ({ motion: { div: 'div' } }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ loading: false, user: null }) }));
vi.mock('@/hooks/useBoosts', () => ({
  applyBoostRanking: (listings: Array<{ id: string }>) =>
    [...listings].sort(
      (first, second) =>
        (boostScoreMap.current.get(second.id) ?? 0) - (boostScoreMap.current.get(first.id) ?? 0),
    ),
  useBoostScoreMap: () => boostScoreMap.current,
}));
vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: () => ({
    queryFn: async () => [
      { id: 'category-children', icon: '🧒', label: 'Children', sortOrder: 1, value: 'children' },
      { id: 'category-women', icon: '👩', label: 'Women', sortOrder: 2, value: 'women' },
    ],
    queryKey: ['categories'],
  }),
  getSubcategoriesOptions: (categoryId?: string) =>
    subcategoriesOptionsMock(categoryId) ?? {
      queryFn: async () => [
        {
          data: [
            {
              id: 'subcategory-clothes',
              icon: '👚',
              label: 'Clothes',
              sortOrder: 1,
              value: 'clothes',
            },
            { id: 'subcategory-shoes', icon: '👞', label: 'Shoes', sortOrder: 2, value: 'shoes' },
          ],
        },
      ],
      queryKey: ['subcategories'],
    },
}));
vi.mock('@/queries/clothing-types.query', () => ({
  getClothingTypesOptions: () => ({
    queryFn: async () => [
      {
        data: [
          { id: 'clothing-type-tops', label: 'Tops', sortOrder: 1, value: 'tops' },
          { id: 'clothing-type-dresses', label: 'Dresses', sortOrder: 2, value: 'dresses' },
        ],
      },
    ],
    queryKey: ['clothing-types', 'list'],
  }),
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingsOptions: () => ({ queryFn: async () => new Map(), queryKey: ['seller-ratings'] }),
}));
vi.mock('@/hooks/useUserPreferences', () => ({
  getUserPreferencesOptions: () => ({
    queryFn: async () => ({ data: null }),
    queryKey: ['user-preferences'],
  }),
  personalizeListings: (listings: unknown[]) => listings,
}));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => ['/listing-image.jpg'],
  getMarketplaceListingsOptions: (parameters: object, buyerId?: string, enabled = true) => {
    const options = marketplaceListingsOptionsMock(parameters, buyerId, enabled);
    return {
      enabled: options.enabled,
      getNextPageParam: options.getNextPageParam,
      initialPageParam: options.initialPageParam,
      queryFn: options.queryFn,
      queryKey: options.queryKey,
    };
  },
}));

const listing: MarketplaceListing = {
  id: 'listing-1',
  categoryId: 'category-1',
  clothingTypeId: null,
  sellerId: 'seller-1',
  subcategoryId: 'subcategory-1',
  brand: 'Example Brand',
  categoryLabel: 'Clothing',
  categoryValue: 'women-clothing',
  clothingTypeLabel: null,
  clothingTypeValue: null,
  condition: 'NEW',
  coverImage: {
    id: 'image-1',
    filename: 'jacket.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    url: '/listing-image.jpg',
  },
  coverImageUrl: '/listing-image.jpg',
  description: 'A sample listing',
  images: [],
  imageUrls: ['/listing-image.jpg'],
  media: [],
  price: 2500,
  buyerProtectionFee: { amount: 500, rate: 20 },
  buyerTotalPrice: 3000,
  reservedUntil: null,
  seller: {
    id: 'seller-1',
    fullName: 'Jamie Seller',
    image: null,
    location: 'Lahore',
  },
  size: 'M',
  status: 'APPROVED',
  styles: [],
  subcategoryLabel: 'Jackets',
  subcategoryValue: 'jackets',
  title: 'Vintage Jacket',
  weight: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderListings({
  initialEntry = '/listings',
  listings = [listing],
}: {
  initialEntry?: string;
  listings?: MarketplaceListing[];
} = {}) {
  marketplaceListingsOptionsMock.mockImplementation(
    (_parameters: object, _buyerId?: string, isEnabled = true) => ({
      enabled: isEnabled,
      getNextPageParam: () => undefined,
      initialPageParam: 1,
      queryFn: async () => ({
        data: listings,
        pagination: {
          currentPage: 1,
          lastPage: 1,
          nextPage: null,
          perPage: 20,
          prevPage: null,
          total: listings.length,
        },
      }),
      queryKey: ['marketplace', 'listings'],
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationObserver />
        <Routes>
          <Route element={<Listings />} path="/listings" />
          <Route element={<div>Item detail page</div>} path="/listing/:id" />
          <Route element={<div>Seller profile page</div>} path="/seller/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('listing seller navigation', () => {
  beforeEach(() => {
    marketplaceListingsOptionsMock.mockReset();
    boostScoreMap.current = new Map();
  });

  it('links the seller byline and the rest of a grid card to their respective pages', async () => {
    renderListings();

    await screen.findByText('1 of 1 listings');
    expect(marketplaceListingsOptionsMock).toHaveBeenCalled();
    expect(screen.getByRole('main').textContent).toContain('Vintage Jacket');
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    const sellerLink = await screen.findByRole('link', { name: 'Jamie Seller' });
    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(screen.getByRole('link', { name: 'Vintage Jacket' })).toHaveAttribute(
      'href',
      '/listing/listing-1',
    );

    fireEvent.click(sellerLink);
    expect(await screen.findByText('Seller profile page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1');
  });

  it('shows the seller byline in list view while keeping item navigation separate', async () => {
    renderListings();

    await screen.findByRole('link', { name: 'Jamie Seller' });
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    const sellerLink = await screen.findByRole('link', { name: 'Jamie Seller' });
    const listingLink = screen.getByRole('link', { name: 'Vintage Jacket' });
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(listingLink).toHaveAttribute('href', '/listing/listing-1');

    fireEvent.click(listingLink);
    expect(await screen.findByText('Item detail page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/listing/listing-1');
  });

  it('shows the buyer total and Platform fee note in list view', async () => {
    renderListings({ listings: [{ ...listing, buyerTotalPrice: 3000 }] });

    await screen.findByText('Vintage Jacket');
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(await screen.findByText('Rs 3,000')).toBeInTheDocument();
    expect(screen.getByText('incl. Platform Fee')).toHaveClass('text-xs', 'text-muted-foreground');
  });
});
