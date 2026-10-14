import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingModeration from '@/pages/admin/ListingModeration';

const { feedbackMutation, listing, listings, moderationMutation, removeMutation, requestedQueries, restoreMutation, userPermissions } = vi.hoisted(() => ({
  feedbackMutation: vi.fn(),
  listing: {
    id: 'listing-1',
    sellerId: 'seller-1',
    brand: 'Brand',
    categoryLabel: 'Clothing',
    condition: 'GOOD',
    coverImage: { url: '/listing.jpg' },
    description: 'Listing description',
    media: [],
    price: 100,
    sellerName: 'Test Seller',
    size: 'M',
    status: 'PENDING',
    title: 'Notification listing',
    weight: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  } as AdminListing,
  listings: [] as AdminListing[],
  moderationMutation: vi.fn(),
  removeMutation: vi.fn(),
  requestedQueries: [] as Array<{ isDeleted?: boolean; page: number; size: number; status?: string }>,
  restoreMutation: vi.fn(),
  userPermissions: ['LISTINGS_READ', 'LISTINGS_DELETE'] as string[],
}));

vi.mock('@/queries/adminListing.query', () => ({
  getAdminListingsOptions: ({ isDeleted, page, size, status }: { isDeleted?: boolean; page: number; size: number; status?: string }) => {
    requestedQueries.push({ isDeleted, page, size, status });
    return {
      queryFn: async () => {
        const filteredListings = status
          ? listings.filter(listing => listing.status === status)
          : listings;
        const total = filteredListings.length;
        return {
          data: filteredListings.slice((page - 1) * size, page * size),
          pagination: {
            currentPage: page,
            lastPage: Math.max(1, Math.ceil(total / size)),
            nextPage: null,
            perPage: size,
            prevPage: null,
            total,
          },
        };
      },
      queryKey: ['admin-listings', 'list', status, isDeleted, page, size],
    };
  },
  useCreateAdminListingFeedbackMutation: () => ({ isPending: false, mutateAsync: feedbackMutation }),
  useModerateListingMutation: () => ({ isPending: false, mutateAsync: moderationMutation }),
  useRemoveAdminListingMutation: () => ({ isPending: false, mutateAsync: removeMutation }),
  useRestoreAdminListingMutation: () => ({ isPending: false, mutateAsync: restoreMutation }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { permissions: userPermissions.map(name => ({ name })), roleName: 'STAFF' },
  }),
}));

vi.mock('@/components/AdminListingFeedbackWidgets', () => ({
  AdminListingFeedbackSection: () => <div>Feedback history</div>,
}));

function HistoryControls() {
  const navigate = useNavigate();
  return (
    <>
      <LocationObserver />
      <button onClick={() => navigate(-1)} type="button">Back</button>
      <button onClick={() => navigate(1)} type="button">Forward</button>
      <ListingModeration />
    </>
  );
}

function LocationObserver() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderModeration(initialEntries: string[], initialIndex = initialEntries.length - 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <HistoryControls />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  requestedQueries.length = 0;
  userPermissions.splice(0, userPermissions.length, 'LISTINGS_READ', 'LISTINGS_DELETE');
  listings.splice(0, listings.length, listing);
});

describe('admin listing notification navigation', () => {
  it('selects Deleted in the URL and requests deleted listings', async () => {
    renderModeration(['/admin/listings']);

    fireEvent.click(await screen.findByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Deleted' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/listings?status=DELETED'));
    expect(requestedQueries).toContainEqual(expect.objectContaining({ isDeleted: true, status: undefined }));
  });

  it('shows removal only when both listing permissions are present', async () => {
    userPermissions.splice(0, userPermissions.length, 'LISTINGS_READ');
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);

    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    expect(within(dialog).queryByRole('button', { name: 'Delete listing' })).not.toBeInTheDocument();
  });

  it('requires a nonblank reason and a separate confirmation naming the listing before removal', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const listingDialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    fireEvent.click(within(listingDialog).getByRole('button', { name: 'Delete listing' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a reason before removing this listing.');
    expect(removeMutation).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Removal reason' }), {
      target: { value: '   Duplicate listing  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('dialog', { name: 'Confirm removal of Notification listing' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));

    await waitFor(() => expect(removeMutation).toHaveBeenCalledWith({
      listingId: 'listing-1',
      reason: 'Duplicate listing',
    }));
  });

  it('sends no removal request when either removal step is canceled', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const listingDialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    fireEvent.click(within(listingDialog).getByRole('button', { name: 'Delete listing' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(removeMutation).not.toHaveBeenCalled();

    fireEvent.click(within(listingDialog).getByRole('button', { name: 'Delete listing' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Removal reason' }), {
      target: { value: 'Duplicate listing' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(removeMutation).not.toHaveBeenCalled();
  });

  it.each(['RESERVED', 'SOLD'] as const)('does not offer removal for %s listings', async (status) => {
    listings.splice(0, listings.length, { ...listing, status });
    renderModeration([`/admin/listings?listing=listing-1&status=${status}`]);

    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    expect(within(dialog).queryByRole('button', { name: 'Delete listing' })).not.toBeInTheDocument();
  });

  it('shows the removal reason and restores a deleted listing', async () => {
    const deletedListing = {
      ...listing,
      deletionReason: 'Duplicate listing',
      deletedAt: '2026-10-01T00:00:00.000Z',
    } as AdminListing;
    listings.splice(0, listings.length, deletedListing);
    renderModeration(['/admin/listings?listing=listing-1&status=DELETED']);

    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    expect(within(dialog).getByText('Duplicate listing')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));

    await waitFor(() => expect(restoreMutation).toHaveBeenCalledWith({ listingId: 'listing-1' }));
  });

  it('restores a selected listing from the URL through browser back and forward', async () => {
    renderModeration([
      '/admin/listings?status=PENDING',
      '/admin/listings?listing=listing-1&status=PENDING',
    ]);

    expect(await screen.findByRole('dialog', { name: 'Notification listing' })).toBeInTheDocument();
    fireEvent.click([...document.querySelectorAll('button')].find(button => button.textContent === 'Back')!);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click([...document.querySelectorAll('button')].find(button => button.textContent === 'Forward')!);

    expect(await screen.findByRole('dialog', { name: 'Notification listing' })).toBeInTheDocument();
  });

  it('removes an unavailable listing selection and leaves the moderation list open', async () => {
    listings.length = 0;
    renderModeration(['/admin/listings?listing=missing-listing&status=PENDING']);

    expect(await screen.findByText('No listings found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Notification listing' })).not.toBeInTheDocument();
  });

  it('links the seller name in the review modal to the seller profile', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);

    const sellerLink = await screen.findByRole('link', { name: 'Test Seller' });

    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(sellerLink.parentElement).not.toHaveTextContent('…');
    fireEvent.click(sellerLink);

    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1');
  });

  it('keeps card quick actions limited to approve and reject', async () => {
    renderModeration(['/admin/listings?status=PENDING']);

    expect(await screen.findByText('Notification listing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request revisions' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        status: 'APPROVED',
      });
    });
  });

  it('requires nonblank feedback before requesting revisions', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const feedbackField = await screen.findByRole('textbox');
    const requestRevisionsButton = await screen.findByRole('button', { name: 'Request revisions' });

    fireEvent.click(requestRevisionsButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter feedback before requesting revisions.');
    fireEvent.change(feedbackField, { target: { value: ' \t\n ' } });
    fireEvent.click(requestRevisionsButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter feedback before requesting revisions.');
    expect(moderationMutation).not.toHaveBeenCalled();
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('submits trimmed revision feedback with the moderation status in one request', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);

    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: '  Add clearer photos.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request revisions' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        feedback: 'Add clearer photos.',
        status: 'NEEDS_REVISION',
      });
    });
    expect(moderationMutation).toHaveBeenCalledTimes(1);
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('submits rejection without feedback in the moderation request', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        status: 'REJECTED',
      });
    });
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('submits supplied rejection feedback with the moderation request', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });

    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: '  Listing does not match its description.  ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        feedback: 'Listing does not match its description.',
        status: 'REJECTED',
      });
    });
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('keeps approval feedback optional and includes it in the moderation request', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });

    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: '  Listing approved.  ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        feedback: 'Listing approved.',
        status: 'APPROVED',
      });
    });
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('submits approval without feedback when the form is blank', async () => {
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);
    const dialog = await screen.findByRole('dialog', { name: 'Notification listing' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(moderationMutation).toHaveBeenCalledWith({
        listingId: 'listing-1',
        status: 'APPROVED',
      });
    });
    expect(feedbackMutation).not.toHaveBeenCalled();
  });

  it('displays the revision status using the existing status label', async () => {
    listings.splice(0, listings.length, {
      ...listing,
      status: 'NEEDS_REVISION',
    });
    renderModeration(['/admin/listings?listing=listing-1&status=NEEDS_REVISION']);

    const revisionDialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    expect(within(revisionDialog).getByText('Needs Revision')).toBeInTheDocument();
  });

  it('keeps existing rejected listings displayed as rejected', async () => {
    listings.splice(0, listings.length, {
      ...listing,
      status: 'REJECTED',
    });
    renderModeration(['/admin/listings?listing=listing-1&status=REJECTED']);

    const rejectionDialog = await screen.findByRole('dialog', { name: 'Notification listing' });
    expect(within(rejectionDialog).getByText('Rejected')).toBeInTheDocument();
    expect(screen.queryByText('Needs Revision')).not.toBeInTheDocument();
  });
});
