import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ListingCard from '@/components/ListingCard';

const listing = {
  id: 'listing-1',
  brand: 'Vintage',
  condition: 'USED_GOOD',
  images: [],
  price: 2500,
  size: 'M',
  status: 'APPROVED',
  title: 'Vintage Jacket',
};

function renderListingCard(cardListing: Parameters<typeof ListingCard>[0]['listing']) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ListingCard listing={cardListing} />
    </MemoryRouter>,
  );
}

describe('listing card pricing', () => {
  it('shows the listing price without seller incentive savings', () => {
    renderListingCard({
      ...listing,
    });

    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.queryByText(/seller coupon|save rs/i)).not.toBeInTheDocument();
  });

  it('shows only the regular price when the listing has no estimate', () => {
    renderListingCard(listing);

    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.queryByText(/seller coupon|save rs/i)).not.toBeInTheDocument();
  });

  it('does not promise a seller coupon on a reserved listing', () => {
    renderListingCard({
      ...listing,
      status: 'RESERVED',
    });

    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
  });
});
