import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessageModeration from '@/pages/admin/MessageModeration';

const apiMocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/services/ky.instance', () => ({
  authInstance: {
    delete: (...parameters: unknown[]) => ({ json: () => apiMocks.delete(...parameters) }),
    get: (...parameters: unknown[]) => ({ json: () => apiMocks.get(...parameters) }),
    patch: (...parameters: unknown[]) => ({ json: () => apiMocks.patch(...parameters) }),
  },
}));

const historyResponse = {
  data: [
    {
      id: 'dismissed-history-1',
      conversationId: 'conversation-1',
      messageId: 'dismissed-message-1',
      senderId: 'buyer-1',
      flagReasons: ['PHONE_NUMBER'],
      resolutionAction: 'DISMISSED' as const,
      flaggedAt: '2026-10-01T12:00:00.000Z',
      resolvedAt: '2026-10-02T12:00:00.000Z',
    },
    {
      id: 'removed-history-1',
      conversationId: 'conversation-2',
      messageId: 'removed-message-1',
      senderId: 'seller-2',
      flagReasons: ['EMAIL_ADDRESS'],
      resolutionAction: 'REMOVED' as const,
      flaggedAt: '2026-09-20T12:00:00.000Z',
      resolvedAt: '2026-09-21T12:00:00.000Z',
    },
  ],
  message: 'History loaded',
  pagination: {
    currentPage: 1,
    lastPage: 1,
    nextPage: null,
    perPage: 20,
    prevPage: null,
    total: 2,
  },
  statusCode: 200,
};

function resolvedConversationResponse(messageId: string, hasFlaggedMessage: boolean) {
  const messages = [
    {
      id: 'before-message',
      conversationId: 'conversation-1',
      senderId: 'seller-1',
      attachments: [],
      content: 'Can you send a photo?',
      flagReasons: [],
      isFlagged: false,
      senderRole: 'SELLER' as const,
      readAt: null,
      createdAt: '2026-10-01T11:59:00.000Z',
      updatedAt: '2026-10-01T11:59:00.000Z',
    },
    ...(hasFlaggedMessage
      ? [{
          id: messageId,
          conversationId: 'conversation-1',
          senderId: 'buyer-1',
          attachments: [],
          content: 'My number is 555-0123',
          flagReasons: ['PHONE_NUMBER'],
          isFlagged: false,
          senderRole: 'BUYER' as const,
          readAt: null,
          createdAt: '2026-10-01T12:00:00.000Z',
          updatedAt: '2026-10-01T12:00:00.000Z',
        }]
      : []),
    {
      id: 'after-message',
      conversationId: 'conversation-1',
      senderId: 'seller-1',
      attachments: [],
      content: 'Thanks, I got it.',
      flagReasons: [],
      isFlagged: false,
      senderRole: 'SELLER' as const,
      readAt: null,
      createdAt: '2026-10-01T12:01:00.000Z',
      updatedAt: '2026-10-01T12:01:00.000Z',
    },
  ];

  return {
    data: {
      buyerId: 'buyer-1',
      conversationId: 'conversation-1',
      listingId: 'listing-1',
      sellerId: 'seller-1',
      buyerFullName: 'Buyer One',
      listingTitle: 'Antique chair',
      messages,
      sellerFullName: 'Seller One',
      type: 'LISTING' as const,
    },
    message: 'Conversation loaded',
    pagination: {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      perPage: 50,
      prevPage: null,
      total: messages.length,
    },
    statusCode: 200,
  };
}

function renderMessageModeration() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MessageModeration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin resolved flagged conversation history', () => {
  beforeEach(() => {
    apiMocks.delete.mockReset();
    apiMocks.patch.mockReset();
    apiMocks.get.mockReset().mockImplementation((url: string, options?: { searchParams?: { page?: number } }) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve({ data: [], message: 'No active flags', pagination: { nextPage: null } });
      }

      if (url === '/api/v1/admin/messages/history') {
        return Promise.resolve(historyResponse);
      }

      if (url === '/api/v1/admin/messages/history/dismissed-history-1/conversation') {
        return Promise.resolve(resolvedConversationResponse('dismissed-message-1', true));
      }

      if (url === '/api/v1/admin/messages/history/removed-history-1/conversation') {
        return Promise.resolve(resolvedConversationResponse('removed-message-1', false));
      }

      throw new Error(`Unexpected API request: ${url} ${JSON.stringify(options)}`);
    });
  });

  it('lists resolved flags with sender, reason, resolution and resolved time', async () => {
    renderMessageModeration();

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(await screen.findByText('Sender: buyer-1')).toBeInTheDocument();
    expect(screen.getByText('Sender: seller-2')).toBeInTheDocument();
    expect(screen.getByText('PHONE_NUMBER')).toBeInTheDocument();
    expect(screen.getByText('Dismissed')).toBeInTheDocument();
    expect(screen.getByText('Removed')).toBeInTheDocument();
    expect(screen.getByText(/Oct 2, 2026 at/)).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/api/v1/admin/messages/history', { searchParams: { page: 1, size: 20 } });
  });

  it('opens dismissed history into the full current conversation with its message', async () => {
    renderMessageModeration();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open conversation for PHONE_NUMBER from buyer-1' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Buyer One')).toBeInTheDocument();
    expect(within(dialog).getByText('Seller One')).toBeInTheDocument();
    expect(await within(dialog).findByText('Can you send a photo?')).toBeInTheDocument();
    expect(within(dialog).getByText('My number is 555-0123')).toBeInTheDocument();
    expect(within(dialog).getByText('Thanks, I got it.')).toBeInTheDocument();
    expect(within(dialog).getByText(/dismissed/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Dismiss Flag' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Remove Message' })).not.toBeInTheDocument();
    expect(apiMocks.patch).not.toHaveBeenCalled();
    expect(apiMocks.delete).not.toHaveBeenCalled();
  });

  it('opens removed history without message content or media and identifies the removal event', async () => {
    renderMessageModeration();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open conversation for EMAIL_ADDRESS from seller-2' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Can you send a photo?')).toBeInTheDocument();
    expect(within(dialog).getByText('Thanks, I got it.')).toBeInTheDocument();
    expect(within(dialog).getByText('Message removed by moderation')).toBeInTheDocument();
    expect(within(dialog).queryByText('My number is 555-0123')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Dismiss Flag' })).not.toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith(
      '/api/v1/admin/messages/history/removed-history-1/conversation',
      { searchParams: { page: 1, size: 50 } },
    );
  });

  it('keeps active flagged items and their actions on the Active view', async () => {
    apiMocks.get.mockImplementation((url: string, options?: { searchParams?: { page?: number } }) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve({
          data: [{
            id: 'active-message',
            buyerId: 'buyer-1',
            conversationId: 'conversation-1',
            listingId: 'listing-1',
            sellerId: 'seller-1',
            senderId: 'seller-1',
            attachments: [],
            buyerFullName: 'Buyer One',
            content: 'Active flag content',
            flagReasons: ['PHONE_NUMBER'],
            isFlagged: true,
            listingTitle: 'Antique chair',
            sellerFullName: 'Seller One',
            type: 'LISTING',
            conversationCreatedAt: '2026-10-01T11:00:00.000Z',
            readAt: null,
            createdAt: '2026-10-01T12:00:00.000Z',
            updatedAt: '2026-10-01T12:00:00.000Z',
          }],
          message: 'Active flags loaded',
          pagination: { nextPage: null },
        });
      }

      if (url === '/api/v1/admin/messages/history') {
        return Promise.resolve(historyResponse);
      }

      throw new Error(`Unexpected API request: ${url} ${JSON.stringify(options)}`);
    });

    renderMessageModeration();

    expect(await screen.findByText('Active flag content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('does not show expired cases returned outside the active retention window', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve({ data: [], message: 'No active flags', pagination: { nextPage: null } });
      }

      if (url === '/api/v1/admin/messages/history') {
        return Promise.resolve({ ...historyResponse, data: [], pagination: { ...historyResponse.pagination, total: 0 } });
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    renderMessageModeration();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(await screen.findByText('No recent resolved flags')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open conversation/ })).not.toBeInTheDocument();
  });

  it('does not display a conversation when the retained history endpoint rejects an expired case', async () => {
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve({ data: [], message: 'No active flags', pagination: { nextPage: null } });
      }

      if (url === '/api/v1/admin/messages/history') {
        return Promise.resolve({ ...historyResponse, data: [historyResponse.data[0]] });
      }

      if (url === '/api/v1/admin/messages/history/dismissed-history-1/conversation') {
        return Promise.reject(new Error('History case has expired'));
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    renderMessageModeration();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open conversation for PHONE_NUMBER from buyer-1' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Conversation could not be loaded.');
    expect(within(dialog).queryByText('My number is 555-0123')).not.toBeInTheDocument();
  });
});
