import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyOffers from '@/pages/MyOffers';

const { authState, useQueryMock } = vi.hoisted(() => ({
  authState: { loading: false, user: { id: 'user-1' } as { id: string } | null },
  useQueryMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return { ...actual, useQuery: useQueryMock };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/ReviewForm', () => ({ ReviewForm: () => null }));

const selectedOffer = {
  id: 'offer-1',
  buyerId: 'user-1',
  conversationId: null,
  listingId: 'listing-1',
  sellerId: 'seller-1',
  amount: 100,
  buyerFullName: 'Buyer',
  counterAmount: null,
  coverImage: null,
  listingPrice: 150,
  listingStatus: 'APPROVED',
  listingTitle: 'Test listing',
  message: null,
  reservedUntil: null,
  sellerFullName: 'Seller',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

function renderPage(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const getPage = () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            element={(
              <>
                <MyOffers />
                <LocationControls />
              </>
            )}
            path="/my-offers"
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const renderedPage = render(getPage());
  return {
    ...renderedPage,
    rerenderPage: () => renderedPage.rerender(getPage()),
  };
}

afterEach(() => {
  authState.loading = false;
  authState.user = { id: 'user-1' };
});

describe('myOffers notification selection', () => {
  it('selects the offer from the URL and restores list state through browser history', async () => {
    useQueryMock.mockImplementation((options: any) => ({
      data: options.queryKey.includes('mine')
        ? { data: [selectedOffer] }
        : { data: [] },
      isLoading: false,
    }) as any);

    renderPage(['/my-offers', '/my-offers?offer=offer-1']);

    expect(await screen.findByTestId('selected-offer')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/my-offers?offer=offer-1');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-offers'));
    expect(screen.queryByTestId('selected-offer')).not.toBeInTheDocument();
  });

  it('falls back to the sent offers list when the selected offer no longer exists', async () => {
    useQueryMock.mockImplementation((options: any) => ({
      data: options.queryKey.includes('mine') ? { data: [] } : { data: [] },
      isLoading: false,
    }) as any);

    renderPage(['/my-offers?offer=missing-offer']);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-offers'));
    expect(screen.queryByTestId('selected-offer')).not.toBeInTheDocument();
    expect(await screen.findByText('You haven\'t made any offers yet')).toBeInTheDocument();
  });

  it('preserves the selected offer URL while authentication is restored', async () => {
    authState.loading = true;
    authState.user = null;
    useQueryMock.mockImplementation((options: any) => ({
      data: options.queryKey.includes('selection') && authState.user
        ? { data: [selectedOffer] }
        : { data: [] },
      isLoading: false,
    }) as any);

    const { rerenderPage } = renderPage(['/my-offers?offer=offer-1']);
    expect(screen.getByTestId('location')).toHaveTextContent('/my-offers?offer=offer-1');

    authState.loading = false;
    authState.user = { id: 'user-1' };
    rerenderPage();

    expect(await screen.findByTestId('selected-offer')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/my-offers?offer=offer-1');
  });
});
