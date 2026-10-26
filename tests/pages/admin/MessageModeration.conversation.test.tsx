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

const flaggedMessagesResponse = {
  data: [{
    id: 'flagged-message-1',
    buyerId: 'buyer-1',
    conversationId: 'conversation-1',
    listingId: 'listing-1',
    sellerId: 'seller-1',
    senderId: 'seller-1',
    buyerFullName: 'Buyer One',
    content: 'Reach me at 555-0123',
    flagReasons: ['PHONE_NUMBER'],
    isFlagged: true,
    listingTitle: 'Antique chair',
    sellerFullName: 'Seller One',
    type: 'LISTING',
    conversationCreatedAt: '2026-10-07T12:00:00.000Z',
    readAt: null,
    createdAt: '2026-10-07T12:01:00.000Z',
    updatedAt: '2026-10-07T12:01:00.000Z',
  }],
  message: 'Flagged messages loaded',
  pagination: {
    currentPage: 1,
    lastPage: 1,
    nextPage: null,
    perPage: 100,
    prevPage: null,
    total: 1,
  },
  statusCode: 200,
};

const flaggedConversationResponse = {
  data: {
    buyerId: 'buyer-1',
    conversationId: 'conversation-1',
    listingId: 'listing-1',
    sellerId: 'seller-1',
    buyerFullName: 'Buyer One',
    listingTitle: 'Antique chair',
    messages: [
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        senderId: 'buyer-1',
        attachments: [{
          id: 'image-1',
          filename: 'chair-detail.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          type: 'IMAGE',
          url: '/api/v1/admin/messages/flagged-message-1/attachments/image-1?token=private-image',
        }],
        content: 'The chair has a small mark.',
        flagReasons: [],
        isFlagged: false,
        senderRole: 'BUYER',
        readAt: null,
        createdAt: '2026-10-07T12:00:00.000Z',
        updatedAt: '2026-10-07T12:00:00.000Z',
      },
      {
        id: 'flagged-message-1',
        conversationId: 'conversation-1',
        senderId: 'seller-1',
        attachments: [{
          id: 'video-1',
          filename: 'chair-inspection.mp4',
          mimetype: 'video/mp4',
          size: 10_240,
          type: 'VIDEO',
          url: '/api/v1/admin/messages/flagged-message-1/attachments/video-1?token=private-video',
        }],
        content: 'Reach me at 555-0123',
        flagReasons: ['PHONE_NUMBER'],
        isFlagged: true,
        senderRole: 'SELLER',
        readAt: null,
        createdAt: '2026-10-07T12:01:00.000Z',
        updatedAt: '2026-10-07T12:01:00.000Z',
      },
    ],
    sellerFullName: 'Seller One',
    type: 'LISTING',
  },
  message: 'Conversation loaded',
  pagination: {
    currentPage: 1,
    lastPage: 2,
    nextPage: 2,
    perPage: 50,
    prevPage: null,
    total: 3,
  },
  statusCode: 200,
};

const flaggedConversationPageTwoResponse = {
  ...flaggedConversationResponse,
  data: {
    ...flaggedConversationResponse.data,
    messages: [{
      id: 'message-3',
      conversationId: 'conversation-1',
      senderId: 'buyer-1',
      attachments: [],
      content: 'A later message with contact details.',
      flagReasons: ['EMAIL_ADDRESS'],
      isFlagged: true,
      senderRole: 'BUYER',
      readAt: null,
      createdAt: '2026-10-07T12:02:00.000Z',
      updatedAt: '2026-10-07T12:02:00.000Z',
    }],
  },
  pagination: {
    currentPage: 2,
    lastPage: 2,
    nextPage: null,
    perPage: 50,
    prevPage: 1,
    total: 3,
  },
};

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

describe('admin active flagged conversation review', () => {
  beforeEach(() => {
    apiMocks.delete.mockReset();
    apiMocks.patch.mockReset();
    apiMocks.get.mockReset();
    apiMocks.get.mockImplementation((url: string, options?: { searchParams?: { page?: number } }) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve(flaggedMessagesResponse);
      }

      if (url === '/api/v1/admin/messages/flagged-message-1/conversation') {
        return Promise.resolve(options?.searchParams?.page === 2
          ? flaggedConversationPageTwoResponse
          : flaggedConversationResponse);
      }

      throw new Error(`Unexpected API request: ${url}`);
    });
  });

  it('opens the full active conversation without changing participant read state', async () => {
    renderMessageModeration();

    fireEvent.click(await screen.findByRole('button', { name: /Review/ }));

    expect(await screen.findByRole('heading', { name: 'Conversation Review' })).toBeInTheDocument();
    expect(await screen.findByText('Buyer One')).toBeInTheDocument();
    expect(screen.getAllByText('Seller One')).toHaveLength(2);
    expect(screen.getAllByText('Antique chair')).toHaveLength(2);
    expect(screen.getByText('The chair has a small mark.')).toBeInTheDocument();
    expect(screen.getAllByText('Reach me at 555-0123')).toHaveLength(2);
    expect(screen.getAllByText('PHONE_NUMBER')).toHaveLength(2);
    expect(screen.getByText('Buyer · Buyer One')).toBeInTheDocument();
    expect(screen.getByText('Seller · Seller One')).toBeInTheDocument();
    const image = screen.getByAltText('chair-detail.jpg');
    expect(image).toHaveAttribute(
      'src',
      '/api/v1/admin/messages/flagged-message-1/attachments/image-1?token=private-image',
    );
    expect(image.closest('a')).toHaveAttribute('target', '_blank');
    const video = screen.getByLabelText('chair-inspection.mp4');
    expect(video).toHaveAttribute(
      'src',
      '/api/v1/admin/messages/flagged-message-1/attachments/video-1?token=private-video',
    );
    expect(video).toHaveAttribute('controls');
    expect(screen.getByRole('button', { name: 'Dismiss Flag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Message' })).toBeInTheDocument();
    expect(apiMocks.patch).not.toHaveBeenCalled();
    expect(apiMocks.delete).not.toHaveBeenCalled();
    expect(apiMocks.get.mock.calls.every(([url]) => String(url).startsWith('/api/v1/admin/messages'))).toBe(true);

    const firstMessage = screen.getByText('The chair has a small mark.');
    fireEvent.click(screen.getByRole('button', { name: 'Load more messages' }));
    const laterMessage = await screen.findByText('A later message with contact details.');
    expect(firstMessage.compareDocumentPosition(laterMessage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('EMAIL_ADDRESS')).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith(
      '/api/v1/admin/messages/flagged-message-1/conversation',
      { searchParams: { page: 2, size: 50 } },
    );
  });

  it('opens direct conversations without requiring listing data', async () => {
    const directFlaggedMessagesResponse = {
      ...flaggedMessagesResponse,
      data: [{
        ...flaggedMessagesResponse.data[0],
        id: 'flagged-direct-message',
        conversationId: 'direct-conversation',
        listingId: null,
        listingTitle: null,
        type: 'DIRECT',
      }],
    };
    const directConversationResponse = {
      ...flaggedConversationResponse,
      data: {
        ...flaggedConversationResponse.data,
        conversationId: 'direct-conversation',
        listingId: null,
        listingTitle: null,
        type: 'DIRECT',
      },
    };
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve(directFlaggedMessagesResponse);
      }

      if (url === '/api/v1/admin/messages/flagged-direct-message/conversation') {
        return Promise.resolve(directConversationResponse);
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    renderMessageModeration();
    fireEvent.click(await screen.findByRole('button', { name: /Review/ }));

    expect(await screen.findByText('Direct conversation')).toBeInTheDocument();
    const reviewDialog = screen.getByRole('dialog');
    expect(within(reviewDialog).getByText('Buyer One')).toBeInTheDocument();
    expect(within(reviewDialog).getByText('Seller One')).toBeInTheDocument();
  });

  it('uses the saved listing title when the original listing is gone', async () => {
    const deletedListingMessagesResponse = {
      ...flaggedMessagesResponse,
      data: [{
        ...flaggedMessagesResponse.data[0],
        listingTitle: 'Saved title for deleted listing',
      }],
    };
    const deletedListingConversationResponse = {
      ...flaggedConversationResponse,
      data: {
        ...flaggedConversationResponse.data,
        listingTitle: 'Saved title for deleted listing',
      },
    };
    apiMocks.get.mockImplementation((url: string) => {
      if (url === '/api/v1/admin/messages/flagged') {
        return Promise.resolve(deletedListingMessagesResponse);
      }

      if (url === '/api/v1/admin/messages/flagged-message-1/conversation') {
        return Promise.resolve(deletedListingConversationResponse);
      }

      throw new Error(`Unexpected API request: ${url}`);
    });

    renderMessageModeration();
    fireEvent.click(await screen.findByRole('button', { name: /Review/ }));

    const reviewDialog = await screen.findByRole('dialog');
    expect(await within(reviewDialog).findByText('Saved title for deleted listing')).toBeInTheDocument();
  });
});
