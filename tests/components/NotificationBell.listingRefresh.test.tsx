import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from '@/components/NotificationBell';
import { getMyListingsOptions } from '@/queries/myListings.query';

const { listMyListings, listNotifications, markAllNotificationsRead, markNotificationRead } = vi.hoisted(() => ({
  listMyListings: vi.fn(),
  listNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('@/services/listing.service', () => ({ listMyListings }));
vi.mock('@/services/notification.service', () => ({ listNotifications, markAllNotificationsRead, markNotificationRead }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => 'seller-token' } }));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function ListingTitle() {
  const { data } = useQuery(getMyListingsOptions());
  return <p>{data?.data[0]?.title}</p>;
}

function renderWithQueries() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationBell />
        <ListingTitle />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('listing notification refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['LISTING_REMOVED', 'LISTING_RESTORED'])(
    'refreshes seller listings after reading a %s notice',
    async (type) => {
      const notification = {
        id: 'notification-1',
        entityId: 'listing-1',
        userId: 'seller-1',
        audience: 'USER',
        body: 'Listing status changed',
        destination: {
          recipient: 'SELLER',
          resource: 'listing',
          section: 'list',
        },
        entityType: 'listing',
        metadata: {},
        title: 'Listing status changed',
        type,
        readAt: null,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z',
      };
      listNotifications.mockResolvedValue({ data: [notification] });
      markNotificationRead.mockResolvedValue({ data: notification });
      listMyListings
        .mockResolvedValueOnce({ data: [{ title: 'Listing before refresh' }] })
        .mockResolvedValue({ data: [{ title: 'Listing after refresh' }] });
      renderWithQueries();

      expect(await screen.findByText('Listing before refresh')).toBeInTheDocument();
      fireEvent.click(await screen.findByRole('button', { name: /Listing status changed/ }));

      await waitFor(() => expect(screen.getByText('Listing after refresh')).toBeInTheDocument());
      expect(listMyListings).toHaveBeenCalledTimes(2);
    },
  );

  it('refreshes seller listings after marking all notifications read when a listing notice is present', async () => {
    listNotifications.mockResolvedValue({
      data: [{
        id: 'notification-1',
        entityId: 'listing-1',
        userId: 'seller-1',
        audience: 'USER',
        body: 'Listing removed',
        destination: { recipient: 'SELLER', resource: 'listing', section: 'list' },
        entityType: 'listing',
        metadata: {},
        title: 'Listing removed',
        type: 'LISTING_REMOVED',
        readAt: null,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z',
      }],
    });
    markAllNotificationsRead.mockResolvedValue({});
    listMyListings
      .mockResolvedValueOnce({ data: [{ title: 'Listing before refresh' }] })
      .mockResolvedValue({ data: [{ title: 'Listing after refresh' }] });
    renderWithQueries();

    expect(await screen.findByText('Listing before refresh')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));

    await waitFor(() => expect(screen.getByText('Listing after refresh')).toBeInTheDocument());
    expect(listMyListings).toHaveBeenCalledTimes(2);
  });
});
