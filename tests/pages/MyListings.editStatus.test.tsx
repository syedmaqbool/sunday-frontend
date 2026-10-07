import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyListings from '@/pages/MyListings';

const { listingsState } = vi.hoisted(() => ({
  listingsState: { data: [] as any[] },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'seller-1' } }),
}));

vi.mock('@/queries/myListings.query', () => ({
  getMyListingsOptions: () => ({
    queryFn: async () => ({ data: listingsState.data }),
    queryKey: ['my-listings', 'list'],
  }),
  useCancelMyListingReservationMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteMyListingMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock('@/components/BoostDialog', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/MyListingFeedbackWidgets', () => ({ MyListingFeedbackInline: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/ReceivedOffers', () => ({ ReceivedOffers: () => null }));

function renderMyListings(status: string) {
  const tab = ['APPROVED', 'RESERVED'].includes(status)
    ? 'approved'
    : status === 'SOLD' ? 'sold' : 'pending';
  listingsState.data = [{
    brand: 'Vintage',
    id: 'listing-1',
    price: 100,
    reservedUntil: status === 'RESERVED' ? '2099-01-01T00:00:00.000Z' : null,
    status,
    title: 'Vintage jacket',
  }];
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/my-listings?tab=${tab}`]}>
        <MyListings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('My Listings edit actions', () => {
  beforeEach(() => {
    listingsState.data = [];
  });

  it.each(['PENDING', 'REJECTED', 'NEEDS_REVISION'])(
    'shows edit for %s and removes the separate resubmit action',
    async (status) => {
      renderMyListings(status);

      expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Resubmit' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    },
  );

  it.each(['APPROVED', 'RESERVED', 'SOLD'])(
    'hides edit for %s while preserving available actions',
    async (status) => {
      renderMyListings(status);

      await screen.findByText('Vintage jacket');
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    },
  );

  it('keeps reservation cancellation available for reserved listings', async () => {
    renderMyListings('RESERVED');

    expect(await screen.findByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
  });
});
