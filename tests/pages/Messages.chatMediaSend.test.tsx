import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Messages from '@/pages/Messages';

const requestState = vi.hoisted(() => ({
  failNextMessage: false,
  get: vi.fn(),
  holdNextMessage: false,
  lastMessageRequest: undefined as { body?: BodyInit; json?: unknown } | undefined,
  messages: [] as Array<Record<string, unknown>>,
  post: vi.fn(),
  releaseMessageRequest: undefined as (() => void) | undefined,
}));
const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

const activeConversation = {
  id: 'conversation-1',
  buyerId: 'user-1',
  listingId: null,
  offerId: null,
  sellerId: 'seller-1',
  amount: null,
  buyerFullName: 'Buyer',
  counterAmount: null,
  lastMessageContent: null,
  listingStatus: null,
  listingTitle: 'Listing',
  offerStatus: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  type: 'LISTING',
  unreadCount: 0,
  lastMessageCreatedAt: null,
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
};

vi.mock('@/services/ky.instance', () => ({
  authInstance: {
    get: requestState.get,
    post: requestState.post,
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'user-1' } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));

function renderMessages() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={['/messages?conversation=conversation-1']}>
        <Routes>
          <Route element={<Messages />} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function imageFile(name: string) {
  return new File([new Uint8Array(1024)], name, { type: 'image/jpeg' });
}

function videoFile(name: string) {
  return new File([new Uint8Array(10 * 1024)], name, { type: 'video/mp4' });
}

function successResponse<Data>(data: Data) {
  return { data, message: 'OK', statusCode: 200 };
}

describe('messages chat media sending', () => {
  beforeEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: (file: File) => `blob:${file.name}`,
      },
      revokeObjectURL: { configurable: true, value: () => {} },
    });
    requestState.failNextMessage = false;
    requestState.holdNextMessage = false;
    requestState.releaseMessageRequest = undefined;
    requestState.messages = [];
    requestState.lastMessageRequest = undefined;
    requestState.get.mockReset().mockImplementation((path: string) => ({
      json: async () => successResponse(
        path === '/api/v1/me/conversations' ? [activeConversation] : requestState.messages,
      ),
    }));
    requestState.post.mockReset().mockImplementation((path: string, options: { body?: BodyInit; json?: unknown } = {}) => {
      if (path.endsWith('/read')) {
        return { json: async () => successResponse(null) };
      }

      requestState.lastMessageRequest = options;
      return {
        json: async () => {
          if (requestState.holdNextMessage) {
            requestState.holdNextMessage = false;
            await new Promise<void>((resolve) => {
              requestState.releaseMessageRequest = resolve;
            });
          }

          if (requestState.failNextMessage) {
            requestState.failNextMessage = false;
            throw new Error('Message send failed');
          }

          const formData = options.body instanceof FormData ? options.body : null;
          const files = formData?.getAll('attachments') as File[] | undefined;
          const jsonBody = options.json as { content?: string } | undefined;
          const message = {
            id: `message-${requestState.messages.length + 1}`,
            conversationId: activeConversation.id,
            senderId: 'user-1',
            attachments: files?.map((file, index) => ({
              id: `attachment-${index + 1}`,
              filename: file.name,
              mimetype: file.type,
              size: file.size,
              type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
              url: `https://private.example/attachment-${index + 1}`,
            })) ?? [],
            content: formData ? String(formData.get('content') ?? '') : jsonBody?.content ?? '',
            flagReasons: [],
            isFlagged: false,
            readAt: null,
            createdAt: '2026-10-27T12:00:00.000Z',
            updatedAt: '2026-10-27T12:00:00.000Z',
          };
          requestState.messages.push(message);
          return successResponse(message);
        },
      };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    if (createObjectUrlDescriptor) {
      Object.defineProperty(URL, 'createObjectURL', createObjectUrlDescriptor);
    }
    else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (revokeObjectUrlDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
    }
    else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });

  it('sends a caption and its selected files together, then displays the returned media', async () => {
    renderMessages();

    const caption = await screen.findByPlaceholderText('Type message...');
    fireEvent.change(caption, { target: { value: 'Please see this photo' } });
    fireEvent.change(screen.getByLabelText('Select photos and videos'), {
      target: { files: [imageFile('condition.jpg'), videoFile('condition.mp4')] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(requestState.post).toHaveBeenCalledWith(
      '/api/v1/me/conversations/conversation-1/messages',
      expect.objectContaining({ body: expect.any(FormData) }),
    ));
    const formData = requestState.lastMessageRequest?.body as FormData;
    expect(formData.get('content')).toBe('Please see this photo');
    expect((formData.getAll('attachments') as File[]).map(file => file.name)).toEqual([
      'condition.jpg',
      'condition.mp4',
    ]);
    expect(await screen.findByRole('img', { name: 'condition.jpg' })).toHaveAttribute(
      'src',
      'https://private.example/attachment-1',
    );
    expect(screen.getByLabelText('condition.mp4')).toHaveAttribute('src', 'https://private.example/attachment-2');
    expect(screen.getByLabelText('condition.mp4')).toHaveAttribute('controls');
    expect(caption).toHaveValue('');
    expect(screen.queryByLabelText('Preview condition.jpg')).not.toBeInTheDocument();
  });

  it('sends selected media without a caption', async () => {
    renderMessages();

    fireEvent.change(await screen.findByLabelText('Select photos and videos'), {
      target: { files: [imageFile('item-detail.jpg')] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(requestState.post).toHaveBeenCalledWith(
      '/api/v1/me/conversations/conversation-1/messages',
      expect.objectContaining({ body: expect.any(FormData) }),
    ));
    const formData = requestState.lastMessageRequest?.body as FormData;
    expect(formData.has('content')).toBe(false);
    expect((formData.getAll('attachments')[0] as File).name).toBe('item-detail.jpg');
    expect(await screen.findByRole('img', { name: 'item-detail.jpg' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Preview item-detail.jpg')).not.toBeInTheDocument();
  });

  it('keeps text-only messages on the existing JSON request flow', async () => {
    renderMessages();

    fireEvent.change(await screen.findByPlaceholderText('Type message...'), {
      target: { value: 'A text-only update' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(requestState.post).toHaveBeenCalledWith(
      '/api/v1/me/conversations/conversation-1/messages',
      { json: { content: 'A text-only update' } },
    ));
    expect(await screen.findByText('A text-only update')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'A text-only update' })).not.toBeInTheDocument();
  });

  it('keeps the caption and selected files available after a failed send so the same draft can be retried', async () => {
    requestState.failNextMessage = true;
    renderMessages();

    const caption = await screen.findByPlaceholderText('Type message...');
    fireEvent.change(caption, { target: { value: 'Try sending this again' } });
    fireEvent.change(screen.getByLabelText('Select photos and videos'), {
      target: { files: [imageFile('retry-photo.jpg')] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Message could not be sent');
    expect(caption).toHaveValue('Try sending this again');
    expect(screen.getByRole('img', { name: 'Preview retry-photo.jpg' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('img', { name: 'retry-photo.jpg' })).toBeInTheDocument();
    const firstRequest = requestState.post.mock.calls[0][1] as { body: FormData };
    const retryRequest = requestState.post.mock.calls[1][1] as { body: FormData };
    expect(firstRequest.body.get('content')).toBe('Try sending this again');
    expect(retryRequest.body.get('content')).toBe('Try sending this again');
    expect((firstRequest.body.get('attachments') as File).name).toBe('retry-photo.jpg');
    expect((retryRequest.body.get('attachments') as File).name).toBe('retry-photo.jpg');
    expect(caption).toHaveValue('');
    expect(screen.queryByLabelText('Preview retry-photo.jpg')).not.toBeInTheDocument();
  });

  it('prevents a second submission while the first message request is pending', async () => {
    requestState.holdNextMessage = true;
    renderMessages();

    const caption = await screen.findByPlaceholderText('Type message...');
    fireEvent.change(caption, { target: { value: 'Only send this once' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    const pendingSendButton = await screen.findByRole('button', { name: 'Sending message' });
    expect(pendingSendButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Attach photo or video' })).toBeDisabled();
    expect(requestState.post).toHaveBeenCalledTimes(1);

    fireEvent.submit(caption.closest('form')!);
    expect(requestState.post).toHaveBeenCalledTimes(1);

    requestState.releaseMessageRequest?.();
    expect(await screen.findByText('Only send this once')).toBeInTheDocument();
  });

  it('does not submit when both the caption and selected media are empty', async () => {
    renderMessages();

    const caption = await screen.findByPlaceholderText('Type message...');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();

    fireEvent.submit(caption.closest('form')!);

    expect(requestState.post).not.toHaveBeenCalled();
  });
});
