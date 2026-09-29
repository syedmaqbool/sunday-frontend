import type { NormalizedOptions } from 'ky';
import type { Order } from '@/types/order.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HTTPError } from 'ky';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrderConfirmation from '@/pages/OrderConfirmation';

const {
  addItemMock,
  cancelOrderMock,
  fetchMarketplaceListingMock,
} = vi.hoisted(() => ({
  addItemMock: vi.fn(),
  cancelOrderMock: vi.fn(),
  fetchMarketplaceListingMock: vi.fn(),
}));

const testState = { currentOrder: null as Order | null };

vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ loading: false, user: { id: 'buyer-id' } }),
}));
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: addItemMock }),
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/queries/checkout.query', () => ({
  useCancelOrderMutation: () => ({ mutateAsync: cancelOrderMock }),
  useResubmitManualPaymentMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/queries/marketplace.query', () => ({
  fetchMarketplaceListing: fetchMarketplaceListingMock,
}));
vi.mock('@/queries/myOrders.query', () => ({
  getMyOrderOptions: () => ({
    queryFn: async () => ({ data: testState.currentOrder }),
    queryKey: ['my-orders', 'detail', testState.currentOrder?.id],
  }),
  myOrdersQueryKey: {
    all: () => ['my-orders'],
    detail: (orderId: string) => ['my-orders', 'detail', orderId],
  },
}));

vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});

const testRequestOptions: NormalizedOptions = {
  context: {},
  method: 'GET',
  onDownloadProgress: undefined,
  onUploadProgress: undefined,
  prefix: '',
  retry: {} as NormalizedOptions['retry'],
};

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-id',
    buyerId: 'buyer-id',
    buyerFullName: 'Jane Buyer',
    canCancel: true,
    cancellationReason: null,
    canResubmit: false,
    commissionAmount: 0,
    currency: 'PKR',
    discountAmount: 0,
    discountCode: null,
    items: [{
      id: 'item-id',
      buyerId: 'buyer-id',
      commissionTierId: null,
      listingId: 'listing-id',
      offerId: null,
      orderId: 'order-id',
      reservationId: null,
      sellerId: 'seller-id',
      brand: 'Example',
      buyerFullName: 'Jane Buyer',
      category: 'Clothing',
      commissionAmount: 0,
      commissionRate: 0,
      commissionTierName: null,
      condition: 'NEW',
      currency: 'PKR',
      description: 'Example item',
      discountAmount: 0,
      expectedDelivery: null,
      imageUrl: '',
      platformFeeAmount: 0,
      price: 100,
      proofImageUrl: null,
      quantity: 1,
      reservedOfferPrice: null,
      sellerCouponDiscountAmount: 0,
      sellerFullName: 'Example Seller',
      shippingMethod: null,
      size: 'M',
      status: 'CONFIRMED',
      subcategory: 'Tops',
      taxAmount: 0,
      title: 'Example item',
      total: 100,
      trackingNumber: null,
      receivedAt: null,
      shippedAt: null,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    }],
    manualPaymentSubmission: {
      id: 'submission-id',
      orderId: 'order-id',
      proofFileId: 'proof-id',
      reviewNote: null,
      status: 'SUBMITTED',
      reviewedAt: null,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    },
    paymentStatus: 'PENDING',
    platformFeeAmount: 0,
    refundStatus: null,
    sellerCouponCode: null,
    shippingAddress: '1 Example Street',
    shippingCity: 'Lahore',
    shippingFirstName: 'Jane',
    shippingLastName: 'Buyer',
    shippingPhone: '03001234567',
    shippingPostal: '54000',
    status: 'AWAITING_PAYMENT',
    subtotal: 100,
    taxAmount: 0,
    taxRate: 0,
    total: 100,
    cancelledAt: null,
    expiresAt: '2099-01-01T00:00:00.000Z',
    paidAt: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/order-confirmation/order-id']}>
        <Routes>
          <Route element={<OrderConfirmation />} path="/order-confirmation/:id" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('order confirmation manual actions', () => {
  beforeEach(() => {
    testState.currentOrder = makeOrder();
    addItemMock.mockReset();
    cancelOrderMock.mockReset();
    fetchMarketplaceListingMock.mockReset();
    fetchMarketplaceListingMock.mockResolvedValue({ id: 'listing-id', status: 'APPROVED' });
  });

  it('does not render a retry control or start a gateway flow for a manual order', async () => {
    renderPage();

    await screen.findByText('Payment pending verification');

    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
  });

  it('shows an animated clock while a submitted payment waits for admin approval', async () => {
    testState.currentOrder = makeOrder({ status: 'CONFIRMED' });
    renderPage();

    await screen.findByText('Payment pending verification');

    expect(screen.getByLabelText('Payment awaiting admin approval')).toHaveClass('animate-spin');
  });

  it('keeps historical orders viewable without gateway payment actions', async () => {
    testState.currentOrder = makeOrder({
      manualPaymentSubmission: null,
      paymentStatus: 'FAILED',
    });
    renderPage();

    await screen.findByText('Payment failed');

    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
    expect(screen.getByText('Jane Buyer')).toBeInTheDocument();
  });

  it('shows the settled refund status for a historical paid order', async () => {
    testState.currentOrder = makeOrder({
      manualPaymentSubmission: null,
      paymentStatus: 'PAID',
      refundStatus: 'REFUNDED',
      status: 'CANCELLED',
    });
    renderPage();

    await screen.findByText('Order cancelled');

    expect(screen.getByText('Payment status:')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('This order was cancelled. Your payment has been refunded.')).toBeInTheDocument();
    expect(screen.getByText('Example item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
  });

  it('confirms cancellation, restores returned listings, and refreshes the order', async () => {
    cancelOrderMock.mockImplementation(async () => {
      testState.currentOrder = makeOrder({
        canCancel: false,
        manualPaymentSubmission: null,
        paymentStatus: 'CANCELLED',
        status: 'CANCELLED',
      });
      return { data: { restorableListingIds: ['listing-id'] } };
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel order' }));

    await waitFor(() => expect(cancelOrderMock).toHaveBeenCalledWith('order-id'));
    expect(fetchMarketplaceListingMock).toHaveBeenCalledWith('listing-id');
    expect(addItemMock).toHaveBeenCalledWith({ id: 'listing-id', status: 'APPROVED' });
    expect(await screen.findByText('Order cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });

  it('refreshes stale state and keeps the confirmation open on a cancellation conflict', async () => {
    const conflict = new HTTPError(
      new Response(null, { status: 409, statusText: 'Conflict' }),
      new Request('https://example.test/order'),
      testRequestOptions,
    );
    cancelOrderMock.mockRejectedValue(conflict);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel order' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This order changed while you were viewing it.');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not offer cancellation when the backend disallows it', async () => {
    testState.currentOrder = makeOrder({ canCancel: false });
    renderPage();

    await screen.findByText('Payment pending verification');
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });
});
