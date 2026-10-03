import type { AdminOrder, AdminOrderDetail } from '@/types/adminOrder.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminOrders from '@/pages/admin/Orders';

const orders = vi.hoisted(() => ({ current: [] as AdminOrder[], detail: null as AdminOrderDetail | null }));

vi.mock('@/components/admin/AdminManualPaymentReviewDialog', () => ({
  AdminManualPaymentReviewDialog: () => null,
  maskSenderAccountNumber: (value: string) => `MASKED-${value.slice(-4)}`,
}));

vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({ can: () => true }),
}));

vi.mock('@/queries/adminOrders.query', () => ({
  getAdminOrderOptions: (orderId: string, isEnabled: boolean) => ({
    enabled: isEnabled,
    queryFn: async () => ({ data: orders.detail ?? orders.current.find(order => order.id === orderId) }),
    queryKey: ['admin-orders', 'orders', 'detail', orderId],
  }),
  getAdminOrdersOptions: () => ({
    queryFn: async () => ({ data: orders.current }),
    queryKey: ['admin-orders', 'orders', 'list'],
  }),
  getAdminReservedListingsOptions: () => ({
    queryFn: async () => ({ data: [] }),
    queryKey: ['admin-orders', 'reserved-listings', 'list'],
  }),
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

describe('admin order notification selection', () => {
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
