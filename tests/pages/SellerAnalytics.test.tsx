import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SellerAnalytics from '@/pages/SellerAnalytics';

const getSellerAnalyticsMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/selleranalytic.service', () => ({
  getSellerAnalytics: getSellerAnalyticsMock,
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const sellerAnalyticsResponse = {
  data: {
    acceptedOffers: 0,
    activeListings: 0,
    averageRating: 0,
    conversionRate: 0,
    currency: 'PKR',
    listingCategoryDistribution: [],
    monthlyAcceptedOfferValue: [],
    offerStatusCounts: [],
    pendingOffers: 0,
    rejectedOffers: 0,
    reviewCount: 0,
    totalAcceptedOfferValue: 0,
    totalOffers: 0,
  },
};

function renderSellerAnalytics() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SellerAnalytics />
    </QueryClientProvider>,
  );
}

describe('seller analytics period filter', () => {
  beforeEach(() => {
    getSellerAnalyticsMock.mockReset().mockResolvedValue(sellerAnalyticsResponse);
  });

  it('passes the selected month range to the seller analytics request', async () => {
    renderSellerAnalytics();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'This month' }), { button: 0 });

    await waitFor(() => {
      expect(getSellerAnalyticsMock).toHaveBeenLastCalledWith(expect.objectContaining({
        endTime: expect.any(String),
        startTime: expect.any(String),
      }));
    });
  });
});
