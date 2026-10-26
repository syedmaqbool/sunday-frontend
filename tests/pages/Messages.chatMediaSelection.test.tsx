import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Messages from '@/pages/Messages';

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
const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const sendMessageMutation = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'user-1' } }),
}));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/lib/tokenStorage', () => ({ tokenStorage: { getAccess: () => null } }));
vi.mock('@/hooks/useConverstion', () => ({
  getConversationMessagesOptions: () => queryOptions({
    queryFn: async () => ({ data: [] }),
    queryKey: ['test-messages'],
  }),
  getConversationsOptions: () => queryOptions({
    queryFn: async () => ({ data: [activeConversation] }),
    queryKey: ['test-conversations'],
  }),
  useMarkConversationReadMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useSendMessageMutation: () => ({ isPending: false, mutate: sendMessageMutation }),
}));

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

function imageFile(name: string, size: number, type = 'image/jpeg') {
  return new File([new Uint8Array(size)], name, { type });
}

function videoFile(name: string, size: number, type = 'video/mp4') {
  return new File([new Uint8Array(size)], name, { type });
}

function setFileSize(file: File, size: number) {
  Object.defineProperty(file, 'size', { configurable: true, value: size });
  return file;
}

describe('messages chat media selection', () => {
  beforeEach(() => {
    sendMessageMutation.mockReset();
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: (file: File) => `blob:${file.name}`,
      },
      revokeObjectURL: { configurable: true, value: () => {} },
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

  it('previews selected supported media and removes one without changing the caption', async () => {
    renderMessages();

    const caption = await screen.findByPlaceholderText('Type message...');
    fireEvent.change(caption, { target: { value: 'Please see these photos' } });

    const filePicker = screen.getByLabelText('Select photos and videos');
    expect(filePicker).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime');
    fireEvent.change(filePicker, {
      target: {
        files: [imageFile('photo.jpg', 1024), videoFile('clip.mov', 10 * 1024, 'video/quicktime')],
      },
    });

    expect(await screen.findByRole('img', { name: 'Preview photo.jpg' })).toHaveAttribute('src', 'blob:photo.jpg');
    expect(screen.getByLabelText('Preview clip.mov')).toHaveAttribute('src', 'blob:clip.mov');
    expect(caption).toHaveValue('Please see these photos');

    fireEvent.click(screen.getByRole('button', { name: 'Remove photo.jpg' }));

    await waitFor(() => expect(screen.queryByRole('img', { name: 'Preview photo.jpg' })).not.toBeInTheDocument());
    expect(screen.getByLabelText('Preview clip.mov')).toBeInTheDocument();
    expect(caption).toHaveValue('Please see these photos');
    expect(sendMessageMutation).not.toHaveBeenCalled();
  });

  it('rejects unsupported, undersized, and oversized media with a clear error', async () => {
    renderMessages();

    const filePicker = await screen.findByLabelText('Select photos and videos');
    fireEvent.change(filePicker, {
      target: {
        files: [
          imageFile('tiny.jpg', 1023),
          imageFile('large.png', 0),
          setFileSize(imageFile('too-large.webp', 0, 'image/webp'), 10 * 1024 * 1024 + 1),
          videoFile('tiny.mp4', 10 * 1024 - 1),
          imageFile('wrong.gif', 1024, 'image/gif'),
        ],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('tiny.jpg');
    expect(screen.getByRole('alert')).toHaveTextContent('wrong.gif');
    expect(screen.getByRole('alert')).toHaveTextContent('too-large.webp');
    expect(screen.getByRole('alert')).toHaveTextContent('tiny.mp4');
    expect(screen.queryByRole('img', { name: 'Preview tiny.jpg' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Preview too-large.webp' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Preview tiny.mp4')).not.toBeInTheDocument();
  });

  it('keeps the first four selected files and rejects a fifth file', async () => {
    renderMessages();

    const filePicker = await screen.findByLabelText('Select photos and videos');
    fireEvent.change(filePicker, {
      target: {
        files: [
          imageFile('one.jpg', 1024),
          imageFile('two.png', 1024, 'image/png'),
          imageFile('three.webp', 1024, 'image/webp'),
          videoFile('four.mp4', 10 * 1024),
          videoFile('five.mov', 10 * 1024, 'video/quicktime'),
        ],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Up to 4 attachments');
    expect(screen.getByRole('img', { name: 'Preview one.jpg' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Preview two.png' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Preview three.webp' })).toBeInTheDocument();
    expect(screen.getByLabelText('Preview four.mp4')).toBeInTheDocument();
    expect(screen.queryByLabelText('Preview five.mov')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach photo or video' })).toBeDisabled();
  });

  it('accepts files at the image and video maximum sizes', async () => {
    renderMessages();

    const filePicker = await screen.findByLabelText('Select photos and videos');
    fireEvent.change(filePicker, {
      target: {
        files: [
          setFileSize(imageFile('maximum.jpg', 1), 10 * 1024 * 1024),
          setFileSize(videoFile('maximum.mp4', 1), 50 * 1024 * 1024),
        ],
      },
    });

    expect(await screen.findByRole('img', { name: 'Preview maximum.jpg' })).toBeInTheDocument();
    expect(screen.getByLabelText('Preview maximum.mp4')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
