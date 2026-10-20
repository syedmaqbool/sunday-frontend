import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingModeration from '@/pages/admin/ListingModeration';

const { listAdminListings, showErrorToast, updateAdminListingTitle } = vi.hoisted(() => ({
  listAdminListings: vi.fn(),
  showErrorToast: vi.fn(),
  updateAdminListingTitle: vi.fn(),
}));

vi.mock('@/services/listing.service', () => ({
  createAdminListingFeedback: vi.fn(),
  listAdminListings,
  moderateListing: vi.fn(),
  removeAdminListing: vi.fn(),
  restoreAdminListing: vi.fn(),
  updateAdminListingTitle,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { permissions: [{ name: 'LISTINGS_READ' }, { name: 'LISTINGS_UPDATE' }], roleName: 'STAFF' },
  }),
}));

vi.mock('@/components/AdminListingFeedbackWidgets', () => ({
  AdminListingFeedbackSection: () => <div>Feedback history</div>,
}));

vi.mock('@/lib/errorToast', () => ({ showErrorToast }));

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
  title: 'Original listing title',
  weight: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
} as AdminListing;

function renderModeration() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/listings?listing=listing-1&status=PENDING']}>
        <ListingModeration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listAdminListings.mockResolvedValue({
    data: [listing],
    pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 10, prevPage: null, total: 1 },
  });
  updateAdminListingTitle.mockResolvedValue({ data: { ...listing, title: 'Updated title' } });
});

describe('admin listing title editing', () => {
  it('opens an inline title editor from the moderation dialog', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));

    expect(within(dialog).getByRole('textbox', { name: 'Listing title' })).toHaveValue('Original listing title');
  });

  it('trims a title and updates the open dialog on Enter', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    const input = within(dialog).getByRole('textbox', { name: 'Listing title' });
    fireEvent.change(input, { target: { value: '  Updated title  ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(updateAdminListingTitle).toHaveBeenCalledWith('listing-1', { title: 'Updated title' }));
    expect(await screen.findByRole('dialog', { name: 'Updated title' })).toBeInTheDocument();
    await waitFor(() => expect(listAdminListings.mock.calls.length).toBeGreaterThan(1));
  });

  it('does not submit a blank title and limits input to 120 characters', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    const input = within(dialog).getByRole('textbox', { name: 'Listing title' });

    expect(input).toHaveAttribute('maxLength', '120');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(within(dialog).getByRole('button', { name: 'Save title' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(updateAdminListingTitle).not.toHaveBeenCalled();
  });

  it('saves a title at the 120-character limit', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    const title = 'a'.repeat(120);
    const input = within(dialog).getByRole('textbox', { name: 'Listing title' });
    fireEvent.change(input, { target: { value: title } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save title' }));

    await waitFor(() => expect(updateAdminListingTitle).toHaveBeenCalledWith('listing-1', { title }));
  });

  it('disables saving while the title update is pending', async () => {
    let resolveUpdate!: (response: { data: AdminListing }) => void;
    updateAdminListingTitle.mockImplementationOnce(() => new Promise((resolve) => {
      resolveUpdate = resolve;
    }));
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Listing title' }), {
      target: { value: 'Pending title' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save title' }));

    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Save title' })).toBeDisabled());
    resolveUpdate({ data: { ...listing, title: 'Pending title' } });
    await screen.findByRole('dialog', { name: 'Pending title' });
  });

  it('discards the title draft on Escape and Cancel', async () => {
    renderModeration();
    let dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    let input = within(dialog).getByRole('textbox', { name: 'Listing title' });
    fireEvent.change(input, { target: { value: 'Draft title' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(within(dialog).queryByRole('textbox', { name: 'Listing title' })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    input = within(dialog).getByRole('textbox', { name: 'Listing title' });
    fireEvent.change(input, { target: { value: 'Another draft' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel title edit' }));
    expect(within(dialog).getByRole('heading', { name: 'Original listing title' })).toBeInTheDocument();
    expect(updateAdminListingTitle).not.toHaveBeenCalled();
  });

  it('keeps a failed title draft available for retry', async () => {
    const failure = new Error('Title could not be saved');
    updateAdminListingTitle.mockRejectedValueOnce(failure);
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Original listing title' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit title' }));
    const input = within(dialog).getByRole('textbox', { name: 'Listing title' });
    fireEvent.change(input, { target: { value: 'Retry title' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save title' }));

    await waitFor(() => expect(within(dialog).getByRole('textbox', { name: 'Listing title' })).toHaveValue('Retry title'));
    expect(updateAdminListingTitle).toHaveBeenCalledTimes(1);
    expect(showErrorToast).toHaveBeenCalledWith(failure, 'Failed to update listing title');
  });
});
