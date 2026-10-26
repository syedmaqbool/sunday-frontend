import type { AdminListing } from '@/types/adminListing.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import ListingModeration from '@/pages/admin/ListingModeration';

const { listAdminListings, reorderAdminListingMedia } = vi.hoisted(() => ({
  listAdminListings: vi.fn(),
  reorderAdminListingMedia: vi.fn(),
}));

vi.mock('@/services/listing.service', () => ({
  createAdminListingFeedback: vi.fn(),
  listAdminListings,
  moderateListing: vi.fn(),
  removeAdminListing: vi.fn(),
  reorderAdminListingMedia,
  restoreAdminListing: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      permissions: [{ name: 'LISTINGS_READ' }, { name: 'LISTINGS_UPDATE' }],
      roleName: 'STAFF',
    },
  }),
}));

vi.mock('@/components/AdminListingFeedbackWidgets', () => ({
  AdminListingFeedbackSection: () => <div>Feedback history</div>,
}));

const imageOne = {
  id: 'media-image-one',
  file: {
    id: 'file-image-one',
    filename: 'image-one.jpg',
    mimetype: 'image/jpeg',
    size: 100,
    url: '/image-one.jpg',
  },
  sortOrder: 0,
  type: 'IMAGE',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const video = {
  id: 'media-video',
  file: {
    id: 'file-video',
    filename: 'video.mp4',
    mimetype: 'video/mp4',
    size: 100,
    url: '/video.mp4',
  },
  sortOrder: 1,
  type: 'VIDEO',
  createdAt: '2026-01-02T00:00:00.000Z',
};
const imageTwo = {
  id: 'media-image-two',
  file: {
    id: 'file-image-two',
    filename: 'image-two.jpg',
    mimetype: 'image/jpeg',
    size: 100,
    url: '/image-two.jpg',
  },
  sortOrder: 2,
  type: 'IMAGE',
  createdAt: '2026-01-03T00:00:00.000Z',
};
const listing = {
  id: 'listing-1',
  sellerId: 'seller-1',
  brand: 'Brand',
  categoryLabel: 'Clothing',
  condition: 'GOOD',
  coverImage: { url: '/image-one.jpg' },
  deletionReason: null,
  description: 'Listing description',
  media: [imageOne, video, imageTwo],
  price: 100,
  sellerName: 'Test Seller',
  size: 'M',
  status: 'PENDING',
  title: 'Media order listing',
  weight: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
} as AdminListing;
const listingState = { current: listing };

function renderModeration() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/listings?listing=listing-1&status=PENDING']}>
        <ListingModeration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listingState.current = listing;
  listAdminListings.mockImplementation(async () => ({
    data: [listingState.current],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      perPage: 10,
      prevPage: null,
      total: 1,
    },
  }));
  reorderAdminListingMedia.mockImplementation(
    async (listingId: string, payload: { mediaIds: string[] }) => {
      const listingMedia = [imageOne, video, imageTwo];
      const orderedMedia = payload.mediaIds.map((mediaId, sortOrder) => ({
        ...listingMedia.find(mediaItem => mediaItem.id === mediaId)!,
        sortOrder,
      }));
      listingState.current = {
        ...listing,
        coverImage: orderedMedia.find(mediaItem => mediaItem.type === 'IMAGE')?.file ?? null,
        media: orderedMedia,
      } as AdminListing;
      return {
        data: listingState.current,
        message: `Media order updated for ${listingId}`,
        statusCode: 200,
      };
    },
  );
});

describe('admin listing media reorder', () => {
  it('offers reorder only when a listing has multiple media items', async () => {
    listingState.current = { ...listing, media: [imageOne] } as AdminListing;
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });

    expect(within(dialog).queryByRole('button', { name: 'Reorder media' })).not.toBeInTheDocument();
  });

  it('shows saved media order and lets admins move a thumbnail with accessible controls', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));

    const mediaItems = within(dialog).getAllByRole('listitem');
    expect(mediaItems.map(item => item.getAttribute('aria-label'))).toEqual([
      'Image image-one.jpg',
      'Video video.mp4',
      'Image image-two.jpg',
    ]);
    expect(within(mediaItems[0]).getByText('Cover')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map(item => item.getAttribute('aria-label')),
    ).toEqual(['Image image-two.jpg', 'Image image-one.jpg', 'Video video.mp4']);
    expect(within(dialog).getByRole('listitem', { name: 'Image image-two.jpg' })).toHaveTextContent(
      'Cover',
    );
  });

  it('sends the full draft order and refreshes the open listing after saving', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save order' }));

    await waitFor(() =>
      expect(reorderAdminListingMedia).toHaveBeenCalledWith('listing-1', {
        mediaIds: ['media-image-two', 'media-image-one', 'media-video'],
      }),
    );
    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(listAdminListings.mock.calls.length).toBeGreaterThan(1));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map(item => item.getAttribute('aria-label')),
    ).toEqual(['Image image-two.jpg', 'Image image-one.jpg', 'Video video.mp4']);
  });

  it('disables save and cancel while the order request is pending', async () => {
    let resolveRequest:
      | ((response: { data: AdminListing; message: string; statusCode: number }) => void)
      | undefined;
    // The configured TypeScript lib does not include Promise.withResolvers.
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    reorderAdminListingMedia.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve;
        }),
    );
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save order' }));

    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: 'Save order' })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save order' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(reorderAdminListingMedia).toHaveBeenCalledTimes(1);

    resolveRequest({ data: listingState.current, message: 'Media order updated', statusCode: 200 });
    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument(),
    );
  });

  it('discards the draft on cancel without calling the reorder operation', async () => {
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(reorderAdminListingMedia).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map(item => item.getAttribute('aria-label')),
    ).toEqual(['Image image-one.jpg', 'Video video.mp4', 'Image image-two.jpg']);
  });

  it('keeps a failed draft available for retry or cancel', async () => {
    reorderAdminListingMedia.mockRejectedValueOnce(new Error('Request failed'));
    renderModeration();
    const dialog = await screen.findByRole('dialog', { name: 'Media order listing' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reorder media' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Move image-two.jpg left' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save order' }));

    expect(await within(dialog).findByRole('button', { name: 'Save order' })).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map(item => item.getAttribute('aria-label')),
    ).toEqual(['Image image-one.jpg', 'Image image-two.jpg', 'Video video.mp4']);
    expect(reorderAdminListingMedia).toHaveBeenCalledTimes(1);
  });
});
