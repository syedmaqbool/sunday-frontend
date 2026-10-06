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
  removeItemMock,
  useQueryMock,
  validateDiscountMock,
  validateSellerCouponMock,
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
  removeItemMock: vi.fn(),
  useQueryMock: vi.fn(),
  validateDiscountMock: vi.fn(),
  validateSellerCouponMock: vi.fn(),
}));

const commissionTier = {
  id: 'tier-id',
  active: true,
  categories: ['clothing'],
  maxPrice: null,
  minPrice: 0,
  name: 'Clothing',
  rate: 10,
  sortOrder: 1,
};

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }));
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
vi.mock('@/hooks/useActiveTax', () => ({
  getActiveTaxOptions: () => ({ queryKey: ['active-tax'] }),
}));
vi.mock('@/hooks/useCommissionTiers', () => ({
  getCommissionTiersOptions: () => ({ queryKey: ['commission-tiers'] }),
}));
vi.mock('@/queries/checkout.query', () => ({
  useCreateCheckoutMutation: () => ({ mutateAsync: createCheckoutMock }),
  useValidateDiscountMutation: () => ({ mutateAsync: validateDiscountMock }),
  useValidateSellerCouponMutation: () => ({ mutateAsync: validateSellerCouponMock }),
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

async function submitCheckout() {
  fillShippingInformation();
  fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Submit payment proof' }));
  await waitFor(() => expect(createCheckoutMock).toHaveBeenCalled());
}

describe('checkout', () => {
  beforeEach(() => {
    createCheckoutMock.mockReset().mockResolvedValue({
      data: {
        manualPaymentSubmission: { id: 'submission-id' },
        order: { id: 'order-id' },
      },
    });
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
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) => {
      if (queryKey[0] === 'active-tax') {
        return { data: { id: 'tax-id', name: 'Sales tax', rate: 10 } };
      }
      return { data: { data: [commissionTier] } };
    });
    validateDiscountMock.mockReset().mockRejectedValue(new Error('Not a platform discount'));
    validateSellerCouponMock.mockReset().mockResolvedValue({
      data: {
        sellerId: 'seller-id',
        code: 'FEE20',
        currency: 'PKR',
        discountAmount: 20,
        discountType: 'FIXED',
        discountValue: 20,
        eligibleSubtotal: 1000,
      },
    });
  });

  it('blocks a mixed cart containing an accepted-offer listing before order creation', () => {
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

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled();

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
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled();

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
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeEnabled();

    await submitCheckout();

    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({
      listingIds: ['first-listing-id', 'second-listing-id'],
    }));
  });

  it('uses the backend coupon amount without reducing merchandise subtotal or tax', async () => {
    renderCheckout();

    fireEvent.change(screen.getByPlaceholderText('Discount code'), {
      target: { value: 'FEE20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(validateSellerCouponMock).toHaveBeenCalledWith({
      code: 'FEE20',
      listingIds: ['listing-id'],
    }));

    const subtotalLine = screen.getByText('Subtotal').parentElement;
    expect(subtotalLine).toHaveTextContent('Rs 1,000');
    const taxLine = screen.getByText(/Sales tax/).parentElement;
    expect(taxLine).toHaveTextContent('Rs 100');
    const feeLine = screen.getByText('Platform fee').parentElement;
    expect(feeLine).toHaveTextContent('Rs 100');
    const couponLine = screen.getByText('Coupon (on platform fee)').parentElement;
    expect(couponLine).toHaveTextContent('20');
    expect(screen.getByText('Total').parentElement).toHaveTextContent('Rs 1,180');
  });

  it('clears a validated coupon when the cart listing set changes', async () => {
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

    fireEvent.change(screen.getByPlaceholderText('Discount code'), {
      target: { value: 'FEE20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(validateSellerCouponMock).toHaveBeenCalledWith({
      code: 'FEE20',
      listingIds: ['listing-id', 'second-listing-id'],
    }));
    expect(screen.getByText('Coupon (on platform fee)')).toBeInTheDocument();

    cartState.items = [cartState.items[1]];
    rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Checkout />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Coupon (on platform fee)')).not.toBeInTheDocument();
    expect(screen.queryByText('FEE20')).not.toBeInTheDocument();
    expect(screen.getByText('Total').parentElement).toHaveTextContent('Rs 600');
  });

  it('prevents checkout when an accepted offer reservation deadline has passed', () => {
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

    expect(screen.getByRole('alert')).toHaveTextContent('The payment deadline for this accepted offer has passed.');
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
  });

  it('blocks another checkout while accepted-offer payment proof is awaiting review', () => {
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

    expect(screen.getByRole('alert')).toHaveTextContent(/payment proof is awaiting admin review/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot start another checkout/i);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/deadline.*passed/i);
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });
});
