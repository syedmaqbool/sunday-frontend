import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Messages from '@/pages/Messages';

const requestState = vi.hoisted(() => ({
  get: vi.fn(),
  messages: [] as Array<Record<string, unknown>>,
  post: vi.fn(),
}));

const activeConversation = {
  id: 'conversation-1',
  buyerId: 'user-1',
  buyerFullName: 'Buyer',
  lastMessageContent: 'Caption on image',
  listingTitle: 'Listing',
  sellerFullName: 'Seller',
  unreadCount: 0,
};

function successResponse<Data>(data: Data) {
  return { data, message: 'OK', statusCode: 200 };
}

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
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/messages?conversation=conversation-1']}
      >
        <Routes>
          <Route element={<Messages />} path="/messages" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function attachment(id: string, filename: string, type: 'IMAGE' | 'VIDEO', url: string) {
  return {
    id,
    filename,
    mimetype: type === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
    size: 1024,
    type,
    url,
  };
}

function message(id: string, content: string, attachments: ReturnType<typeof attachment>[]) {
  return {
    id,
    conversationId: activeConversation.id,
    senderId: 'user-1',
    attachments,
    content,
    flagReasons: [],
    isFlagged: false,
    readAt: null,
    createdAt: '2026-10-27T12:00:00.000Z',
    updatedAt: '2026-10-27T12:00:00.000Z',
  };
}

describe('messages attachment history', () => {
  beforeEach(() => {
    requestState.messages = [];
    requestState.get.mockReset().mockImplementation((path: string) => ({
      json: async () =>
        successResponse(
          path === '/api/v1/me/conversations' ? [activeConversation] : requestState.messages,
        ),
    }));
    requestState.post.mockReset().mockImplementation(() => ({
      json: async () => successResponse(null),
    }));
  });

  afterEach(() => cleanup());

  it('renders ordered history media and refreshes expired private URLs', async () => {
    const originalPhotoUrl = 'https://private.example/photo-expired';
    const photo = attachment('attachment-photo', 'item-photo.jpg', 'IMAGE', originalPhotoUrl);
    const video = attachment(
      'attachment-video',
      'item-video.mp4',
      'VIDEO',
      'https://private.example/video',
    );
    requestState.messages = [
      message('message-captioned', 'Caption on image', [photo, video]),
      message('message-media-only', '', [
        attachment(
          'attachment-only',
          'another-photo.jpg',
          'IMAGE',
          'https://private.example/another-photo',
        ),
      ]),
    ];

    const { container } = renderMessages();

    const photoImage = await screen.findByRole('img', { name: 'item-photo.jpg' });
    const photoLink = photoImage.closest('a');
    expect(photoLink).toHaveAttribute('href', originalPhotoUrl);
    expect(photoLink).toHaveAttribute('target', '_blank');
    expect(photoLink).toHaveAttribute('rel', 'noreferrer');
    const videoPlayer = screen.getByLabelText('item-video.mp4');
    expect(videoPlayer).toHaveAttribute('controls');

    const captionedMessage = container.querySelector<HTMLDivElement>(
      '#conversation-message-message-captioned',
    );
    expect(within(captionedMessage!).getByText('Caption on image')).toBeInTheDocument();
    expect(
      [...captionedMessage!.querySelectorAll('img[alt], video[aria-label]')].map(
        media => media.getAttribute('alt') ?? media.getAttribute('aria-label'),
      ),
    ).toEqual(['item-photo.jpg', 'item-video.mp4']);

    const mediaOnlyMessage = container.querySelector<HTMLDivElement>(
      '#conversation-message-message-media-only',
    );
    expect(within(mediaOnlyMessage!).queryByText('', { selector: 'p' })).not.toBeInTheDocument();

    fireEvent.error(photoImage);
    expect(await screen.findByRole('alert')).toHaveTextContent('Media is unavailable');
    fireEvent.error(videoPlayer);
    expect(await screen.findAllByRole('alert')).toHaveLength(2);
    const refreshedPhotoUrl = 'https://private.example/photo-refreshed';
    const refreshedVideoUrl = 'https://private.example/video-refreshed';
    requestState.messages = [
      message('message-captioned', 'Caption on image', [
        attachment('attachment-photo', 'item-photo.jpg', 'IMAGE', refreshedPhotoUrl),
        attachment('attachment-video', 'item-video.mp4', 'VIDEO', refreshedVideoUrl),
      ]),
      message('message-media-only', '', [
        attachment(
          'attachment-only',
          'another-photo.jpg',
          'IMAGE',
          'https://private.example/another-photo',
        ),
      ]),
    ];
    fireEvent.click(screen.getAllByRole('button', { name: 'Reload conversation' })[0]);

    expect(await screen.findByRole('img', { name: 'item-photo.jpg' })).toHaveAttribute(
      'src',
      refreshedPhotoUrl,
    );
    expect(await screen.findByLabelText('item-video.mp4')).toHaveAttribute(
      'src',
      refreshedVideoUrl,
    );
    await waitFor(() =>
      expect(
        requestState.get.mock.calls.filter(([path]) => path.endsWith('/messages')),
      ).toHaveLength(2),
    );
  });
});
