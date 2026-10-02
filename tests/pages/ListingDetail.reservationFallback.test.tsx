import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppRoutes from '@/AppRoutes';

const { getMarketplaceListingOptionsMock } = vi.hoisted(() => ({
  getMarketplaceListingOptionsMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: vi.fn(), items: [] }),
}));

vi.mock('@/queries/marketplace.query', () => ({
  getListingMediaUrls: vi.fn(() => []),
  getMarketplaceListingOptions: getMarketplaceListingOptionsMock,
  getReservedOfferAmountOptions: vi.fn(() => ({ enabled: false, queryFn: async () => null, queryKey: ['reserved-offer-amount'] })),
}));

vi.mock('@/queries/myListings.query', () => ({
  useCancelMyListingReservationMutation: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
  useDeleteMyListingMutation: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
}));

vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/pages/Listings', () => ({ default: () => <main data-testid="listings-page" /> }));

function LocationObserver() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('reservation listing fallback route', () => {
  it('returns to listings when a valid listing URL cannot load its listing', async () => {
    getMarketplaceListingOptionsMock.mockReturnValue({
      queryFn: async () => null,
      queryKey: ['marketplace', 'listing', 'detail', 'unavailable-listing', 'public'],
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/listing/unavailable-listing']}>
          <LocationObserver />
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/listings'), { timeout: 5000 });
    expect(await screen.findByTestId('listings-page')).toBeInTheDocument();
  });
});
