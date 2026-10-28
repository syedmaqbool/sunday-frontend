import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import MyListings from '@/pages/MyListings';

const { listMyListingsMock, receivedOffersCalls } = vi.hoisted(() => ({
  listMyListingsMock: vi.fn(),
  receivedOffersCalls: [] as Array<{ listingId?: string; selectedOfferId?: string }>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'seller-1' } }),
}));

vi.mock('@/services/listing.service', async importOriginal => ({
  ...(await importOriginal<typeof import('@/services/listing.service')>()),
  listMyListings: listMyListingsMock,
}));

vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/MyListingFeedbackWidgets', () => ({ MyListingFeedbackInline: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/ReceivedOffers', () => ({
  ReceivedOffers: (properties: { listingId?: string; selectedOfferId?: string }) => {
    receivedOffersCalls.push(properties);
    return null;
  },
}));

function LocationDisplay() {
  const location = useLocation();

  return <p>{location.search}</p>;
}

function createListing(status: string) {
  return {
    id: 'listing-1',
    brand: 'Vintage',
    coverImage: null,
    deletedByAdminId: null,
    deletionReason: null,
    price: 100,
    reservedUntil: null,
    status,
    title: `A ${status.toLowerCase()} listing`,
    weight: null,
  };
}

function renderMyListings(initialEntry = '/my-listings') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationDisplay />
        <MyListings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('my listings status tabs', () => {
  beforeEach(() => {
    listMyListingsMock.mockReset();
    receivedOffersCalls.length = 0;
    listMyListingsMock.mockResolvedValue({
      data: [createListing('PENDING')],
      pagination: { page: 1, size: 100, totalItems: 1 },
    });
  });

  it('requests only the active tab statuses and displays the backend response', async () => {
    listMyListingsMock.mockResolvedValue({
      data: [createListing('APPROVED')],
      pagination: { page: 1, size: 100, totalItems: 1 },
    });
    renderMyListings('/my-listings?tab=pending');

    expect(await screen.findByText('A approved listing')).toBeInTheDocument();
    expect(listMyListingsMock).toHaveBeenCalledWith({
      page: 1,
      size: 100,
      status: ['PENDING', 'REJECTED', 'NEEDS_REVISION'],
    });
  });

  it('requests approved and reserved listings by default', async () => {
    listMyListingsMock.mockResolvedValue({
      data: [createListing('RESERVED')],
      pagination: { page: 1, size: 100, totalItems: 1 },
    });
    renderMyListings();

    expect(await screen.findByText('A reserved listing')).toBeInTheDocument();
    expect(listMyListingsMock).toHaveBeenCalledWith({
      page: 1,
      size: 100,
      status: ['APPROVED', 'RESERVED'],
    });
    expect(screen.getByRole('tab', { name: /Approved/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps the status tabs available when the selected tab has no listings', async () => {
    listMyListingsMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, size: 100, totalItems: 0 },
    });
    renderMyListings('/my-listings?tab=pending');

    expect(await screen.findByText('Nothing pending review')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Approved/ }), {
      button: 0,
      ctrlKey: false,
    });

    await waitFor(() => {
      expect(listMyListingsMock).toHaveBeenLastCalledWith({
        page: 1,
        size: 100,
        status: ['APPROVED', 'RESERVED'],
      });
    });
  });

  it('updates the URL and requests the selected tab statuses', async () => {
    listMyListingsMock.mockResolvedValue({
      data: [createListing('SOLD')],
      pagination: { page: 1, size: 100, totalItems: 1 },
    });
    renderMyListings();

    await screen.findByRole('tab', { name: /Approved/ });
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Sold/ }), {
      button: 0,
      ctrlKey: false,
    });

    expect(await screen.findByText('A sold listing')).toBeInTheDocument();
    expect(await screen.findByText(/tab=sold/)).toBeInTheDocument();
    await waitFor(() => {
      expect(listMyListingsMock).toHaveBeenLastCalledWith({
        page: 1,
        size: 100,
        status: ['SOLD'],
      });
    });
  });

  it('keeps Offers Received as an unscoped offer view', async () => {
    renderMyListings('/my-listings?tab=offers');

    await screen.findByRole('tab', { name: 'Offers Received' });

    expect(listMyListingsMock).toHaveBeenCalledWith({ page: 1, size: 100, status: undefined });
    expect(receivedOffersCalls).toContainEqual({ selectedOfferId: null });
    expect(receivedOffersCalls.every(properties => properties.listingId === undefined)).toBe(true);
  });
});
