import type { MarketplaceListing } from '@/queries/marketplace.query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/contexts/CartContext';

const { fetchMarketplaceListingMock } = vi.hoisted(() => ({
  fetchMarketplaceListingMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
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

function CartSummary() {
  const { items, totalItems, totalPrice } = useCart();
  return (
    <div>
      <span data-testid="item-count">{totalItems}</span>
      <span data-testid="total-price">{totalPrice}</span>
      <span data-testid="cart-items">{JSON.stringify(items)}</span>
    </div>
  );
}

describe('cart provider', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMarketplaceListingMock.mockReset().mockResolvedValue(listing);
  });

  it('normalizes legacy quantities to one per unique listing', async () => {
    localStorage.setItem('cart:guest', JSON.stringify([
      { listing, quantity: 4 },
    ]));

    render(
      <CartProvider>
        <CartSummary />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('1'));

    expect(screen.getByTestId('total-price')).toHaveTextContent('1000');
    const persistedCart = JSON.parse(localStorage.getItem('cart:guest') ?? '[]');
    expect(persistedCart).toHaveLength(1);
    expect(persistedCart[0]).not.toHaveProperty('quantity');
  });
});
