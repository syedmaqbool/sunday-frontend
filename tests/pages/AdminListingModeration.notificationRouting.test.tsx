import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListingModeration from '@/pages/admin/ListingModeration';

const { feedbackMutation, listing, listings, moderationMutation } = vi.hoisted(() => ({
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
}));

vi.mock('@/queries/adminListing.query', () => ({
  getAdminListingsOptions: (status: string) => ({
    queryFn: async () => status === 'all'
      ? listings
      : listings.filter(listing => listing.status === status),
    queryKey: ['admin-listings', status],
  }),
  useCreateAdminListingFeedbackMutation: () => ({ isPending: false, mutateAsync: feedbackMutation }),
  useModerateListingMutation: () => ({ isPending: false, mutateAsync: moderationMutation }),
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
  return <output data-testid="location">{location.pathname}</output>;
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
  listings.splice(0, listings.length, listing);
});

describe('admin listing notification navigation', () => {
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
