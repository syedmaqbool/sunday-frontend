import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarketplaceListing } from '@/types/marketplace.type';
import Checkout from '@/pages/Checkout';
type CheckoutListing = Pick<MarketplaceListing, 'categoryValue' | 'id' | 'price' | 'title'>
  & Partial<Pick<MarketplaceListing, 'reservedForCurrentUser' | 'reservedOfferId' | 'reservedUntil'>>;

const { cartState, useQueryMock, validateDiscountMock, validateSellerCouponMock } = vi.hoisted(() => ({
  cartState: {
    items: [{
      listing: {
        id: 'listing-id',
        categoryValue: 'clothing',
        price: 1000,
        title: 'Example coat',
      },
    }],
  },
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
vi.mock('@/components/ManualPaymentDialog', () => ({ ManualPaymentDialog: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'buyer-id' } }) }));
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    clearCart: vi.fn(),
    isHydrated: true,
    items: cartState.items,
    removeItem: vi.fn(),
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
  useCreateCheckoutMutation: () => ({ mutateAsync: vi.fn() }),
  useValidateDiscountMutation: () => ({ mutateAsync: validateDiscountMock }),
  useValidateSellerCouponMutation: () => ({ mutateAsync: validateSellerCouponMock }),
}));
vi.mock('@/queries/marketplace.query', () => ({ getListingMediaUrls: () => [] }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

function renderCheckout() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Checkout />
    </MemoryRouter>,
  );
}

describe('checkout seller coupons', () => {
  beforeEach(() => {
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
});

describe('checkout accepted offer deadline', () => {
  it('prevents checkout when an accepted offer reservation deadline has passed', () => {
    cartState.items = [{
      listing: {
        id: 'accepted-listing-id',
        reservedOfferId: 'offer-id',
        categoryValue: 'clothing',
        price: 1000,
        reservedForCurrentUser: true,
        reservedUntil: '2000-01-01T00:00:00.000Z',
        title: 'Accepted offer coat',
      },
    }] as Array<{ listing: CheckoutListing }>;

    renderCheckout();

    expect(screen.getByRole('alert')).toHaveTextContent('The payment deadline for this accepted offer has passed.');
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
  });
});
