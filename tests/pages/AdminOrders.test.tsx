import type { AdminOrder, AdminOrderDetail } from '@/types/adminOrder.type';
import type { AdminComplaint } from '@/types/complaint.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminOrders from '@/pages/admin/Orders';

const orders = vi.hoisted(() => ({ current: [] as AdminOrder[], detail: null as AdminOrderDetail | null, detailError: null as Error | null, listParameters: [] as Record<string, unknown>[] }));
const reservedListings = vi.hoisted(() => ({
  current: [] as {
    buyerId: string;
    listingId: string;
    reservationId: string;
    sellerId: string;
    buyerFullName: string;
    price: number;
    sellerFullName: string;
    title: string;
    reservationExpiresAt: string | null;
  }[],
}));
const adminComplaintService = vi.hoisted(() => ({ listAdminComplaints: vi.fn() }));
const access = vi.hoisted(() => ({ permissions: new Set<string>(['COMPLAINTS_READ']) }));
const cancelAdminOrderMutation = vi.hoisted(() => ({ isPending: false, mutateAsync: vi.fn() }));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/components/admin/AdminManualPaymentReviewDialog', () => ({
  AdminManualPaymentReviewDialog: ({ orderId, submissionId, onClose }: { orderId: string | null; submissionId?: string | null; onClose: () => void }) => orderId && submissionId
    ? (
        <div data-testid="payment-review">
          {`${orderId}:${submissionId}`}
          <button onClick={onClose}>Close review</button>
        </div>
      )
    : null,
  maskSenderAccountNumber: (value: string) => `MASKED-${value.slice(-4)}`,
}));

vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({ can: (permission: string) => access.permissions.has(permission) }),
}));

vi.mock('@/services/complain.service', () => ({
  listAdminComplaints: adminComplaintService.listAdminComplaints,
  updateComplaintStatus: vi.fn(),
}));

vi.mock('@/queries/adminOrders.query', () => ({
  getAdminOrderOptions: (orderId: string, isEnabled: boolean) => ({
    enabled: isEnabled,
    queryFn: async () => {
      if (orders.detailError)
        throw orders.detailError;
      return { data: orders.detail ?? orders.current.find(order => order.id === orderId) };
    },
    queryKey: ['admin-orders', 'orders', 'detail', orderId],
  }),
  getAdminOrdersOptions: (parameters: Record<string, unknown>) => {
    orders.listParameters.push(parameters);
    return {
      queryFn: async () => ({ data: orders.current }),
      queryKey: ['admin-orders', 'orders', 'list', parameters],
    };
  },
  getAdminReservedListingsOptions: () => ({
    queryFn: async () => ({ data: reservedListings.current }),
    queryKey: ['admin-orders', 'reserved-listings', 'list'],
  }),
  useCancelAdminOrderMutation: () => cancelAdminOrderMutation,
}));

function makeOrder(status: 'APPROVED' | 'SUBMITTED', title: string): AdminOrder {
  return {
    id: `${status}-order-id`,
    buyerId: 'buyer-id',
    buyerFullName: 'Jane Buyer',
    cancellationReason: null,
    commissionAmount: 0,
    currency: 'PKR',
    discountAmount: 0,
    discountCode: null,
    items: [{
      id: `${status}-item-id`,
      buyerId: 'buyer-id',
      commissionTierId: null,
      listingId: 'listing-id',
      offerId: null,
      orderId: `${status}-order-id`,
      reservationId: null,
      sellerCouponId: null,
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
      sellerCouponCode: null,
      sellerCouponDiscountAmount: 0,
      sellerFullName: 'Example Seller',
      shippingMethod: null,
      size: 'M',
      status: 'CONFIRMED',
      subcategory: 'Tops',
      taxAmount: 0,
      title,
      total: 100,
      trackingNumber: null,
      receivedAt: null,
      shippedAt: null,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    }],
    itemStatusCounts: { completed: 0, confirmed: 1, received: 0, shipped: 0 },
    manualPaymentSubmissions: [{
      id: `${status}-submission-id`,
      orderId: `${status}-order-id`,
      proofFileId: 'proof-id',
      reviewerId: status === 'APPROVED' ? 'reviewer-id' : null,
      reviewNote: null,
      senderAccountNumber: '123456789012',
      senderAccountTitle: 'Jane Buyer',
      status,
      reviewedAt: status === 'APPROVED' ? '2026-09-08T01:00:00.000Z' : null,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    }],
    paymentStatus: 'PENDING',
    platformFeeAmount: 0,
    refundStatus: null,
    restorableListingIds: [],
    sellerCouponApplications: [],
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
  };
}

function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Back</button>;
}

function LocationCapture() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

beforeEach(() => {
  orders.current = [];
  orders.detail = null;
  orders.detailError = null;
  orders.listParameters = [];
  reservedListings.current = [];
  adminComplaintService.listAdminComplaints.mockClear();
  cancelAdminOrderMutation.mutateAsync.mockReset().mockResolvedValue({ message: 'Order cancelled', statusCode: 200 });
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  access.permissions = new Set(['COMPLAINTS_READ']);
  adminComplaintService.listAdminComplaints.mockResolvedValue({
    data: [],
    pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 0 },
  });
});

function makeComplaint(orderId: string, orderItemId: string, listingId: string, status: AdminComplaint['status'] = 'RAISED'): AdminComplaint {
  return {
    id: `complaint-${orderItemId}`,
    buyerId: 'buyer-id',
    listingId,
    orderId,
    orderItemId,
    sellerId: 'seller-id',
    adminNotes: 'Please review the return.',
    buyerFullName: 'Jane Buyer',
    evidenceUrls: ['https://cdn.example.test/evidence.png'],
    expectedReturnDate: null,
    listingTitle: 'Example item',
    reason: 'The item arrived damaged.',
    resolverFullName: null,
    returnAddress: null,
    returnAddressCity: null,
    returnAddressPhone: null,
    returnAddressPostal: null,
    returnAddressRecipient: null,
    returnCarrier: null,
    returnInstructions: null,
    returnProofUrls: ['https://cdn.example.test/return-proof.png'],
    returnTracking: null,
    sellerFullName: 'Example Seller',
    status,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-09T00:00:00.000Z',
  };
}

describe('admin order number search', () => {
  it('sends the order number search with list parameters, shows the short ID, and combines it with status filters', async () => {
    const searchedOrder = makeOrder('SUBMITTED', 'Matching order');
    searchedOrder.id = 'AbCd1234-1234-1234-1234-123456789012';
    searchedOrder.items[0].orderId = searchedOrder.id;
    const otherOrder = makeOrder('APPROVED', 'Different order');
    otherOrder.id = 'Other000-1234-1234-1234-123456789012';
    otherOrder.items[0].orderId = otherOrder.id;
    orders.current = [searchedOrder, otherOrder];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const search = screen.getByRole('textbox', { name: 'Search by order #' });
    await screen.findByText('Matching order');
    expect(screen.getByRole('columnheader', { name: 'Order #' })).toBeInTheDocument();
    expect(screen.getByText('#AbCd1234')).toBeInTheDocument();

    const manualReviewTab = screen.getByRole('tab', { name: 'Manual review' });
    fireEvent.mouseDown(manualReviewTab);
    fireEvent.click(manualReviewTab);
    fireEvent.change(search, { target: { value: '  # AbCd1234  ' } });

    await waitFor(() => expect(orders.listParameters).toContainEqual(expect.objectContaining({
      search: '# AbCd1234',
      size: 100,
      sortOrder: 'desc',
      sortBy: 'createdAt',
    })));
    expect(await screen.findByText('Matching order')).toBeInTheDocument();
    expect(screen.queryByText('Different order')).not.toBeInTheDocument();

    const allOrdersTab = screen.getByRole('tab', { name: 'All' });
    fireEvent.mouseDown(allOrdersTab);
    fireEvent.click(allOrdersTab);
    fireEvent.change(search, { target: { value: '' } });
    await waitFor(() => expect(orders.listParameters).toContainEqual(expect.objectContaining({
      search: undefined,
      size: 100,
    })));
    expect(await screen.findByText('Different order')).toBeInTheDocument();
  });

  it('hides order number search while reserved listings are selected', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const reservedTab = screen.getByRole('tab', { name: 'Reserved' });
    fireEvent.mouseDown(reservedTab);
    fireEvent.click(reservedTab);
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Search by order #' })).not.toBeInTheDocument());
  });

  it('shows an awaiting-review state for a reserved listing without an expiry deadline', async () => {
    reservedListings.current = [{
      buyerId: 'buyer-id',
      listingId: 'listing-id',
      reservationId: 'reservation-id',
      sellerId: 'seller-id',
      buyerFullName: 'Jane Buyer',
      price: 100,
      sellerFullName: 'Example Seller',
      title: 'Reserved item under review',
      reservationExpiresAt: null,
    }];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const reservedTab = screen.getByRole('tab', { name: 'Reserved' });
    fireEvent.mouseDown(reservedTab);
    fireEvent.click(reservedTab);

    expect(await screen.findByText('Awaiting admin review')).toBeInTheDocument();
    expect(screen.getByText('Reserved item under review')).toBeInTheDocument();
    expect(screen.queryByText(/Jan 1, 1970/i)).not.toBeInTheDocument();
  });
});

describe('admin order cancellation', () => {
  it('requires ORDERS_UPDATE and confirms through the admin action', async () => {
    const order = makeOrder('APPROVED', 'Cancelable order item');
    order.status = 'SHIPPED';
    order.items[0].status = 'SHIPPED';
    orders.current = [order];

    const tree = (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const { rerender } = render(tree);

    fireEvent.click(await screen.findByText('Cancelable order item'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();

    access.permissions.add('ORDERS_UPDATE');
    rerender(tree);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel order' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));

    const confirmation = await screen.findByRole('alertdialog');
    expect(within(confirmation).getByText('Cancel order #APPROVED?')).toBeInTheDocument();
    expect(within(confirmation).getByText('The whole order will be marked cancelled and its sold items will be listed for sale again. This can\'t be undone.')).toBeInTheDocument();
    expect(within(confirmation).getByRole('button', { name: 'Keep order' })).toBeInTheDocument();
    expect(within(confirmation).getByRole('button', { name: 'Yes, cancel order' })).toBeInTheDocument();

    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes, cancel order' }));
    await waitFor(() => expect(cancelAdminOrderMutation.mutateAsync).toHaveBeenCalledWith(order.id));
    expect(toast.success).toHaveBeenCalledWith('Order cancelled and items relisted');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the detail available after a failed cancellation and gives cancelled orders their own status', async () => {
    const cancelledOrder = makeOrder('APPROVED', 'Cancelled shipped item');
    cancelledOrder.id = 'cancelled-order-id';
    cancelledOrder.status = 'CANCELLED';
    cancelledOrder.items[0].id = 'cancelled-item-id';
    cancelledOrder.items[0].orderId = cancelledOrder.id;
    cancelledOrder.items[0].status = 'DELIVERED';
    orders.current = [cancelledOrder];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('tab', { name: 'Cancelled' }));
    const cancelledRow = await screen.findByText('Cancelled shipped item');
    expect(screen.getByText('Total items').nextElementSibling).toHaveTextContent('0');
    expect(within(cancelledRow.closest('tr')!).getByText('cancelled')).toBeInTheDocument();
    fireEvent.click(cancelledRow);
    const detailDialog = await screen.findByRole('dialog');
    expect(within(detailDialog).getByText('Order cancelled')).toBeInTheDocument();
    expect(within(detailDialog).getByText('cancelled')).toBeInTheDocument();
    expect(within(detailDialog).queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
  });

  it('shows the API error and leaves the order open for retry', async () => {
    access.permissions.add('ORDERS_UPDATE');
    cancelAdminOrderMutation.mutateAsync.mockRejectedValue(new Error('Order cannot be cancelled'));
    const order = makeOrder('SUBMITTED', 'Retryable item');
    orders.current = [order];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByText('Retryable item'));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, cancel order' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not cancel order: Order cannot be cancelled'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, cancel order' })).toBeInTheDocument();
  });
});

describe('admin orders manual review filter', () => {
  it('shows actionable manual submissions and hides already reviewed orders', async () => {
    orders.current = [
      makeOrder('SUBMITTED', 'Needs review'),
      makeOrder('APPROVED', 'Already approved'),
    ];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const manualReviewTab = await screen.findByRole('tab', { name: 'Manual review' });
    fireEvent.mouseDown(manualReviewTab);
    fireEvent.click(manualReviewTab);

    expect(await screen.findByText('Needs review')).toBeInTheDocument();
    expect(screen.queryByText('Already approved')).not.toBeInTheDocument();
    expect(screen.getByText('MASKED-9012')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review payment' })).toBeInTheDocument();
  });
});

describe('admin order complaints', () => {
  it('does not request or show complaint data without COMPLAINTS_READ', async () => {
    access.permissions.delete('COMPLAINTS_READ');
    const order = makeOrder('SUBMITTED', 'Delivered order');
    order.items[0].status = 'DELIVERED';
    orders.current = [order];

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('delivered')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View complaint details' })).not.toBeInTheDocument();
    expect(adminComplaintService.listAdminComplaints).not.toHaveBeenCalled();
  });

  it('associates complaints with one exact item and shows source dialog details and active/closed variants', async () => {
    const order = makeOrder('SUBMITTED', 'First complaint item');
    order.id = 'complaint-order-id';
    order.items[0].id = 'item-one';
    order.items[0].orderId = order.id;
    order.items[0].listingId = 'listing-one';
    order.items.push(
      { ...order.items[0], id: 'item-two', listingId: 'listing-two', title: 'No complaint item' },
      { ...order.items[0], id: 'item-three', listingId: 'listing-three', title: 'Closed complaint item' },
    );
    orders.current = [order];
    adminComplaintService.listAdminComplaints.mockResolvedValue({
      data: [
        makeComplaint(order.id, 'item-one', 'listing-one'),
        makeComplaint(order.id, 'item-three', 'listing-three', 'RETURN_RECEIVED'),
      ],
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 2 },
    });

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const complaintButtons = await screen.findAllByRole('button', { name: 'View complaint details' });
    expect(complaintButtons).toHaveLength(2);
    expect(complaintButtons[0].firstElementChild).toHaveClass('bg-destructive');
    expect(complaintButtons[1].firstElementChild).toHaveClass('bg-secondary');
    const itemWithoutComplaint = screen.getByText('No complaint item').closest('tr');
    expect(itemWithoutComplaint).not.toBeNull();
    expect(within(itemWithoutComplaint!).queryByRole('button', { name: 'View complaint details' })).not.toBeInTheDocument();
    expect(adminComplaintService.listAdminComplaints).toHaveBeenCalledWith({
      orderIds: [order.id],
      page: 1,
      size: 100,
    });

    fireEvent.click(complaintButtons[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Order Complaint')).toBeInTheDocument();
    expect(within(dialog).getByText('Complaint Raised')).toBeInTheDocument();
    expect(within(dialog).getByText('The item arrived damaged.')).toBeInTheDocument();
    expect(within(dialog).getByText('Please review the return.')).toBeInTheDocument();
    expect(within(dialog).getByAltText('Evidence 1')).toHaveAttribute('src', 'https://cdn.example.test/evidence.png');
    expect(within(dialog).getByAltText('Return proof 1')).toHaveAttribute('src', 'https://cdn.example.test/return-proof.png');
    expect(within(dialog).getByText(/Last updated/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Open Complaints section/ })).toHaveAttribute('href', '/admin/complaints');
  });

  it('loads all complaint pages for the current order IDs', async () => {
    const order = makeOrder('SUBMITTED', 'Paged complaints');
    order.id = 'paged-order-id';
    order.items[0].id = 'paged-item-one';
    order.items[0].orderId = order.id;
    order.items[0].listingId = 'paged-listing-one';
    order.items.push({ ...order.items[0], id: 'paged-item-two', listingId: 'paged-listing-two' });
    orders.current = [order];
    adminComplaintService.listAdminComplaints.mockImplementation(async ({ page }: { page: number }) => ({
      data: [makeComplaint(order.id, `paged-item-${page === 1 ? 'one' : 'two'}`, `paged-listing-${page === 1 ? 'one' : 'two'}`)],
      pagination: { currentPage: page, lastPage: 2, nextPage: page === 1 ? 2 : null, perPage: 100, prevPage: page === 1 ? null : 1, total: 2 },
    }));

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(adminComplaintService.listAdminComplaints).toHaveBeenCalledTimes(2));
    expect(adminComplaintService.listAdminComplaints).toHaveBeenNthCalledWith(2, {
      orderIds: [order.id],
      page: 2,
      size: 100,
    });
    expect(await screen.findAllByRole('button', { name: 'View complaint details' })).toHaveLength(2);
  });

  it('stops loading complaint pages after a later page fails', async () => {
    const order = makeOrder('SUBMITTED', 'Failed complaint page');
    order.items[0].listingId = 'failed-listing-one';
    orders.current = [order];
    adminComplaintService.listAdminComplaints.mockImplementation(async ({ page }: { page: number }) => {
      if (page === 2) {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Complaint page failed');
      }
      return {
        data: [makeComplaint(order.id, order.items[0].id, 'failed-listing-one')],
        pagination: { currentPage: 1, lastPage: 2, nextPage: 2, perPage: 100, prevPage: null, total: 101 },
      };
    });

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('button', { name: 'View complaint details' })).toBeInTheDocument();
    await waitFor(() => expect(adminComplaintService.listAdminComplaints).toHaveBeenCalledTimes(2));
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(adminComplaintService.listAdminComplaints).toHaveBeenCalledTimes(2);
  });
});

describe('admin order notification selection', () => {
  it('opens the exact payment submission selected in the URL and follows browser history', async () => {
    const order = makeOrder('SUBMITTED', 'Payment review item');
    order.manualPaymentSubmissions.push({
      ...order.manualPaymentSubmissions[0],
      id: 'newer-submission-id',
      updatedAt: '2026-09-09T00:00:00.000Z',
    });
    orders.current = [order];
    orders.detail = null;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter
          initialEntries={[
            '/admin/orders',
            '/admin/orders?order=SUBMITTED-order-id&paymentSubmission=SUBMITTED-submission-id',
          ]}
          initialIndex={1}
        >
          <LocationCapture />
          <BackButton />
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId('payment-review')).toHaveTextContent('SUBMITTED-order-id:SUBMITTED-submission-id');
    expect(screen.getByTestId('location')).toHaveTextContent('paymentSubmission=SUBMITTED-submission-id');
    await screen.findAllByText('Payment review item');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => expect(screen.queryByTestId('payment-review')).not.toBeInTheDocument());
  });

  it('returns to the orders list without opening order details when the payment review closes', async () => {
    orders.current = [makeOrder('SUBMITTED', 'Payment review item')];
    orders.detail = null;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/orders?order=SUBMITTED-order-id&paymentSubmission=SUBMITTED-submission-id']}>
          <LocationCapture />
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findAllByText('Payment review item');
    fireEvent.click(await screen.findByText('Close review'));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/admin\/orders$/));
    expect(screen.queryByTestId('payment-review')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('falls back to the orders list when the selected payment submission is missing', async () => {
    orders.current = [makeOrder('SUBMITTED', 'Payment review item')];
    orders.detail = null;
    orders.detailError = null;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/orders?order=SUBMITTED-order-id&paymentSubmission=missing-submission']}>
          <LocationCapture />
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/orders'));
    await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('paymentSubmission'));
    expect(screen.queryByTestId('payment-review')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).not.toHaveTextContent('paymentSubmission');
    expect(screen.getByTestId('location')).not.toHaveTextContent('order=');
  });

  it('preserves the review selection when loading the order fails temporarily', async () => {
    orders.current = [makeOrder('SUBMITTED', 'Payment review item')];
    orders.detail = null;
    orders.detailError = new Error('Network unavailable');

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/orders?order=SUBMITTED-order-id&paymentSubmission=SUBMITTED-submission-id']}>
          <LocationCapture />
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId('payment-review')).toHaveTextContent('SUBMITTED-order-id:SUBMITTED-submission-id');
    expect(screen.getByTestId('location')).toHaveTextContent('paymentSubmission=SUBMITTED-submission-id');
  });

  it('loads selected orders outside the initial order list', async () => {
    orders.current = [];
    orders.detail = makeOrder('SUBMITTED', 'Older selected item') as unknown as AdminOrderDetail;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/orders?order=SUBMITTED-order-id&item=SUBMITTED-item-id']}>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Older selected item')).toBeInTheDocument();
  });

  it('opens the order selected in the URL', async () => {
    orders.current = [makeOrder('SUBMITTED', 'Selected order item')];
    orders.detail = null;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/admin/orders?order=SUBMITTED-order-id&item=SUBMITTED-item-id']}>
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Selected order item')).toBeInTheDocument();
  });

  it('closes the selected order when browser history removes its URL state', async () => {
    orders.current = [makeOrder('SUBMITTED', 'Selected order item')];
    orders.detail = null;

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter
          initialEntries={[
            '/admin/orders',
            '/admin/orders?order=SUBMITTED-order-id&item=SUBMITTED-item-id',
          ]}
          initialIndex={1}
        >
          <BackButton />
          <AdminOrders />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
