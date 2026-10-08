import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  CheckoutDispatchNotice,
  ListingDetailsNotice,
  SellerShipmentNotice,
  SoldListingNotice,
} from '@/components/MarketplaceNotices';

describe('marketplace notices', () => {
  it('shows the shipping notice in the sold-listing panel', () => {
    render(<SoldListingNotice />);

    expect(screen.getByText('Sunday bears no responsibility over the shipping method, please ask for shipment proof.')).toBeInTheDocument();
  });

  it('shows the product notice with listing details', () => {
    render(<ListingDetailsNotice />);

    expect(screen.getByText('Sunday bears no responsibility over the product. Please check all details before buying, and ask any questions when you make an offer.')).toBeInTheDocument();
  });

  it('shows the shipment reminder in the seller dialog', () => {
    render(<SellerShipmentNotice />);

    expect(screen.getByText('Please add full details for shipment to ensure no refund disputes.')).toBeInTheDocument();
  });

  it('links the dispatch notice to the terms page', () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <CheckoutDispatchNotice />
      </MemoryRouter>,
    );

    expect(screen.getByText('Item will be dispatched within 3 working days after payment is verified by admin.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'More info' })).toHaveAttribute('href', '/terms');
  });
});
