import type { CheckoutQuote } from '@/types/checkout.type';
import type { MarketplaceListing } from '@/types/marketplace.type';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from '@/pages/Checkout';

type CheckoutListing = Pick<MarketplaceListing, 'categoryValue' | 'id' | 'price' | 'title'>
  & Partial<Pick<MarketplaceListing, 'reservedForCurrentUser' | 'reservedOfferId' | 'reservedUntil' | 'status'>>;

const {
  cartState,
  createCheckoutMock,
  quoteCheckoutMock,
  removeItemMock,
} = vi.hoisted(() => ({
  cartState: {
    items: [{
      listing: {
        id: 'listing-id',
        categoryValue: 'clothing',
        price: 1000,
        title: 'Example coat',
      },
    }] as { listing: CheckoutListing }[],
  },
  createCheckoutMock: vi.fn(),
  quoteCheckoutMock: vi.fn(),
  removeItemMock: vi.fn(),
}));
vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/ManualPaymentDialog', () => ({
  ManualPaymentDialog: ({
    onSubmit,
    open,
  }: {
    onSubmit: (data: {
      proofFileId: string;
      senderAccountNumber: string;
      senderAccountTitle: string;
    }) => Promise<void>;
    open: boolean;
  }) => open
    ? (
        <div role="dialog">
          <button
            onClick={() => {
              void onSubmit({
                proofFileId: 'proof-file-id',
                senderAccountNumber: '1234567890',
                senderAccountTitle: 'Jane Doe',
              });
            }}
          >
            Submit payment proof
          </button>
        </div>
      )
    : null,
}));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'buyer-id' } }) }));
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    clearCart: vi.fn(),
    isHydrated: true,
    items: cartState.items,
    removeItem: removeItemMock,
    totalItems: cartState.items.length,
    totalPrice: cartState.items.reduce((total, item) => total + item.listing.price, 0),
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/queries/checkout.query', () => ({
  useCheckoutQuoteMutation: () => ({ mutateAsync: quoteCheckoutMock }),
  useCreateCheckoutMutation: () => ({ mutateAsync: createCheckoutMock }),
}));
vi.mock('@/queries/marketplace.query', () => ({ getListingMediaUrls: () => [] }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

function renderCheckout() {
  const view = render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Checkout />
    </MemoryRouter>,
  );
  return {
    ...view,
    rerenderCheckout: () => view.rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Checkout />
      </MemoryRouter>,
    ),
  };
}

function fillShippingInformation() {
  const details = {
    'Address': '123 Main Street',
    'City': 'Cape Town',
    'First name': 'Jane',
    'Last name': 'Doe',
    'Phone': '+27 12 345 6789',
    'Postal code': '8001',
  };

  for (const [label, value] of Object.entries(details)) {
    fireEvent.change(screen.getByRole('textbox', { name: label }), {
      target: { value },
    });
  }
}

function buildCheckoutQuote(
  listingIds: string[],
  discountCode?: string,
  sellerCoupons: CheckoutQuote['appliedSellerCoupons'] = [],
): CheckoutQuote {
  const items = listingIds.map((listingId) => {
    const listing = cartState.items.find(({ listing }) => listing.id === listingId)?.listing;
    const price = listing?.price ?? 1000;
    const sellerCouponAllocation = sellerCoupons
      .flatMap(coupon => coupon.allocations)
      .find(allocation => allocation.listingId === listingId);
    const sellerCouponDiscountAmount = sellerCouponAllocation?.discountAmount ?? 0;
    const marketplaceDiscountAmount = discountCode ? 100 : 0;
    const taxAmount = 100;
    const commissionAmount = 100;
    return {
      listingId,
      sellerCouponId: sellerCouponDiscountAmount > 0 ? sellerCoupons[0]?.id ?? null : null,
      sellerId: `seller-${listingId}`,
      commissionAmount,
      commissionRate: 10,
      discountAmount: marketplaceDiscountAmount,
      marketplaceDiscountAmount,
      platformFeeAmount: commissionAmount,
      price,
      sellerCouponDiscountAmount,
      taxAmount,
      title: listing?.title ?? 'Example listing',
      total: price - sellerCouponDiscountAmount - marketplaceDiscountAmount + taxAmount + commissionAmount,
    };
  });
  const subtotal = items.reduce((total, item) => total + item.price, 0);
  const sellerCouponDiscountAmount = items.reduce((total, item) => total + item.sellerCouponDiscountAmount, 0);
  const marketplaceDiscountAmount = items.reduce((total, item) => total + item.marketplaceDiscountAmount, 0);

  return {
    appliedSellerCoupons: sellerCoupons,
    commissionAmount: items.reduce((total, item) => total + item.commissionAmount, 0),
    currency: 'PKR',
    discountAmount: marketplaceDiscountAmount,
    items,
    marketplaceDiscountAmount,
    marketplaceDiscountCode: discountCode ?? null,
    platformFeeAmount: items.reduce((total, item) => total + item.platformFeeAmount, 0),
    quoteRevision: `revision-${listingIds.join('-')}-${discountCode ?? 'none'}`,
    sellerCouponDiscountAmount,
    subtotal,
    subtotalAfterSellerCoupons: subtotal - sellerCouponDiscountAmount,
    taxAmount: items.reduce((total, item) => total + item.taxAmount, 0),
    taxRate: 10,
    total: items.reduce((total, item) => total + item.total, 0),
    totalAfterDiscount: subtotal - sellerCouponDiscountAmount - marketplaceDiscountAmount,
  };
}

async function submitCheckout() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());
  fillShippingInformation();
  fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Submit payment proof' }));
  await waitFor(() => expect(createCheckoutMock).toHaveBeenCalled());
}

async function waitForCheckoutQuote() {
  await waitFor(() => expect(screen.getByText('Total').parentElement).not.toHaveTextContent('—'));
}

describe('checkout', () => {
  beforeEach(() => {
    createCheckoutMock.mockReset().mockResolvedValue({
      data: {
        manualPaymentSubmission: { id: 'submission-id' },
        order: { id: 'order-id' },
      },
    });
    quoteCheckoutMock.mockReset().mockImplementation((payload: { discountCode?: string; listingIds: string[] }) => Promise.resolve({
      data: buildCheckoutQuote(payload.listingIds, payload.discountCode),
    }));
    removeItemMock.mockReset();
    removeItemMock.mockImplementation((listingId: string) => {
      cartState.items = cartState.items.filter(({ listing }) => listing.id !== listingId);
    });
    cartState.items = [{
      listing: {
        id: 'listing-id',
        categoryValue: 'clothing',
        price: 1000,
        title: 'Example coat',
      },
    }];
  });

  it('blocks a mixed cart containing an accepted-offer listing before order creation', async () => {
    cartState.items = [
      {
        listing: {
          id: 'reserved-listing-id',
          categoryValue: 'clothing',
          price: 1000,
          reservedForCurrentUser: true,
          status: 'RESERVED',
          title: 'Reserved coat',
        },
      },
      {
        listing: {
          id: 'other-listing-id',
          categoryValue: 'clothing',
          price: 500,
          status: 'APPROVED',
          title: 'Other sweater',
        },
      },
    ];
    renderCheckout();

    expect(screen.getByRole('alert')).toHaveTextContent('Reserved coat');
    expect(screen.getByRole('alert')).toHaveTextContent('checked out by itself');
    const placeOrderButton = screen.getByRole('button', { name: 'Place Order' });
    expect(placeOrderButton).toBeDisabled();

    fireEvent.click(placeOrderButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it('allows checkout when the cart contains only the accepted-offer listing', async () => {
    cartState.items = [{
      listing: {
        id: 'reserved-listing-id',
        categoryValue: 'clothing',
        price: 1000,
        reservedForCurrentUser: true,
        status: 'RESERVED',
        title: 'Reserved coat',
      },
    }];
    renderCheckout();
    await waitForCheckoutQuote();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());

    await submitCheckout();

    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({
      listingIds: ['reserved-listing-id'],
    }));
  });

  it('lets buyers remove other cart items and continue with the accepted offer', async () => {
    cartState.items = [
      {
        listing: {
          id: 'reserved-listing-id',
          categoryValue: 'clothing',
          price: 1000,
          reservedForCurrentUser: true,
          status: 'RESERVED',
          title: 'Reserved coat',
        },
      },
      {
        listing: {
          id: 'other-listing-id',
          categoryValue: 'clothing',
          price: 500,
          status: 'APPROVED',
          title: 'Other sweater',
        },
      },
    ];
    const { rerenderCheckout } = renderCheckout();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Other sweater from cart' }));

    expect(removeItemMock).toHaveBeenCalledWith('other-listing-id');
    rerenderCheckout();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());

    await submitCheckout();

    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({
      listingIds: ['reserved-listing-id'],
    }));
  });

  it('keeps regular multi-listing checkout unchanged', async () => {
    cartState.items = [
      {
        listing: {
          id: 'first-listing-id',
          categoryValue: 'clothing',
          price: 1000,
          status: 'APPROVED',
          title: 'First coat',
        },
      },
      {
        listing: {
          id: 'second-listing-id',
          categoryValue: 'clothing',
          price: 500,
          status: 'APPROVED',
          title: 'Second sweater',
        },
      },
    ];
    renderCheckout();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());

    await submitCheckout();

    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({
      listingIds: ['first-listing-id', 'second-listing-id'],
    }));
  });

  it('shows automatic seller coupon allocations and keeps marketplace code entry', async () => {
    const automaticCoupon: CheckoutQuote['appliedSellerCoupons'][number] = {
      id: 'seller-coupon-id',
      sellerId: 'seller-listing-id',
      allocations: [{ listingId: 'listing-id', discountAmount: 200 }],
      code: 'AUTO200',
      discountAmount: 200,
      discountType: 'FIXED',
      discountValue: 200,
      scope: 'ITEM_BASED',
    };
    quoteCheckoutMock.mockImplementation((payload: { discountCode?: string; listingIds: string[] }) => Promise.resolve({
      data: buildCheckoutQuote(payload.listingIds, payload.discountCode, [automaticCoupon]),
    }));
    renderCheckout();

    expect(await screen.findByLabelText('Automatic seller coupons')).toHaveTextContent('AUTO200');
    expect(screen.getByLabelText('Automatic seller coupons')).toHaveTextContent('Example coat');
    expect(screen.getByPlaceholderText('Discount code')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/seller coupon/i)).not.toBeInTheDocument();
    expect(screen.getByText('Seller coupons').parentElement).toHaveTextContent('−Rs 200');

    fireEvent.change(screen.getByPlaceholderText('Discount code'), { target: { value: 'market10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(quoteCheckoutMock).toHaveBeenLastCalledWith({
      discountCode: 'MARKET10',
      listingIds: ['listing-id'],
    }));
    expect(await screen.findByText('MARKET10')).toBeInTheDocument();
    expect(screen.getByLabelText('Automatic seller coupons')).toHaveTextContent('AUTO200');
    expect(screen.getByText('Seller coupons').parentElement).toHaveTextContent('−Rs 200');
  });

  it('submits the quote revision and only the optional marketplace code', async () => {
    renderCheckout();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());
    fireEvent.change(screen.getByPlaceholderText('Discount code'), { target: { value: 'market10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(quoteCheckoutMock).toHaveBeenLastCalledWith({
      discountCode: 'MARKET10',
      listingIds: ['listing-id'],
    }));
    await screen.findByText('MARKET10');
    await submitCheckout();

    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({
      discountCode: 'MARKET10',
      listingIds: ['listing-id'],
      quoteRevision: expect.stringContaining('revision-listing-id-MARKET10'),
    }));
    expect(createCheckoutMock.mock.calls[0][0]).not.toHaveProperty('sellerCouponCode');
  });

  it('requotes the cart listing set when cart contents change', async () => {
    cartState.items = [
      ...cartState.items,
      {
        listing: {
          id: 'second-listing-id',
          categoryValue: 'clothing',
          price: 500,
          title: 'Example sweater',
        },
      },
    ];
    const { rerender } = renderCheckout();

    await waitFor(() => expect(quoteCheckoutMock).toHaveBeenCalledWith({
      listingIds: ['listing-id', 'second-listing-id'],
    }));

    cartState.items = [cartState.items[1]];
    rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Checkout />
      </MemoryRouter>,
    );

    await waitFor(() => expect(quoteCheckoutMock).toHaveBeenLastCalledWith({
      listingIds: ['second-listing-id'],
    }));
    await waitFor(() => expect(screen.getByText('Total').parentElement).toHaveTextContent('Rs 700'));
  });

  it('shows a changed quote and requires explicit review before retrying', async () => {
    renderCheckout();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled());
    fillShippingInformation();
    fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
    const updatedQuote = {
      ...buildCheckoutQuote(['listing-id']),
      quoteRevision: 'updated-revision',
      total: 1450,
    };
    createCheckoutMock.mockRejectedValueOnce(Object.assign(new Error('Checkout quote changed'), {
      data: {
        requestId: 'request-id',
        code: 'APP_CHECKOUT_QUOTE_CHANGED',
        data: { quote: updatedQuote },
        message: 'Checkout quote changed',
        statusCode: 409,
      },
      response: { status: 409 },
    }));
    fireEvent.click(await screen.findByRole('button', { name: 'Submit payment proof' }));

    await waitFor(() => expect(createCheckoutMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('alert')).toHaveTextContent('The price or coupon selection changed');
    expect(await screen.findByText('Rs 1,450')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    expect(createCheckoutMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'I reviewed the updated quote' }));
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Submit payment proof' }));
    await waitFor(() => expect(createCheckoutMock).toHaveBeenCalledTimes(2));
    expect(createCheckoutMock.mock.calls[1][0]).toEqual(expect.objectContaining({ quoteRevision: 'updated-revision' }));
  });

  it('prevents checkout when an accepted offer reservation deadline has passed', async () => {
    cartState.items = [{
      listing: {
        id: 'accepted-listing-id',
        reservedOfferId: 'offer-id',
        categoryValue: 'clothing',
        price: 1000,
        reservedForCurrentUser: true,
        reservedUntil: '2000-01-01T00:00:00.000Z',
        status: 'RESERVED',
        title: 'Accepted offer coat',
      },
    }];

    renderCheckout();
    await waitForCheckoutQuote();

    expect(screen.getByRole('alert')).toHaveTextContent('The payment deadline for this accepted offer has passed.');
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
  });

  it('blocks another checkout while accepted-offer payment proof is awaiting review', async () => {
    cartState.items = [{
      listing: {
        id: 'accepted-listing-id',
        reservedOfferId: 'offer-id',
        categoryValue: 'clothing',
        price: 1000,
        reservedForCurrentUser: true,
        reservedUntil: null,
        status: 'RESERVED',
        title: 'Accepted offer coat',
      },
    }];

    renderCheckout();
    await waitForCheckoutQuote();

    expect(screen.getByRole('alert')).toHaveTextContent(/payment proof is awaiting admin review/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot start another checkout/i);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/deadline.*passed/i);
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });
});
