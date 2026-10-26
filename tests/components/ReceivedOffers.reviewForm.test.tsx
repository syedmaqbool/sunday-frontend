import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ReceivedOffers } from '@/components/ReceivedOffers';
import { offersQueryKey } from '@/queries/offers.query';

const { counterOfferMock, createOfferReviewMock, listMyReviewsMock, listReceivedOffersMock } =
  vi.hoisted(() => ({
    counterOfferMock: vi.fn(),
    createOfferReviewMock: vi.fn(),
    listMyReviewsMock: vi.fn(),
    listReceivedOffersMock: vi.fn(),
  }));

vi.mock('@/services/offers.service', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services/offers.service')>();
  return {
    ...actual,
    counterOffer: counterOfferMock,
    createOfferReview: createOfferReviewMock,
    listMyReviews: listMyReviewsMock,
    listReceivedOffers: listReceivedOffersMock,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'seller-1' } }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/errorToast', () => ({ showErrorToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn() } }));

const firstAcceptedOffer = {
  id: 'offer-1',
  buyerId: 'buyer-1',
  conversationId: null,
  listingId: 'listing-1',
  sellerId: 'seller-1',
  amount: 100,
  buyerFullName: 'Buyer One',
  counterAmount: null,
  coverImage: null,
  isPaused: false,
  listingPrice: 150,
  listingStatus: 'APPROVED',
  listingTitle: 'Vintage Lamp',
  message: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  status: 'ACCEPTED',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const secondAcceptedOffer = {
  ...firstAcceptedOffer,
  id: 'offer-2',
  buyerId: 'buyer-2',
  listingId: 'listing-2',
  buyerFullName: 'Buyer Two',
  listingTitle: 'Desk Chair',
};

function page<T>(data: T[]) {
  return { data, pagination: { nextPage: null } };
}

function renderReceivedOffers() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ReceivedOffers />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...view, queryClient };
}

describe('received offer review form', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listReceivedOffersMock.mockResolvedValue(page([firstAcceptedOffer, secondAcceptedOffer]));
    listMyReviewsMock.mockResolvedValue(page([]));
  });

  it('places the expanded review editor below the visible offer summary', async () => {
    renderReceivedOffers();

    const leaveReviewButtons = await screen.findAllByRole('button', { name: 'Leave Review' });
    fireEvent.click(leaveReviewButtons[0]);

    const offerSummary = screen.getByRole('group', { name: 'Offer summary: Vintage Lamp' });
    const reviewEditor = screen.getByRole('region', { name: 'Rate this buyer' });

    expect(offerSummary.nextElementSibling).toBe(reviewEditor);
    expect(reviewEditor).toHaveClass('w-full');
    expect(offerSummary).toHaveTextContent('Vintage Lamp');
    expect(offerSummary).toHaveTextContent('Buyer One');
  });

  it('lets the seller cancel an unfinished review', async () => {
    renderReceivedOffers();

    const leaveReviewButtons = await screen.findAllByRole('button', { name: 'Leave Review' });
    fireEvent.click(leaveReviewButtons[0]);

    expect(screen.getByRole('region', { name: 'Rate this buyer' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' }));
    fireEvent.change(screen.getByPlaceholderText('Share your experience (optional)'), {
      target: { value: 'Fast payment and clear communication.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('region', { name: 'Rate this buyer' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave Review' })[0]);

    expect(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByPlaceholderText('Share your experience (optional)')).toHaveValue('');
  });

  it('keeps only one offer review form open at a time', async () => {
    renderReceivedOffers();

    const leaveReviewButtons = await screen.findAllByRole('button', { name: 'Leave Review' });
    fireEvent.click(leaveReviewButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Leave Review' }));

    const reviewEditor = screen.getByRole('region', { name: 'Rate this buyer' });
    const secondOfferSummary = screen.getByRole('group', { name: 'Offer summary: Desk Chair' });

    expect(secondOfferSummary.nextElementSibling).toBe(reviewEditor);
    expect(screen.getAllByRole('region', { name: 'Rate this buyer' })).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Offer summary: Vintage Lamp' })).toBeInTheDocument();
  });

  it('shows the reviewed state after the seller submits a review', async () => {
    createOfferReviewMock.mockImplementation(async (payload: { offerId: string }) => {
      listMyReviewsMock.mockResolvedValue(page([{ offerId: payload.offerId }]));
      return { data: { id: 'review-1' } };
    });

    renderReceivedOffers();

    const leaveReviewButtons = await screen.findAllByRole('button', { name: 'Leave Review' });
    fireEvent.click(leaveReviewButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 out of 5 stars' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));

    await waitFor(() => {
      expect(createOfferReviewMock).toHaveBeenCalledWith(
        expect.objectContaining({
          offerId: 'offer-1',
          rating: 5,
          role: 'SELLER',
        }),
      );
    });

    expect(await screen.findByText('✓ Reviewed')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Rate this buyer' })).not.toBeInTheDocument();
  });
});

describe('received paused offers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listReceivedOffersMock.mockResolvedValue(
      page([
        {
          ...firstAcceptedOffer,
          isPaused: true,
          status: 'PENDING',
        },
      ]),
    );
    listMyReviewsMock.mockResolvedValue(page([]));
  });

  it('keeps a paused offer visible and blocks accept and counter while allowing rejection', async () => {
    renderReceivedOffers();

    expect(await screen.findByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Counter' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled();
    expect(screen.getByText('Vintage Lamp')).toBeInTheDocument();
  });

  it('makes an offer actionable again when the response says it is no longer paused', async () => {
    listReceivedOffersMock.mockResolvedValue(
      page([
        {
          ...firstAcceptedOffer,
          isPaused: false,
          status: 'PENDING',
        },
      ]),
    );

    renderReceivedOffers();

    expect(await screen.findByRole('button', { name: 'Accept' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Counter' })).toBeEnabled();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('blocks an already-open counter dialog after the offer becomes paused', async () => {
    listReceivedOffersMock.mockResolvedValue(
      page([
        {
          ...firstAcceptedOffer,
          isPaused: false,
          status: 'PENDING',
        },
      ]),
    );

    const { queryClient } = renderReceivedOffers();

    fireEvent.click(await screen.findByRole('button', { name: 'Counter' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. 150'), { target: { value: '125' } });
    queryClient.setQueryData(
      offersQueryKey.received('seller-1'),
      page([
        {
          ...firstAcceptedOffer,
          isPaused: true,
          status: 'PENDING',
        },
      ]),
    );

    expect(await screen.findByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Counter Offer' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('button', { name: 'Send Counter Offer' }).closest('form')!);

    expect(counterOfferMock).not.toHaveBeenCalled();
  });
});
