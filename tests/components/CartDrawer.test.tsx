import type { MarketplaceListing } from '@/types/marketplace.type';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/contexts/CartContext';

const { fetchMarketplaceListingMock } = vi.hoisted(() => ({
  fetchMarketplaceListingMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/queries/marketplace.query', () => ({
  fetchMarketplaceListing: fetchMarketplaceListingMock,
  getListingMediaUrls: () => [],
}));

const savedListing = {
  brand: 'Example Brand',
  categoryValue: 'clothing',
  id: 'listing-id',
  price: 1000,
  status: 'APPROVED',
  title: 'Example coat',
} as MarketplaceListing;

function renderCartDrawer() {
  render(
    <MemoryRouter>
      <CartProvider>
        <CartDrawer />
      </CartProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open cart' }));
}

describe('CartDrawer buyer pricing', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMarketplaceListingMock.mockReset();
  });

  it('shows no guessed fee for an old snapshot and updates when listing reload finishes', async () => {
    let resolveListing!: (listing: MarketplaceListing) => void;
    fetchMarketplaceListingMock.mockReturnValue(
      new Promise<MarketplaceListing>(resolve => {
        resolveListing = resolve;
      }),
    );
    localStorage.setItem('cart:guest', JSON.stringify([{ listing: savedListing }]));

    renderCartDrawer();

    expect(screen.getAllByText('Rs 1,000')).toHaveLength(3);
    expect(screen.queryByText(/Buyer protection fee \(/i)).not.toBeInTheDocument();
    expect(screen.getByText('Buyer protection fee').parentElement).toHaveTextContent('Rs 0');
    expect(screen.getByText('Total payable').parentElement).toHaveTextContent('Rs 1,000');

    resolveListing({
      ...savedListing,
      buyerProtectionFee: { amount: 100, rate: 10 },
      buyerTotalPrice: 1100,
    });

    expect(await screen.findByText('+ Buyer protection fee (10%): Rs 100')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Buyer protection fee').parentElement).toHaveTextContent('Rs 100');
      expect(screen.getByText('Total payable').parentElement).toHaveTextContent('Rs 1,100');
    });
  });

  it('uses accepted-offer buyer pricing for a reserved cart item', async () => {
    fetchMarketplaceListingMock.mockResolvedValue({
      ...savedListing,
      buyerProtectionFee: { amount: 100, rate: 10 },
      buyerTotalPrice: 1100,
      reservedForCurrentUser: true,
      reservedOffer: {
        amount: 800,
        buyerProtectionFee: { amount: 50, rate: 6.25 },
        buyerTotalPrice: 850,
      },
    });
    localStorage.setItem(
      'cart:guest',
      JSON.stringify([
        {
          listing: {
            ...savedListing,
            price: 800,
            reservedForCurrentUser: true,
            status: 'RESERVED',
          },
        },
      ]),
    );

    renderCartDrawer();

    expect(await screen.findByText('+ Buyer protection fee (6.25%): Rs 50')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Buyer protection fee').parentElement).toHaveTextContent('Rs 50');
      expect(screen.getByText('Total payable').parentElement).toHaveTextContent('Rs 850');
    });
  });
});
