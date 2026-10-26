import type { MarketplaceListing } from '@/types/marketplace.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Listings from '@/pages/Listings';

const { marketplaceListingsOptionsMock, subcategoriesOptionsMock } = vi.hoisted(() => ({
  marketplaceListingsOptionsMock: vi.fn(),
  subcategoriesOptionsMock: vi.fn(),
}));

vi.mock('framer-motion', () => ({ motion: { div: 'div' } }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/hooks/useBoosts', () => ({
  applyBoostRanking: (listings: unknown[]) => listings,
  useBoostScoreMap: () => new Map(),
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
  getMarketplaceListingsOptions: marketplaceListingsOptionsMock,
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
    (clothingTypeId?: string, isEnabled = true) => ({
      enabled: isEnabled,
      queryFn: async () =>
        clothingTypeId ? listings.filter(item => item.clothingTypeId === clothingTypeId) : listings,
      queryKey: ['marketplace', 'listings', clothingTypeId ?? null],
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
  });

  it('links the seller byline and the rest of a grid card to their respective pages', async () => {
    renderListings();

    await screen.findByText(/ items/);
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
});

describe('listing clothing type filter', () => {
  beforeEach(() => {
    subcategoriesOptionsMock.mockReset();
  });

  it('loads the selected parent category subcategories so the filter value is visible', async () => {
    subcategoriesOptionsMock.mockImplementation((categoryId?: string) => ({
      enabled: !!categoryId,
      queryFn: async () => [
        {
          data:
            categoryId === 'category-children'
              ? [
                  {
                    id: 'subcategory-clothes',
                    icon: '👚',
                    label: 'Clothes',
                    sortOrder: 1,
                    value: 'clothes',
                  },
                ]
              : [],
        },
      ],
      queryKey: ['subcategories', categoryId],
    }));

    renderListings({
      initialEntry: '/listings?category=children-clothes',
      listings: [{ ...listing, categoryValue: 'children-clothes', subcategoryValue: 'clothes' }],
    });

    await screen.findByText('1 items');
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('Clothes');
    expect(subcategoriesOptionsMock).toHaveBeenCalledWith('category-children');
  });

  it('requests listings filtered by the selected clothing type', async () => {
    const clothingListings = [
      {
        ...listing,
        id: 'top-listing',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        subcategoryValue: 'clothes',
        title: 'Cotton Top',
      },
      {
        ...listing,
        id: 'dress-listing',
        clothingTypeId: 'clothing-type-dresses',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'dresses',
        subcategoryValue: 'clothes',
        title: 'Summer Dress',
      },
    ];

    renderListings({
      initialEntry: '/listings?category=women-clothes',
      listings: clothingListings,
    });

    await screen.findByText('2 items');
    fireEvent.click(screen.getByRole('combobox', { name: /clothing type/i }));
    expect(await screen.findByRole('option', { name: 'Tops' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Tops' }));

    expect(await screen.findByText('1 items')).toBeInTheDocument();
    expect(marketplaceListingsOptionsMock).toHaveBeenLastCalledWith('clothing-type-tops', true);
    expect(screen.getByText('Cotton Top')).toBeInTheDocument();
    expect(screen.queryByText('Summer Dress')).not.toBeInTheDocument();
  });

  it('hides the clothing type filter when another subcategory is selected', async () => {
    renderListings({
      initialEntry: '/listings?category=women-shoes',
      listings: [{ ...listing, categoryValue: 'women-shoes', subcategoryValue: 'shoes' }],
    });

    await screen.findByText('1 items');
    expect(screen.queryByRole('combobox', { name: 'Clothing type' })).not.toBeInTheDocument();
  });

  it('initializes the selected type from the clothing_type URL parameter', async () => {
    const clothingListings = [
      {
        ...listing,
        id: 'top-listing',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        subcategoryValue: 'clothes',
        title: 'Cotton Top',
      },
      {
        ...listing,
        id: 'dress-listing',
        clothingTypeId: 'clothing-type-dresses',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'dresses',
        subcategoryValue: 'clothes',
        title: 'Summer Dress',
      },
    ];

    renderListings({
      initialEntry: '/listings?category=women-clothes&clothing_type=dresses',
      listings: clothingListings,
    });

    expect(await screen.findByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('Summer Dress')).toBeInTheDocument();
    expect(screen.queryByText('Cotton Top')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Clothing type' })).toHaveTextContent('Dresses');
  });

  it('keeps the reset option available for an unavailable URL type', async () => {
    const clothingListings = [
      {
        ...listing,
        id: 'top-listing',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        subcategoryValue: 'clothes',
        title: 'Cotton Top',
      },
      {
        ...listing,
        id: 'dress-listing',
        clothingTypeId: 'clothing-type-dresses',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'dresses',
        subcategoryValue: 'clothes',
        title: 'Summer Dress',
      },
    ];

    renderListings({
      initialEntry: '/listings?category=women-clothes&clothing_type=retired-type',
      listings: clothingListings,
    });

    expect(await screen.findByText('2 items')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'Clothing type' }));
    expect(await screen.findByRole('option', { name: 'All Clothing' })).toBeInTheDocument();
  });

  it('preserves search, condition, size, category, and sort while filtering by clothing type', async () => {
    const clothingListings: MarketplaceListing[] = [
      {
        ...listing,
        id: 'vintage-tee',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        condition: 'new_with_tags',
        price: 3500,
        size: 'L',
        subcategoryValue: 'clothes',
        title: 'Vintage Tee',
      },
      {
        ...listing,
        id: 'cotton-shirt',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        condition: 'new_with_tags',
        price: 1500,
        size: 'M',
        subcategoryValue: 'clothes',
        title: 'Cotton Shirt',
      },
      {
        ...listing,
        id: 'summer-dress',
        clothingTypeId: 'clothing-type-dresses',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'dresses',
        condition: 'good',
        price: 800,
        size: 'L',
        subcategoryValue: 'clothes',
        title: 'Summer Dress',
      },
    ];

    renderListings({
      initialEntry: '/listings?category=women-clothes',
      listings: clothingListings,
    });

    await screen.findByText('3 items');
    const selects = screen.getAllByRole('combobox');
    fireEvent.click(selects[2]);
    fireEvent.click(await screen.findByRole('option', { name: 'Tops' }));
    expect(await screen.findByText('2 items')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('combobox')[5]);
    fireEvent.click(await screen.findByRole('option', { name: 'Price: Low to High' }));

    const visibleListings = screen.getByRole('main');
    expect(visibleListings.textContent?.indexOf('Cotton Shirt')).toBeLessThan(
      visibleListings.textContent?.indexOf('Vintage Tee') ?? Infinity,
    );

    fireEvent.click(screen.getAllByRole('combobox')[3]);
    fireEvent.click(await screen.findByRole('option', { name: 'New with tags' }));
    fireEvent.click(screen.getAllByRole('combobox')[4]);
    fireEvent.click(await screen.findByRole('option', { name: 'L' }));
    fireEvent.change(screen.getByPlaceholderText('Search by listing, brand, or seller name...'), {
      target: { value: 'Vintage' },
    });

    expect(await screen.findByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('Vintage Tee')).toBeInTheDocument();
    expect(screen.queryByText('Cotton Shirt')).not.toBeInTheDocument();
    expect(screen.queryByText('Summer Dress')).not.toBeInTheDocument();
  });

  it('clears the type selection when changing away from Clothes', async () => {
    const clothingListings = [
      {
        ...listing,
        id: 'top-listing',
        clothingTypeId: 'clothing-type-tops',
        categoryValue: 'women-clothes',
        clothingTypeValue: 'tops',
        subcategoryValue: 'clothes',
        title: 'Cotton Top',
      },
      {
        ...listing,
        id: 'shoe-listing',
        categoryValue: 'women-shoes',
        clothingTypeValue: null,
        subcategoryValue: 'shoes',
        title: 'Leather Shoes',
      },
    ];

    renderListings({
      initialEntry: '/listings?category=women-clothes',
      listings: clothingListings,
    });

    await screen.findByText('1 items');
    fireEvent.click(screen.getByRole('combobox', { name: 'Clothing type' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Tops' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Shoes' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Clothes' }));

    expect(await screen.findByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('Cotton Top')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Clothing type' })).toHaveTextContent(
      'All Clothing',
    );
  });
});
