import type { Notification } from '@/types/notification.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from '@/components/NotificationBell';

const { listNotifications, markAllNotificationsRead, markNotificationRead, timeline } = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  timeline: [] as string[],
}));

vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => 'test-token' } }));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/services/notification.service', () => ({
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
}));

function LocationObserver() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    timeline.push('navigate');
  }, [location.pathname, location.search]);
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  );
}

function makeNotification(
  audience: Notification['audience'],
  destination: Notification['destination'],
  type: Notification['type'] = audience === 'ADMIN' ? 'SUPPORT_TICKET_REPLIED' : 'MESSAGE_RECEIVED',
): Notification {
  return {
    id: 'notification-1',
    entityId: null,
    userId: null,
    audience,
    body: 'Notification body',
    destination,
    entityType: null,
    metadata: {},
    title: 'New message',
    type,
    readAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function renderBell(notification: Notification, initialEntry = '/') {
  listNotifications.mockResolvedValue({
    data: [notification],
    message: 'ok',
    pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 20, prevPage: null, total: 1 },
    statusCode: 200,
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={(
              <>
                <NotificationBell audience={notification.audience.toLowerCase() as 'admin' | 'user'} />
                <LocationObserver />
              </>
            )}
            path="*"
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  timeline.length = 0;
});

describe('notificationBell destination navigation', () => {
  it('marks a user message notification read before navigating to its conversation', async () => {
    markNotificationRead.mockImplementation(async () => {
      timeline.push('mark-read');
      return { data: {}, statusCode: 200 };
    });
    renderBell(makeNotification('USER', {
      resourceId: 'conversation-1',
      focusedChild: { resourceId: 'message-1', resource: 'message' },
      resource: 'conversation',
      section: 'messages',
    }));

    fireEvent.click(await screen.findByRole('button', { name: /New message/ }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/messages?conversation=conversation-1&message=message-1'));
    expect(timeline.slice(-2)).toEqual(['mark-read', 'navigate']);
  });

  it('navigates from the admin bell when marking a support notification read fails', async () => {
    markNotificationRead.mockImplementation(async () => {
      timeline.push('mark-read');
      throw new Error('network unavailable');
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderBell(makeNotification('ADMIN', {
      resourceId: 'ticket-2',
      focusedChild: { resourceId: 'message-2', resource: 'supportTicketMessage' },
      resource: 'supportTicket',
      section: 'messages',
    }));

    fireEvent.click(await screen.findByRole('button', { name: /New message/ }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/support?ticket=ticket-2&message=message-2'));
    expect(timeline.slice(-2)).toEqual(['mark-read', 'navigate']);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('opens a reservation listing with a refresh-safe URL and browser back returns to the previous page', async () => {
    markNotificationRead.mockResolvedValue({ data: {}, statusCode: 200 });
    renderBell(makeNotification('USER', {
      resourceId: 'listing-1',
      recipient: 'BUYER',
      resource: 'listing',
      section: 'detail',
    }, 'RESERVATION_CREATED'), '/my-offers');

    fireEvent.click(await screen.findByRole('button', { name: /New message/ }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/listing/listing-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-offers'));
  });
});
