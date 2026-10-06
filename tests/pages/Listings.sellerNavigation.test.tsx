import type { MarketplaceListing } from '@/types/marketplace.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Listings from '@/pages/Listings';

const { marketplaceListingsOptionsMock } = vi.hoisted(() => ({
  marketplaceListingsOptionsMock: vi.fn(),
}));

vi.mock('framer-motion', () => ({ motion: { div: 'div' } }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/hooks/useBoosts', () => ({
  applyBoostRanking: (listings: unknown[]) => listings,
  useBoostScoreMap: () => new Map(),
}));
vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: () => ({ queryFn: async () => [], queryKey: ['categories'] }),
  getSubcategoriesOptions: () => ({ queryFn: async () => [], queryKey: ['subcategories'] }),
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingsOptions: () => ({ queryFn: async () => new Map(), queryKey: ['seller-ratings'] }),
}));
vi.mock('@/hooks/useUserPreferences', () => ({
  getUserPreferencesOptions: () => ({ queryFn: async () => ({ data: null }), queryKey: ['user-preferences'] }),
  personalizeListings: (listings: unknown[]) => listings,
}));
vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: () => ['/listing-image.jpg'],
  getMarketplaceListingsOptions: marketplaceListingsOptionsMock,
}));

const listing: MarketplaceListing = {
  id: 'listing-1',
  categoryId: 'category-1',
  sellerId: 'seller-1',
  subcategoryId: 'subcategory-1',
  brand: 'Example Brand',
  categoryLabel: 'Clothing',
  categoryValue: 'women-clothing',
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
  reservedUntil: null,
  seller: {
    id: 'seller-1',
    fullName: 'Jamie Seller',
    image: null,
    location: 'Lahore',
  },
  size: 'M',
  status: 'APPROVED',
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

function renderListings() {
  marketplaceListingsOptionsMock.mockReturnValue({
    queryFn: async () => [listing],
    queryKey: ['marketplace', 'listings'],
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/listings']}>
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
  });

  it('links the seller byline and the rest of a grid card to their respective pages', async () => {
    renderListings();

    await screen.findByText(/ items/);
    expect(marketplaceListingsOptionsMock).toHaveBeenCalled();
    expect(screen.getByRole('main').textContent).toContain('Vintage Jacket');
    const sellerLink = await screen.findByRole('link', { name: 'Jamie Seller' });
    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(screen.getByRole('link', { name: 'Vintage Jacket' })).toHaveAttribute('href', '/listing/listing-1');

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
    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(listingLink).toHaveAttribute('href', '/listing/listing-1');

    fireEvent.click(listingLink);
    expect(await screen.findByText('Item detail page')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/listing/listing-1');
  });
});
