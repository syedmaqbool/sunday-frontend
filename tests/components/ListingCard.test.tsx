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

describe('listing card seller coupon estimate', () => {
  it('shows the original price with the automatic seller coupon estimate', () => {
    renderListingCard({
      ...listing,
      sellerCouponEstimate: { discountAmount: 250, estimatedPrice: 2250, isEstimate: true },
    });

    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.getByTestId('seller-coupon-estimate')).toHaveTextContent('Estimated Rs 2,250 with automatic seller coupon');
    expect(screen.getByTestId('seller-coupon-estimate')).toHaveTextContent('Save Rs 250 · Applied automatically at checkout');
  });

  it('shows only the regular price when the listing has no estimate', () => {
    renderListingCard(listing);

    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
    expect(screen.queryByText(/seller coupon/i)).not.toBeInTheDocument();
  });

  it('does not promise a seller coupon on a reserved listing', () => {
    renderListingCard({
      ...listing,
      sellerCouponEstimate: { discountAmount: 250, estimatedPrice: 2250, isEstimate: true },
      status: 'RESERVED',
    });

    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-coupon-estimate')).not.toBeInTheDocument();
  });
});
