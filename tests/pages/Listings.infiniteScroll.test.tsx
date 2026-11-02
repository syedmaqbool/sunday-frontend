import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { tokenStorage } from '@/lib/tokenStorage';
import Listings from '@/pages/Listings';
import type { MarketplaceListing } from '@/types/marketplace.type';

const { authState } = vi.hoisted(() => ({
  authState: { loading: false, user: null as null | { id: string } },
}));

vi.mock('framer-motion', () => ({ motion: { div: 'div' } }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/ListingCard', () => ({
  default: ({ listing }: { listing: MarketplaceListing }) => <article>{listing.title}</article>,
}));
vi.mock('@/components/SellerByline', () => ({ default: () => null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/hooks/useBoosts', () => ({
  applyBoostRanking: (listings: MarketplaceListing[]) => listings,
  useBoostScoreMap: () => new Map(),
}));
vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: () => ({
    queryFn: async () => [
      { id: 'category-women', icon: '👗', label: 'Women', sortOrder: 1, value: 'women' },
    ],
    queryKey: ['categories'],
  }),
  getSubcategoriesOptions: (categoryId?: string) => ({
    enabled: !!categoryId,
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
        ],
      },
    ],
    queryKey: ['subcategories'],
  }),
}));
vi.mock('@/queries/clothing-types.query', () => ({
  getClothingTypesOptions: () => ({
    queryFn: async () => [
      {
        data: [{ id: 'clothing-type-tops', label: 'Tops', sortOrder: 1, value: 'tops' }],
      },
    ],
    queryKey: ['clothing-types'],
  }),
}));
vi.mock('@/hooks/useSellerRating', () => ({
  getSellerRatingsOptions: () => ({
    enabled: false,
    queryFn: async () => new Map(),
    queryKey: ['seller-ratings'],
  }),
}));
vi.mock('@/hooks/useUserPreferences', () => ({
  getUserPreferencesOptions: () => ({
    enabled: false,
    queryFn: async () => ({ data: null }),
    queryKey: ['preferences'],
  }),
  personalizeListings: (listings: MarketplaceListing[]) => listings,
}));

const listing: MarketplaceListing = {
  id: 'listing-1',
  categoryId: 'category-1',
  clothingTypeId: null,
  sellerId: 'seller-1',
  subcategoryId: 'subcategory-1',
  brand: 'Example Brand',
  categoryLabel: 'Clothing',
  categoryValue: 'women-clothes',
  clothingTypeLabel: null,
  clothingTypeValue: null,
  condition: 'NEW',
  coverImage: {
    id: 'image-1',
    filename: 'jacket.webp',
    mimetype: 'image/webp',
    size: 1024,
    url: '/listing-image.webp',
  },
  coverImageUrl: '/listing-image.webp',
  description: 'A sample listing',
  images: [],
  imageUrls: ['/listing-image.webp'],
  media: [],
  price: 2500,
  buyerProtectionFee: { amount: 500, rate: 20 },
  buyerTotalPrice: 3000,
  reservedUntil: null,
  seller: { id: 'seller-1', fullName: 'Jamie Seller', image: null, location: 'Lahore' },
  size: 'M',
  status: 'APPROVED',
  styles: [],
  subcategoryLabel: 'Clothes',
  subcategoryValue: 'clothes',
  title: 'Vintage Jacket',
  weight: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderListings(initialEntry = '/listings') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Listings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('marketplace Listings pagination', () => {
  let requests: URL[];
  let authorizationHeaders: Array<string | null>;
  let nextResponse: (requestUrl: URL) => object | Response;
  let intersectionCallback: IntersectionObserverCallback | undefined;
  let observerRootMargins: string[];

  beforeEach(() => {
    requests = [];
    authorizationHeaders = [];
    observerRootMargins = [];
    authState.loading = false;
    authState.user = null;
    tokenStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    intersectionCallback = undefined;
    nextResponse = () => ({
      statusCode: 200,
      message: 'Listings loaded',
      data: [listing],
      pagination: {
        currentPage: 1,
        lastPage: 4,
        nextPage: 2,
        perPage: 20,
        prevPage: null,
        total: 61,
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: RequestInfo | URL) => {
        const requestUrl = new URL(request instanceof Request ? request.url : String(request));
        requests.push(requestUrl);
        authorizationHeaders.push(
          request instanceof Request ? request.headers.get('Authorization') : null,
        );
        const response = nextResponse(requestUrl);
        return response instanceof Response ? response : Response.json(response);
      }),
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          intersectionCallback = callback;
          observerRootMargins.push(options?.rootMargin ?? '');
        }

        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    tokenStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests only the first 20 listings initially', async () => {
    renderListings();

    expect(await screen.findByText('Vintage Jacket')).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0].pathname).toBe('/api/v1/listings');
    expect(requests[0].searchParams.get('page')).toBe('1');
    expect(requests[0].searchParams.get('size')).toBe('20');
    expect(
      [
        'search',
        'categoryValue',
        'subcategoryValue',
        'clothingTypeId',
        'condition',
        'sizeValue',
      ].some(parameter => requests[0].searchParams.has(parameter)),
    ).toBe(false);
    expect(authorizationHeaders[0]).toBeNull();
    expect(observerRootMargins).toEqual([`${window.innerHeight}px 0px`]);
  });

  it('sends search and selected filters and sort to the API', async () => {
    const scrollToMock = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderListings('/listings?category=women-clothes&clothing_type=tops&search=coat');

    expect(await screen.findByText('Vintage Jacket')).toBeInTheDocument();
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].searchParams.get('search')).toBe('coat');
    expect(requests[0].searchParams.get('categoryValue')).toBe('women');
    expect(requests[0].searchParams.get('subcategoryValue')).toBe('clothes');
    expect(requests[0].searchParams.get('clothingTypeId')).toBe('clothing-type-tops');
    expect(requests[0].searchParams.get('sortBy')).toBe('createdAt');
    expect(requests[0].searchParams.get('sortOrder')).toBe('desc');
    scrollToMock.mockClear();

    const filterControls = screen.getAllByRole('combobox');
    fireEvent.click(filterControls[3]);
    fireEvent.click(await screen.findByRole('option', { name: 'Good' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('condition')).toBe('good'));
    expect(scrollToMock).toHaveBeenCalledWith(0, 0);

    fireEvent.click(screen.getAllByRole('combobox')[4]);
    fireEvent.click(await screen.findByRole('option', { name: 'L' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('sizeValue')).toBe('L'));

    fireEvent.click(screen.getAllByRole('combobox')[5]);
    fireEvent.click(await screen.findByRole('option', { name: 'Price: Low to High' }));
    await waitFor(() => {
      expect(requests.at(-1)?.searchParams.get('sortBy')).toBe('price');
      expect(requests.at(-1)?.searchParams.get('sortOrder')).toBe('asc');
    });

    fireEvent.click(screen.getAllByRole('combobox')[5]);
    fireEvent.click(await screen.findByRole('option', { name: 'Price: High to Low' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('sortOrder')).toBe('desc'));

    const input = screen.getByPlaceholderText('Search by listing, brand, or seller name...');
    const requestCountBeforeTyping = requests.length;
    fireEvent.change(input, { target: { value: 'seller' } });
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(requests).toHaveLength(requestCountBeforeTyping);
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('search')).toBe('seller'), {
      timeout: 1000,
    });

    const finalRequest = requests.at(-1)!;
    expect(finalRequest.searchParams.get('page')).toBe('1');
    expect(finalRequest.searchParams.get('condition')).toBe('good');
    expect(finalRequest.searchParams.get('sizeValue')).toBe('L');
    expect(finalRequest.searchParams.get('sortBy')).toBe('price');
    expect(finalRequest.searchParams.get('sortOrder')).toBe('desc');
  });

  it('loads the next page as the end approaches and preserves the server response order', async () => {
    const laterListing = {
      ...listing,
      id: 'listing-2',
      title: 'Later Jacket',
      createdAt: '2026-06-01T00:00:00.000Z',
    };
    nextResponse = requestUrl => {
      const page = Number(requestUrl.searchParams.get('page'));
      return {
        statusCode: 200,
        message: 'Listings loaded',
        data: page === 1 ? [listing] : [laterListing],
        pagination: {
          currentPage: page,
          lastPage: 2,
          nextPage: page === 1 ? 2 : null,
          perPage: 20,
          prevPage: page === 1 ? null : 1,
          total: 2,
        },
      };
    };

    renderListings();
    expect(await screen.findByText('Vintage Jacket')).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(intersectionCallback).toBeDefined();

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(await screen.findByText('Later Jacket')).toBeInTheDocument();
    expect(requests.map(request => request.searchParams.get('page'))).toEqual(['1', '2']);
    expect(requests.every(request => request.searchParams.get('size') === '20')).toBe(true);
    expect(screen.getAllByRole('article').map(article => article.textContent)).toEqual([
      'Vintage Jacket',
      'Later Jacket',
    ]);
    expect(screen.getByText('2 of 2 listings')).toBeInTheDocument();
    expect(screen.getByText('You have reached the end.')).toBeInTheDocument();
  });

  it('keeps loaded listings visible and offers Retry when a later page fails', async () => {
    let shouldFailSecondPage = true;
    nextResponse = requestUrl => {
      const page = Number(requestUrl.searchParams.get('page'));
      if (page === 2 && shouldFailSecondPage) {
        shouldFailSecondPage = false;
        return Response.json({ message: 'Temporary failure' }, { status: 500 });
      }

      return {
        statusCode: 200,
        message: 'Listings loaded',
        data: page === 1 ? [listing] : [{ ...listing, id: 'listing-2', title: 'Next Jacket' }],
        pagination: {
          currentPage: page,
          lastPage: 2,
          nextPage: page === 1 ? 2 : null,
          perPage: 20,
          prevPage: page === 1 ? null : 1,
          total: 2,
        },
      };
    };

    renderListings();
    expect(await screen.findByText('Vintage Jacket')).toBeInTheDocument();
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(await screen.findByText('Could not load more listings.')).toBeInTheDocument();
    expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Next Jacket')).toBeInTheDocument();
    expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    expect(requests.map(request => request.searchParams.get('page'))).toEqual(['1', '2', '2']);
  });

  it('includes the buyer access token for signed-in listings requests', async () => {
    authState.user = { id: 'buyer-1' };
    tokenStorage.set('buyer-access-token', 'buyer-refresh-token');

    renderListings();

    expect(await screen.findByText('Vintage Jacket')).toBeInTheDocument();
    expect(authorizationHeaders[0]).toBe('Bearer buyer-access-token');
  });
});
