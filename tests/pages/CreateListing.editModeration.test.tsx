import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import CreateListing from '@/pages/CreateListing';

const {
  createListingMock,
  getMyProfileMock,
  listingState,
  toastMock,
  updateMyListingMock,
  uploadFileMock,
  userState,
} = vi.hoisted(() => ({
  createListingMock: vi.fn(),
  getMyProfileMock: vi.fn(),
  listingState: { listing: null as any, responseStatus: 'PENDING' },
  toastMock: vi.fn(),
  updateMyListingMock: vi.fn(),
  uploadFileMock: vi.fn(),
  userState: { user: { id: 'seller-1' } as { id: string } | null },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: userState.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useCategories', () => ({
  getCategoriesOptions: () => ({
    queryFn: async () => [
      { id: 'category-1', icon: '👗', label: 'Women', sortOrder: 0, value: 'women' },
    ],
    queryKey: ['categories'],
  }),
  getSubcategoriesOptions: () => ({
    queryFn: async () => [
      {
        data: [
          { id: 'subcategory-1', icon: '👔', label: 'Jackets', sortOrder: 0, value: 'jackets' },
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
        data: [
          { id: 'type-tops', label: 'Tops', sortOrder: 0, value: 'tops' },
          { id: 'type-bottoms', label: 'Bottoms', sortOrder: 1, value: 'bottoms' },
        ],
      },
    ],
    queryKey: ['clothing-types', 'list'],
  }),
}));

vi.mock('@/queries/marketplace.query', () => ({
  getEditListingOptions: (listingId: string) => ({
    enabled: !!listingId,
    queryFn: async () => listingState.listing,
    queryKey: ['edit-listing', listingId],
  }),
}));

vi.mock('@/services/listing.service', () => ({
  createListing: createListingMock,
  updateMyListing: updateMyListingMock,
}));

vi.mock('@/services/profile.service', () => ({ getMyProfile: getMyProfileMock }));
vi.mock('@/lib/uploadFile', () => ({ uploadFile: uploadFileMock }));

vi.mock('@/components/BankDetailsModal', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function editableListing(status: string, sellerId = 'seller-1') {
  return {
    id: 'listing-1',
    categoryId: 'category-1',
    clothingTypeId: null,
    sellerId,
    subcategoryId: 'subcategory-1',
    brand: 'Vintage',
    categoryValue: 'women-jackets',
    condition: 'good',
    description: 'A vintage jacket.',
    media: [
      { file: { id: 'image-file', url: '/jacket.jpg' }, sortOrder: 0, type: 'IMAGE' },
      { file: { id: 'video-file', url: '/jacket.mp4' }, sortOrder: 1, type: 'VIDEO' },
    ],
    price: 150,
    size: 'M',
    status,
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

function renderCreateListing() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/create-listing']}>
        <Routes>
          <Route element={<CreateListing />} path="/create-listing" />
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
    updateMyListingMock.mockImplementation(async () => ({
      data: { status: listingState.responseStatus },
    }));
  });

  it.each(['APPROVED', 'RESERVED', 'SOLD'])(
    'redirects a direct edit URL for a %s listing',
    async status => {
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
    async status => {
      listingState.listing = editableListing(status);
      listingState.responseStatus = 'PENDING';

      renderEditListing();
      fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));
      await waitFor(() => expect(updateMyListingMock).toHaveBeenCalled());

      await waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith({
          description: 'Your listing was submitted for moderation.',
          title: 'Listing submitted for review!',
        }),
      );
    },
  );

  it('keeps the saved changes confirmation when a pending listing remains pending', async () => {
    listingState.listing = editableListing('PENDING');
    listingState.responseStatus = 'PENDING';

    renderEditListing();
    fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        description: 'Your changes have been saved.',
        title: 'Listing updated!',
      }),
    );
  });

  it('prepopulates saved styles when editing a listing', async () => {
    listingState.listing = { ...editableListing('PENDING'), styles: ['eastern', 'semi_formal'] };

    renderEditListing();

    expect(await screen.findByRole('button', { name: 'Eastern' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Semi Formal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Western' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateMyListingMock).toHaveBeenCalled());
    expect(updateMyListingMock.mock.calls[0][1]).toMatchObject({
      styles: ['eastern', 'semi_formal'],
    });
  });

  it('allows a legacy listing with no styles to save without adding one', async () => {
    listingState.listing = { ...editableListing('PENDING'), styles: [] };

    renderEditListing();
    fireEvent.click(await screen.findByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(updateMyListingMock).toHaveBeenCalled());
    expect(updateMyListingMock.mock.calls[0][1]).toMatchObject({ styles: [] });
  });

  it('shows clothing type only for the Clothes subcategory', async () => {
    renderCreateListing();

    expect(screen.queryByText('Clothing type')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Women' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Clothes' }));

    expect(await screen.findByText('Clothing type')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(await screen.findByRole('option', { name: 'Tops' }));
    expect(screen.getAllByRole('combobox')[2]).toHaveTextContent('Tops');
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Jackets' }));
    expect(screen.queryByText('Clothing type')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Clothes' }));
    expect(screen.getAllByRole('combobox')[2]).toHaveTextContent('Top, bottom, dress...');
  });

  it('requires a clothing type for a Clothes listing', async () => {
    renderCreateListing();
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Women' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Clothes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Listing' }));

    expect(await screen.findByText('Choose a clothing type.')).toBeInTheDocument();
    expect(createListingMock).not.toHaveBeenCalled();
  });

  it('preselects and submits the saved clothing type while editing', async () => {
    listingState.listing = {
      ...editableListing('PENDING'),
      clothingTypeId: 'type-bottoms',
      subcategoryId: 'subcategory-clothes',
      categoryValue: 'women-clothes',
    };
    renderEditListing();

    await screen.findByText('Clothing type');
    const comboboxes = await screen.findAllByRole('combobox');
    fireEvent.click(comboboxes[2]);
    const savedClothingTypeOption = await screen.findByRole('option', { name: 'Bottoms' });
    expect(savedClothingTypeOption).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateMyListingMock).toHaveBeenCalled());
    expect(updateMyListingMock.mock.calls[0][1]).toMatchObject({ clothingTypeId: 'type-bottoms' });
  });
});

describe('create listing styles', () => {
  beforeEach(() => {
    createListingMock.mockReset();
  });

  it('requires at least one supported style for a new listing', async () => {
    renderCreateListing();
    fireEvent.click(screen.getByRole('button', { name: 'Submit Listing' }));

    expect(await screen.findByText('Choose at least one style.')).toBeInTheDocument();
  });

  it('lets sellers select multiple supported styles', async () => {
    renderCreateListing();
    fireEvent.click(screen.getByRole('button', { name: 'Eastern' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semi Formal' }));

    expect(screen.getByRole('button', { name: 'Eastern' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Semi Formal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('submits selected styles with their supported identifiers', async () => {
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:listing-media') }),
    );
    getMyProfileMock.mockResolvedValue({
      data: { bankAccountHolder: 'Seller', bankAccountNumber: '123456', bankName: 'Bank' },
    });
    uploadFileMock
      .mockResolvedValueOnce({ data: { id: 'image-file' } })
      .mockResolvedValueOnce({ data: { id: 'video-file' } });
    createListingMock.mockResolvedValue({ data: { id: 'new-listing' } });
    const { container } = renderCreateListing();

    fireEvent.change(container.querySelector('#title'), { target: { value: 'Vintage jacket' } });
    fireEvent.change(container.querySelector('#brand'), { target: { value: 'Vintage' } });
    fireEvent.change(container.querySelector('#description'), {
      target: { value: 'A vintage jacket.' },
    });
    fireEvent.change(container.querySelector('#price'), { target: { value: '150' } });

    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Women' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Jackets' }));
    fireEvent.click(screen.getAllByRole('combobox')[3]);
    fireEvent.click(await screen.findByRole('option', { name: 'Good' }));
    fireEvent.click(screen.getAllByRole('combobox')[4]);
    fireEvent.click(await screen.findByRole('option', { name: 'M' }));

    fireEvent.change(container.querySelector('input[accept="image/*"]'), {
      target: { files: [new File(['image'], 'jacket.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(container.querySelector('input[accept="video/*"]'), {
      target: { files: [new File(['video'], 'jacket.mp4', { type: 'video/mp4' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Eastern' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semi Formal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Listing' }));

    await waitFor(() => expect(createListingMock).toHaveBeenCalled());
    expect(createListingMock.mock.calls[0][0]).toMatchObject({
      styles: ['eastern', 'semi_formal'],
    });
    expect(createListingMock.mock.calls[0][0]).toMatchObject({ clothingTypeId: null });
  });

  it('submits a selected clothing type when creating a Clothes listing', async () => {
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:clothes-listing-media') }),
    );
    getMyProfileMock.mockResolvedValue({
      data: { bankAccountHolder: 'Seller', bankAccountNumber: '123456', bankName: 'Bank' },
    });
    uploadFileMock
      .mockResolvedValueOnce({ data: { id: 'clothes-image' } })
      .mockResolvedValueOnce({ data: { id: 'clothes-video' } });
    createListingMock.mockResolvedValue({ data: { id: 'clothes-listing' } });
    const { container } = renderCreateListing();

    fireEvent.change(container.querySelector('#title'), { target: { value: 'Linen top' } });
    fireEvent.change(container.querySelector('#brand'), { target: { value: 'Vintage' } });
    fireEvent.change(container.querySelector('#description'), {
      target: { value: 'A linen top.' },
    });
    fireEvent.change(container.querySelector('#price'), { target: { value: '150' } });
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Women' }));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Clothes' }));
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(await screen.findByRole('option', { name: 'Tops' }));
    fireEvent.click(screen.getAllByRole('combobox')[4]);
    fireEvent.click(await screen.findByRole('option', { name: 'Good' }));
    fireEvent.click(screen.getAllByRole('combobox')[5]);
    fireEvent.click(await screen.findByRole('option', { name: 'M' }));
    fireEvent.change(container.querySelector('input[accept="image/*"]'), {
      target: { files: [new File(['image'], 'top.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.change(container.querySelector('input[accept="video/*"]'), {
      target: { files: [new File(['video'], 'top.mp4', { type: 'video/mp4' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Eastern' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Listing' }));

    await waitFor(() => expect(createListingMock).toHaveBeenCalled());
    expect(createListingMock.mock.calls[0][0]).toMatchObject({ clothingTypeId: 'type-tops' });
  });
});
