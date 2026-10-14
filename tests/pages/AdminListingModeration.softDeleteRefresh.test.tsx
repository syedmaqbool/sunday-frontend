import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingModeration from '@/pages/admin/ListingModeration';

const { listAdminListings, removeAdminListing, restoreAdminListing } = vi.hoisted(() => ({
  listAdminListings: vi.fn(),
  removeAdminListing: vi.fn(),
  restoreAdminListing: vi.fn(),
}));

vi.mock('@/services/listing.service', () => ({
  createAdminListingFeedback: vi.fn(),
  listAdminListings,
  moderateListing: vi.fn(),
  removeAdminListing,
  restoreAdminListing,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { permissions: [{ name: 'LISTINGS_READ' }, { name: 'LISTINGS_DELETE' }], roleName: 'STAFF' },
  }),
}));

vi.mock('@/components/AdminListingFeedbackWidgets', () => ({
  AdminListingFeedbackSection: () => <div>Feedback history</div>,
}));

const listing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  brand: 'Brand',
  categoryLabel: 'Clothing',
  condition: 'GOOD',
  coverImage: { url: '/listing.jpg' },
  deletionReason: null,
  description: 'Listing description',
  media: [],
  price: 100,
  sellerName: 'Test Seller',
  size: 'M',
  status: 'PENDING',
  title: 'Refresh listing',
  weight: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
} as AdminListing;
const deletedListing = {
  ...listing,
  deletionReason: 'Duplicate listing',
  deletedAt: '2026-10-01T00:00:00.000Z',
} as AdminListing;

function renderModeration(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <ListingModeration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listAdminListings.mockImplementation(async ({ isDeleted }: { isDeleted?: boolean }) => {
    let data: AdminListing[];
    if (isDeleted) {
      data = restoreAdminListing.mock.results.length > 0 ? [] : [deletedListing];
    }
    else {
      data = removeAdminListing.mock.results.length > 0 ? [] : [listing];
    }
    return {
      data,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 10,
        prevPage: null,
        total: data.length,
      },
    };
  });
  removeAdminListing.mockResolvedValue({ data: listing, message: 'Listing removed', statusCode: 200 });
  restoreAdminListing.mockResolvedValue({ data: listing, message: 'Listing restored', statusCode: 200 });
});

describe('admin listing removal query refresh', () => {
  it('refreshes the visible listing query after removal', async () => {
    renderModeration('/admin/listings?listing=listing-1&status=PENDING');
    const dialog = await screen.findByRole('dialog', { name: 'Refresh listing' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete listing' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Removal reason' }), {
      target: { value: 'Duplicate listing' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm removal' }));

    expect(await screen.findByText('No listings found')).toBeInTheDocument();
    await waitFor(() => expect(listAdminListings.mock.calls.length).toBeGreaterThan(1));
  });

  it('refreshes the Deleted listing query after restore', async () => {
    renderModeration('/admin/listings?listing=listing-1&status=DELETED');
    const dialog = await screen.findByRole('dialog', { name: 'Refresh listing' });
    expect(within(dialog).getByText('Duplicate listing')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));

    expect(await screen.findByText('No listings found')).toBeInTheDocument();
    await waitFor(() => expect(listAdminListings.mock.calls.length).toBeGreaterThan(1));
  });
});
