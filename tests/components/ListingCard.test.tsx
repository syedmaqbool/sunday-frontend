import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vite-plus/test';
import ListingCard from '@/components/ListingCard';
import type { MarketplaceListing } from '@/queries/marketplace.query';

const listing = {
  id: 'listing-1',
  brand: 'Vintage',
  condition: 'USED_GOOD',
  images: [],
  price: 2500,
  size: 'M',
  status: 'APPROVED',
  title: 'Vintage Jacket',
  buyerProtectionFee: { amount: 250, rate: 10 },
  buyerTotalPrice: 2750,
} as MarketplaceListing;

function renderListingCard(cardListing: Parameters<typeof ListingCard>[0]['listing']) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ListingCard listing={cardListing} />
    </MemoryRouter>,
  );
}

describe('listing card pricing', () => {
  it('shows the buyer total with a Buyer Protection note', () => {
    renderListingCard({
      ...listing,
    });

    expect(screen.getByText('Rs 2,750')).toBeInTheDocument();
    expect(screen.getByText('incl. Buyer Protection')).toBeInTheDocument();
  });

  it('shows the item price as the buyer total when the fee is zero', () => {
    renderListingCard({
      ...listing,
      buyerProtectionFee: { amount: 0, rate: 0 },
      buyerTotalPrice: 2500,
    });

    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.getByText('incl. Buyer Protection')).toBeInTheDocument();
  });

  it('shows the buyer total on a reserved listing', () => {
    renderListingCard({
      ...listing,
      status: 'RESERVED',
    });

    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Rs 2,750')).toBeInTheDocument();
  });
});
