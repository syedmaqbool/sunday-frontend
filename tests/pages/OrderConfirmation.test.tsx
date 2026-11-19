import type { NormalizedOptions } from 'ky';
import type { Order } from '@/types/order.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HTTPError } from 'ky';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import OrderConfirmation from '@/pages/OrderConfirmation';

const {
  addItemMock,
  cancelOrderMock,
  fetchMarketplaceListingMock,
  payFastSubmissions,
  resubmitManualPaymentMock,
  startPayFastCheckoutMock,
  uploadPaymentProofMock,
} = vi.hoisted(() => ({
  addItemMock: vi.fn(),
  cancelOrderMock: vi.fn(),
  fetchMarketplaceListingMock: vi.fn(),
  payFastSubmissions: [] as { action: string; fields: Record<string, string> }[],
  resubmitManualPaymentMock: vi.fn(),
  startPayFastCheckoutMock: vi.fn(),
  uploadPaymentProofMock: vi.fn(),
}));
const authState = vi.hoisted(() => ({
  loading: false,
  user: { id: 'buyer-id' } as { id: string } | null,
}));

const testState = { currentError: null as unknown, currentOrder: null as Order | null };

vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({ addItem: addItemMock }),
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/queries/checkout.query', () => ({
  getPaymentInstructionsOptions: () => ({
    queryFn: async () => ({
      data: {
        accountNumber: 'PK00 1234',
        accountTitle: 'Sunday Store',
        bankOrWalletLabel: 'Example Bank',
      },
    }),
    queryKey: ['checkout', 'payment-instructions'],
  }),
  useCancelOrderMutation: () => ({ mutateAsync: cancelOrderMock }),
  useResubmitManualPaymentMutation: () => ({ mutateAsync: resubmitManualPaymentMock }),
  useStartPayFastCheckoutMutation: () => ({ mutateAsync: startPayFastCheckoutMock }),
  useUploadPaymentProofMutation: () => ({ isPending: false, mutateAsync: uploadPaymentProofMock }),
}));
vi.mock('@/queries/marketplace.query', () => ({
  fetchMarketplaceListing: fetchMarketplaceListingMock,
}));
vi.mock('@/queries/myOrders.query', () => ({
  getMyOrderOptions: () => ({
    queryFn: async () => {
      if (testState.currentError) throw testState.currentError;
      return { data: testState.currentOrder };
    },
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
  headers: new Headers(),
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
    items: [
      {
        id: 'item-id',
        buyerId: 'buyer-id',
        commissionTierId: null,
        listingId: 'listing-id',
        offerId: null,
        orderId: 'order-id',
        reservationId: null,
        sellerId: 'seller-id',
        sellerIncentiveId: null,
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
        sellerFullName: 'Example Seller',
        sellerIncentiveBonus: 0,
        sellerIncentivePercentage: null,
        shippingAddress: '1 Example Street',
        shippingCity: 'Lahore',
        shippingFirstName: 'Jane',
        shippingLastName: 'Buyer',
        shippingMethod: null,
        shippingPhone: '03001234567',
        shippingPostal: '54000',
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
      },
    ],
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
    sellerIncentives: [],
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
  const page = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/order-confirmation/order-id']}>
        <Routes>
          <Route element={<OrderConfirmation />} path="/order-confirmation/:id" />
          <Route element={<div>Buyer order list</div>} path="/profile" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...page, queryClient };
}

describe('order confirmation manual actions', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = { id: 'buyer-id' };
    testState.currentError = null;
    testState.currentOrder = makeOrder();
    addItemMock.mockReset();
    cancelOrderMock.mockReset();
    fetchMarketplaceListingMock.mockReset();
    resubmitManualPaymentMock.mockReset();
    uploadPaymentProofMock.mockReset();
    fetchMarketplaceListingMock.mockResolvedValue({ id: 'listing-id', status: 'APPROVED' });
    uploadPaymentProofMock.mockResolvedValue({ data: { id: 'proof-file-id' } });
  });

  it('shows the marketplace discount and total from the created order without seller bonus details', async () => {
    const item = makeOrder().items[0];
    testState.currentOrder = makeOrder({
      discountAmount: 80,
      discountCode: 'MARKET10',
      items: [
        {
          ...item,
          sellerIncentiveId: 'incentive-id',
          discountAmount: 80,
          platformFeeAmount: 100,
          sellerIncentiveBonus: 200,
          sellerIncentivePercentage: 20,
          taxAmount: 100,
          total: 1120,
        },
      ],
      platformFeeAmount: 100,
      sellerIncentives: [
        {
          id: 'incentive-id',
          sellerId: 'seller-id',
          allocations: [{ listingId: 'listing-id', orderItemId: 'item-id', bonusAmount: 200 }],
          bonusAmount: 200,
          percentage: 20,
        },
      ],
      subtotal: 1000,
      taxAmount: 100,
      taxRate: 10,
      total: 1120,
    });
    renderPage();

    await screen.findByText('Payment pending verification');

    expect(screen.getByText('Marketplace discount (MARKET10)').parentElement).toHaveTextContent(
      '80',
    );
    expect(screen.getByText('Platform fee').parentElement).toHaveTextContent('100');
    expect(screen.getByText('Total').parentElement).toHaveTextContent('Rs 1,120');
    expect(
      screen.queryByText(/seller incentive|seller bonus|seller coupon/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/200/)).not.toBeInTheDocument();
  });

  it('does not render a retry control or start a gateway flow for a manual order', async () => {
    renderPage();

    await screen.findByText('Payment pending verification');

    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
  });

  it('returns to the buyer order list when the selected order is unavailable', async () => {
    testState.currentError = new HTTPError(
      new Response(null, { status: 404, statusText: 'Not Found' }),
      new Request('https://example.test/order'),
      testRequestOptions,
    );
    renderPage();

    expect(await screen.findByText('Buyer order list')).toBeInTheDocument();
  });

  it('waits for authentication before applying the missing-order fallback', async () => {
    authState.loading = true;
    authState.user = null;
    renderPage();

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText('Buyer order list')).not.toBeInTheDocument();
  });

  it('keeps the order error view open for a server error', async () => {
    testState.currentError = new HTTPError(
      new Response(null, { status: 500, statusText: 'Server Error' }),
      new Request('https://example.test/order'),
      testRequestOptions,
    );
    renderPage();

    expect(await screen.findByText('Order not found')).toBeInTheDocument();
    expect(screen.queryByText('Buyer order list')).not.toBeInTheDocument();
  });

  it('shows an animated clock while a submitted payment waits for admin approval', async () => {
    testState.currentOrder = makeOrder({ status: 'CONFIRMED' });
    renderPage();

    await screen.findByText('Payment pending verification');

    expect(screen.getByLabelText('Payment awaiting admin approval')).toHaveClass('animate-spin');
  });

  it('hides the payment deadline and cancellation while accepted-offer proof awaits admin review', async () => {
    testState.currentOrder = makeOrder({
      canCancel: false,
      expiresAt: null,
    });
    renderPage();

    await screen.findByText('Pending review');

    expect(screen.queryByText(/payment review deadline/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });

  it('keeps the review deadline and cancellation for an ordinary submitted order', async () => {
    testState.currentOrder = makeOrder({ canCancel: true });
    renderPage();

    await screen.findByText('Pending review');

    expect(screen.getByText(/payment review deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel order' })).toBeInTheDocument();
  });

  it('opens the existing resubmission flow and refreshes the order after replacement proof', async () => {
    const requestedSubmission = {
      ...makeOrder().manualPaymentSubmission!,
      status: 'RESUBMISSION_REQUESTED' as const,
    };
    testState.currentOrder = makeOrder({
      canCancel: true,
      canResubmit: true,
      manualPaymentSubmission: requestedSubmission,
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    resubmitManualPaymentMock.mockImplementation(async () => {
      testState.currentOrder = makeOrder({
        canCancel: false,
        canResubmit: false,
        expiresAt: null,
      });
      return { data: { id: 'order-id' } };
    });
    const { queryClient } = renderPage();
    const refetchQueries = vi.spyOn(queryClient, 'refetchQueries');

    await screen.findByRole('heading', { name: 'Resubmission requested' });
    expect(screen.getByText(/payment correction deadline/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resubmit payment proof' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Resubmit payment proof' }),
    ).toBeInTheDocument();
    expect(await within(dialog).findByText('Sunday Store')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Bank or wallet name'), {
      target: { value: 'Example Bank' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sender account title/name'), {
      target: { value: 'Jane Buyer' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sender account number'), {
      target: { value: '123456789' },
    });
    fireEvent.change(within(dialog).getByLabelText('Transaction screenshot'), {
      target: { files: [new File(['proof'], 'proof.png', { type: 'image/png' })] },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resubmit payment proof' }));

    await waitFor(() =>
      expect(resubmitManualPaymentMock).toHaveBeenCalledWith({
        orderId: 'order-id',
        payload: {
          proofFileId: 'proof-file-id',
          senderAccountNumber: '123456789',
          senderAccountTitle: 'Jane Buyer',
          senderBankName: 'Example Bank',
        },
      }),
    );
    expect(refetchQueries).toHaveBeenCalledWith({ queryKey: ['my-orders', 'detail', 'order-id'] });
    expect(await screen.findByText('Pending review')).toBeInTheDocument();
  });

  it('lets the buyer cancel during correction and shows the refreshed cancelled order', async () => {
    testState.currentOrder = makeOrder({
      canCancel: true,
      canResubmit: true,
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    cancelOrderMock.mockImplementation(async () => {
      testState.currentOrder = makeOrder({
        canCancel: false,
        cancellationReason: 'BUYER_CANCELLED',
        canResubmit: false,
        manualPaymentSubmission: {
          ...makeOrder().manualPaymentSubmission!,
          status: 'RESUBMISSION_REQUESTED',
        },
        paymentStatus: 'CANCELLED',
        status: 'CANCELLED',
      });
      return { data: { restorableListingIds: [] } };
    });
    renderPage();

    await screen.findByRole('heading', { name: 'Resubmission requested' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel order' }),
    );

    await waitFor(() => expect(cancelOrderMock).toHaveBeenCalledWith('order-id'));
    expect(await screen.findByRole('heading', { name: 'Order cancelled' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resubmit payment proof' }),
    ).not.toBeInTheDocument();
  });

  it('shows backend expiry and hides both correction actions after the correction window closes', async () => {
    testState.currentOrder = makeOrder({
      canCancel: false,
      cancellationReason: 'PAYMENT_EXPIRED',
      canResubmit: false,
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
      paymentStatus: 'CANCELLED',
      status: 'CANCELLED',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Payment window expired' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resubmit payment proof' }),
    ).not.toBeInTheDocument();
  });

  it('hides correction actions after the deadline while the backend capability flags remain true', async () => {
    testState.currentOrder = makeOrder({
      canCancel: true,
      canResubmit: true,
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    renderPage();

    await screen.findByRole('heading', { name: 'Resubmission requested' });

    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Resubmit payment proof' }),
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByText('This order was cancelled. Your payment has been refunded.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Example item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
  });

  it('confirms cancellation, restores returned listings, and refreshes the order', async () => {
    testState.currentOrder = makeOrder({
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
    });
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
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel order' }),
    );

    await waitFor(() => expect(cancelOrderMock).toHaveBeenCalledWith('order-id'));
    expect(fetchMarketplaceListingMock).toHaveBeenCalledWith('listing-id');
    expect(addItemMock).toHaveBeenCalledWith({ id: 'listing-id', status: 'APPROVED' });
    expect(await screen.findByText('Order cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });

  it('refreshes stale state and keeps the confirmation open on a cancellation conflict', async () => {
    testState.currentOrder = makeOrder({
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
    });
    const conflict = new HTTPError(
      new Response(null, { status: 409, statusText: 'Conflict' }),
      new Request('https://example.test/order'),
      testRequestOptions,
    );
    cancelOrderMock.mockRejectedValue(conflict);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel order' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This order changed while you were viewing it.',
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not offer cancellation when the backend disallows it', async () => {
    testState.currentOrder = makeOrder({ canCancel: false });
    renderPage();

    await screen.findByText('Payment pending verification');
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });
});

function makePayFastOrder(overrides: Partial<Order> = {}): Order {
  return makeOrder({
    canCancel: false,
    canResubmit: false,
    manualPaymentSubmission: undefined,
    paymentStatus: 'UNPAID',
    ...overrides,
  });
}

describe('order confirmation PayFast checkout', () => {
  let submitSpy: ReturnType<typeof vi.spyOn<HTMLFormElement, 'submit'>>;

  beforeEach(() => {
    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'true');
    authState.loading = false;
    authState.user = { id: 'buyer-id' };
    testState.currentError = null;
    testState.currentOrder = makePayFastOrder();
    startPayFastCheckoutMock.mockReset().mockResolvedValue({
      data: {
        accessToken: 'access-token',
        amount: 100,
        basketId: 'order-id',
        currencyCode: 'PKR',
        fields: { BASKET_ID: 'order-id', TOKEN: 'access-token' },
        paymentUrl: 'https://payfast.example/checkout',
      },
    });
    payFastSubmissions.length = 0;
    submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (
      this: HTMLFormElement,
    ) {
      payFastSubmissions.push({
        action: this.action,
        fields: Object.fromEntries(
          Array.from(this.querySelectorAll('input')).map(input => [input.name, input.value]),
        ),
      });
    });
  });

  afterEach(() => {
    submitSpy.mockRestore();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('does not offer PayFast actions while the PayFast checkout flag is off', async () => {
    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'false');
    testState.currentOrder = makePayFastOrder({ paymentStatus: 'FAILED' });
    renderPage();

    expect(await screen.findByText('Payment failed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry payment' })).not.toBeInTheDocument();
    expect(startPayFastCheckoutMock).not.toHaveBeenCalled();
  });

  it('starts hosted PayFast payment for an unpaid order before its deadline', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay with PayFast' }));

    await waitFor(() => expect(payFastSubmissions).toHaveLength(1));
    expect(startPayFastCheckoutMock).toHaveBeenCalledWith('order-id');
    expect(payFastSubmissions[0].action).toBe('https://payfast.example/checkout');
    expect(
      screen.queryByRole('button', { name: 'Resubmit payment proof' }),
    ).not.toBeInTheDocument();
  });

  it('lets the buyer retry a failed PayFast attempt on the same order', async () => {
    testState.currentOrder = makePayFastOrder({ paymentStatus: 'FAILED' });
    renderPage();

    expect(await screen.findByText('Payment failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry payment' }));

    await waitFor(() => expect(startPayFastCheckoutMock).toHaveBeenCalledWith('order-id'));
    await waitFor(() => expect(payFastSubmissions).toHaveLength(1));
  });

  it('keeps an abandoned pending attempt payable while waiting for PayFast confirmation', async () => {
    testState.currentOrder = makePayFastOrder({ paymentStatus: 'PENDING' });
    renderPage();

    expect(await screen.findByText('Payment is being verified')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to PayFast' }));

    await waitFor(() => expect(startPayFastCheckoutMock).toHaveBeenCalledWith('order-id'));
  });

  it('shows backend-confirmed payment as successful without offering another payment', async () => {
    testState.currentOrder = makePayFastOrder({
      paidAt: '2026-09-08T01:00:00.000Z',
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    });
    renderPage();

    expect(await screen.findByText('Thank you for your order!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PayFast|Retry payment/ })).not.toBeInTheDocument();
  });

  it('does not offer PayFast payment once the order deadline has passed', async () => {
    testState.currentOrder = makePayFastOrder({ expiresAt: '2000-01-01T00:00:00.000Z' });
    renderPage();

    expect(await screen.findByText('Payment window expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PayFast|Retry payment/ })).not.toBeInTheDocument();
  });

  it('hides the PayFast action once the order deadline passes while the page stays open', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-19T12:00:00.000Z'));
    testState.currentOrder = makePayFastOrder({ expiresAt: '2026-11-19T12:05:00.000Z' });
    renderPage();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole('button', { name: 'Pay with PayFast' })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60_000);
    });
    expect(screen.queryByRole('button', { name: /PayFast|Retry payment/ })).not.toBeInTheDocument();
  });

  it('reports an error without handing off when PayFast checkout cannot start', async () => {
    startPayFastCheckoutMock.mockRejectedValue(new Error('PayFast is currently unavailable.'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay with PayFast' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('PayFast is currently unavailable.');
    expect(payFastSubmissions).toHaveLength(0);
  });

  it('keeps manual proof orders on the resubmission path instead of PayFast', async () => {
    testState.currentOrder = makeOrder({
      canResubmit: true,
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'REJECTED',
      },
    });
    renderPage();

    expect(
      await screen.findByRole('button', { name: 'Resubmit payment proof' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PayFast|Retry payment/ })).not.toBeInTheDocument();
    expect(startPayFastCheckoutMock).not.toHaveBeenCalled();
  });
});

describe('order confirmation PayFast launch transition', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = { id: 'buyer-id' };
    testState.currentError = null;
    startPayFastCheckoutMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['true', 'false'])(
    'shows a pre-launch order cancelled by the transition as cancelled with no payment action (PayFast flag %s)',
    async flag => {
      vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', flag);
      testState.currentOrder = makeOrder({
        canCancel: false,
        canResubmit: false,
        cancellationReason: 'PAYFAST_LAUNCH',
        cancelledAt: '2026-11-19T10:00:00.000Z',
        expiresAt: '2099-01-01T00:00:00.000Z',
        manualPaymentSubmission: null,
        paymentStatus: 'CANCELLED',
        status: 'CANCELLED',
      });
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Order cancelled' })).toBeInTheDocument();
      expect(
        screen.getByText(
          'This unpaid order was cancelled when PayFast checkout launched. No payment is due.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /PayFast|Retry payment|Resubmit|Cancel order/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Pay by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Payment window expired|Payment status/)).not.toBeInTheDocument();
      expect(screen.queryByText('Payfast Launch')).not.toBeInTheDocument();
      expect(startPayFastCheckoutMock).not.toHaveBeenCalled();
    },
  );

  it('keeps requested proof resubmission on the manual path when the PayFast flag is on', async () => {
    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'true');
    testState.currentOrder = makeOrder({
      canCancel: true,
      canResubmit: true,
      expiresAt: '2099-01-01T00:00:00.000Z',
      manualPaymentSubmission: {
        ...makeOrder().manualPaymentSubmission!,
        status: 'RESUBMISSION_REQUESTED',
      },
    });
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Resubmission requested' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PayFast|Retry payment/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resubmit payment proof' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Resubmit payment proof' }),
    ).toBeInTheDocument();
    expect(startPayFastCheckoutMock).not.toHaveBeenCalled();
  });

  it('shows a manual proof under review without a new payment action when the PayFast flag is on', async () => {
    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'true');
    testState.currentOrder = makeOrder();
    renderPage();

    expect(await screen.findByText('Pending review')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /PayFast|Retry payment|Resubmit payment proof/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay by/)).not.toBeInTheDocument();
    expect(startPayFastCheckoutMock).not.toHaveBeenCalled();
  });
});
