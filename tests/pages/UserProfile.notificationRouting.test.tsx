import type { Complaint } from '@/types/complaint.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ReturnsTab } from '@/pages/UserProfile';

const complaints: Complaint[] = [
  {
    id: 'buyer-complaint',
    listingTitle: 'Buyer return listing',
    reason: 'Not as described',
    status: 'RAISED',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as Complaint,
  {
    id: 'seller-complaint',
    listingTitle: 'Seller return listing',
    reason: 'Damaged item',
    status: 'RETURN_IN_TRANSIT',
    createdAt: '2026-01-02T00:00:00.000Z',
  } as Complaint,
];

vi.mock('@/services/complaints.service', () => ({
  listComplaintsAgainstMe: async () => ({ data: [complaints[1]] }),
  listMyRefundComplaints: async () => ({ data: [complaints[0]] }),
}));

function LocationControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  );
}

function renderReturns(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationControls />
        <ReturnsTab />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('profile complaint notification navigation', () => {
  it('restores the selected complaint section and complaint from the URL and browser history', async () => {
    renderReturns([
      '/profile?tab=returns&returnsTab=my-returns&complaint=buyer-complaint',
      '/profile?tab=returns&returnsTab=returned-to-me&complaint=seller-complaint',
    ]);

    expect(await screen.findByText('Seller return listing')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Returned to Me/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('[data-selected="true"]')).toHaveTextContent('Seller return listing');

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('returnsTab=my-returns&complaint=buyer-complaint'));
    expect(screen.getByRole('tab', { name: /My Returns/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('[data-selected="true"]')).toHaveTextContent('Buyer return listing');
  });

  it('falls back to the selected returns list when the complaint is unavailable', async () => {
    renderReturns(['/profile?tab=returns&returnsTab=my-returns&complaint=missing-complaint']);

    expect(await screen.findByText('Buyer return listing')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('complaint='));
  });
});
