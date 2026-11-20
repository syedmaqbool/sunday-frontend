import type { MarketplaceListing } from '@/queries/marketplace.query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { CartProvider, useCart } from '@/contexts/CartContext';
import PaymentReturn from '@/pages/PaymentReturn';

// The buyer comes back from PayFast on a full page load, so auth resolves after the first render.
// These tests use the real CartProvider to prove the cart is actually empty once that settles.
const { authState, fetchMarketplaceListingMock } = vi.hoisted(() => ({
  authState: { loading: true, user: null as { id: string } | null },
  fetchMarketplaceListingMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/queries/marketplace.query', () => ({
  fetchMarketplaceListing: fetchMarketplaceListingMock,
}));

const listing = {
  id: 'listing-id',
  price: 1000,
  status: 'APPROVED',
  title: 'Example coat',
} as unknown as MarketplaceListing;

function OrderStatusPage() {
  const { totalItems } = useCart();
  return <div data-testid="cart-count">{totalItems}</div>;
}

function Tree({ path }: { path: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <Routes>
          <Route element={<PaymentReturn />} path="/payment/success" />
          <Route element={<PaymentReturn />} path="/payment/cancel" />
          <Route element={<OrderStatusPage />} path="/order-confirmation/:id" />
        </Routes>
      </CartProvider>
    </MemoryRouter>
  );
}

describe('payment return with the real cart', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMarketplaceListingMock.mockReset().mockResolvedValue(listing);
    authState.loading = true;
    authState.user = null;
    localStorage.setItem('cart:user-id', JSON.stringify([{ listing }]));
  });

  it.each(['/payment/success?orderId=order-id', '/payment/cancel?orderId=order-id'])(
    'leaves the signed-in buyer with an empty cart after auth resolves on %s',
    async path => {
      const { rerender } = render(<Tree path={path} />);

      authState.loading = false;
      authState.user = { id: 'user-id' };
      rerender(<Tree path={path} />);

      expect(await screen.findByTestId('cart-count')).toBeInTheDocument();
      await waitFor(() => expect(localStorage.getItem('cart:user-id')).toBe('[]'));
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    },
  );
});
