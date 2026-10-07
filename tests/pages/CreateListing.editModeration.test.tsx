import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateListing from '@/pages/CreateListing';

const { listingState, toastMock, updateMyListingMock, userState } = vi.hoisted(() => ({
  listingState: { listing: null as any, responseStatus: 'PENDING' },
  toastMock: vi.fn(),
  updateMyListingMock: vi.fn(),
  userState: { user: { id: 'seller-1' } as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: userState.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: () => ({ queryFn: async () => [], queryKey: ['categories'] }),
  getSubcategoriesOptions: () => ({ queryFn: async () => [], queryKey: ['subcategories'] }),
}));

vi.mock('@/queries/marketplace.query', () => ({
  getEditListingOptions: (listingId: string) => ({
    enabled: !!listingId,
    queryFn: async () => listingState.listing,
    queryKey: ['edit-listing', listingId],
  }),
}));

vi.mock('@/services/listing.service', () => ({
  createListing: vi.fn(),
  updateMyListing: updateMyListingMock,
}));

vi.mock('@/components/BankDetailsModal', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function editableListing(status: string, sellerId = 'seller-1') {
  return {
    brand: 'Vintage',
    categoryId: 'category-1',
    categoryValue: 'women-jackets',
    condition: 'USED_GOOD',
    description: 'A vintage jacket.',
    id: 'listing-1',
    media: [
      { file: { id: 'image-file', url: '/jacket.jpg' }, sortOrder: 0, type: 'IMAGE' },
      { file: { id: 'video-file', url: '/jacket.mp4' }, sortOrder: 1, type: 'VIDEO' },
    ],
    price: 150,
    sellerId,
    size: 'M',
    status,
    subcategoryId: 'subcategory-1',
    title: 'Vintage jacket',
    weight: null,
  };
}

function renderEditListing() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/edit-listing/listing-1']}>
        <LocationObserver />
        <Routes>
          <Route element={<CreateListing />} path="/edit-listing/:id" />
          <Route element={<main>Listing detail destination</main>} path="/listing/:id" />
          <Route element={<main>My Listings destination</main>} path="/my-listings" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('edit listing moderation rules', () => {
  beforeEach(() => {
    listingState.listing = editableListing('PENDING');
    listingState.responseStatus = 'PENDING';
    userState.user = { id: 'seller-1' };
    toastMock.mockReset();
    updateMyListingMock.mockReset();
    updateMyListingMock.mockImplementation(async () => ({ data: { status: listingState.responseStatus } }));
  });

  it.each(['APPROVED', 'RESERVED', 'SOLD'])(
    'redirects a direct edit URL for a %s listing',
    async (status) => {
      listingState.listing = editableListing(status);

      renderEditListing();

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-listings'));
      expect(screen.getByText('My Listings destination')).toBeInTheDocument();
    },
  );

  it('redirects a direct edit URL when the listing no longer exists', async () => {
    listingState.listing = null;

    renderEditListing();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-listings'));
    expect(screen.getByText('My Listings destination')).toBeInTheDocument();
  });

  it('redirects a direct edit URL when another seller owns the listing', async () => {
    listingState.listing = editableListing('PENDING', 'seller-2');

    renderEditListing();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-listings'));
    expect(screen.getByText('My Listings destination')).toBeInTheDocument();
  });

  it.each(['REJECTED', 'NEEDS_REVISION'])(
    'confirms a %s edit was submitted for moderation when it returns pending',
    async (status) => {
      listingState.listing = editableListing(status);
      listingState.responseStatus = 'PENDING';

      renderEditListing();
      fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

      await waitFor(() => expect(toastMock).toHaveBeenCalledWith({
        description: 'Your listing was submitted for moderation.',
        title: 'Listing submitted for review!',
      }));
    },
  );

  it('keeps the saved changes confirmation when a pending listing remains pending', async () => {
    listingState.listing = editableListing('PENDING');
    listingState.responseStatus = 'PENDING';

    renderEditListing();
    fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith({
      description: 'Your changes have been saved.',
      title: 'Listing updated!',
    }));
  });
});
