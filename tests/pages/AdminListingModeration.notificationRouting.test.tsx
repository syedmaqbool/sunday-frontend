import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ListingModeration from '@/pages/admin/ListingModeration';

const { listing, listings } = vi.hoisted(() => ({
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
}));

vi.mock('@/queries/adminListing.query', () => ({
  getAdminListingsOptions: (status: string) => ({
    queryFn: async () => status === 'PENDING' || status === 'all' ? listings : [],
    queryKey: ['admin-listings', status],
  }),
  useCreateAdminListingFeedbackMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useModerateListingMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
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

describe('admin listing notification navigation', () => {
  it('restores a selected listing from the URL through browser back and forward', async () => {
    listings.splice(0, listings.length, listing);
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
    listings.splice(0, listings.length, listing);
    renderModeration(['/admin/listings?listing=listing-1&status=PENDING']);

    const sellerLink = await screen.findByRole('link', { name: 'Test Seller' });

    expect(sellerLink).toHaveAttribute('href', '/seller/seller-1');
    expect(sellerLink.parentElement).not.toHaveTextContent('…');
    fireEvent.click(sellerLink);

    expect(screen.getByTestId('location')).toHaveTextContent('/seller/seller-1');
  });
});
