import type { EligibleSellerPayoutItemsResponse } from '@/types/payout.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Payouts from '@/pages/admin/Payouts';

const payoutService = vi.hoisted(() => ({
  createPayoutRun: vi.fn(),
  createSellerPayout: vi.fn(),
  listEligibleSellerPayoutItems: vi.fn(),
  listPayoutRunItems: vi.fn(),
  listPayoutRuns: vi.fn(),
  listRefundPayouts: vi.fn(),
  listSellerPayouts: vi.fn(),
  updatePayoutRunItemStatus: vi.fn(),
}));

vi.mock('@/services/payout.service', () => payoutService);

const emptyPage = {
  data: [],
  message: 'Loaded.',
  pagination: {
    currentPage: 1,
    lastPage: 0,
    nextPage: null,
    perPage: 100,
    prevPage: null,
    total: 0,
  },
  statusCode: 200,
};

function createEligibleResponse(
  overrides: Partial<EligibleSellerPayoutItemsResponse> = {},
): EligibleSellerPayoutItemsResponse {
  return {
    ...emptyPage,
    aggregates: { totalAmount: 0 },
    ...overrides,
  } as EligibleSellerPayoutItemsResponse;
}

const eligibleResponse = createEligibleResponse({
  aggregates: { totalAmount: 2450 },
  data: [{
    orderId: 'order-12345678',
    orderItemId: 'order-item-1',
    sellerId: 'seller-1',
    amount: 2450,
    sellerFullName: 'Seller One',
    title: 'Vintage jacket',
    receivedAt: '2026-09-18T10:30:00.000Z',
  }],
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 1 },
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Payouts />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function selectPeriod(expectedContent: RegExp | string = 'Vintage jacket') {
  fireEvent.change(await screen.findByLabelText('Period start'), {
    target: { value: '2026-09-01' },
  });
  fireEvent.change(await screen.findByLabelText('Period end'), {
    target: { value: '2026-09-30' },
  });
  expect(await screen.findByText(expectedContent)).toBeInTheDocument();
}

describe('admin payout eligibility page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    payoutService.listPayoutRuns.mockResolvedValue(emptyPage);
    payoutService.listRefundPayouts.mockResolvedValue(emptyPage);
    payoutService.listSellerPayouts.mockResolvedValue(emptyPage);
    payoutService.listPayoutRunItems.mockResolvedValue(emptyPage);
    payoutService.listEligibleSellerPayoutItems.mockResolvedValue(eligibleResponse);
    payoutService.createPayoutRun.mockResolvedValue({
      data: { id: 'run-1' },
      message: 'Created.',
      statusCode: 201,
    });
  });

  it('waits for a selected period and sends full calendar-day boundaries', async () => {
    renderPage();

    expect(await screen.findByText('Select a period to load payout-eligible items.')).toBeInTheDocument();
    expect(payoutService.listEligibleSellerPayoutItems).not.toHaveBeenCalled();

    await selectPeriod();

    const start = new Date('2026-09-01T00:00:00').toISOString();
    const end = new Date('2026-09-30T23:59:59.999').toISOString();
    expect(payoutService.listEligibleSellerPayoutItems).toHaveBeenCalledWith({
      page: 1,
      periodEnd: end,
      periodStart: start,
      size: 100,
    });
  });

  it('renders backend candidate fields and the backend eligible total', async () => {
    renderPage();
    await selectPeriod();

    expect(screen.getByText('Seller One')).toBeInTheDocument();
    expect(screen.getByText('Order order-12')).toBeInTheDocument();
    expect(screen.getByText('Sep 18, 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Rs 2,450.00')).toHaveLength(2);
    expect(screen.getByText('Eligible items:').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Eligible total:').parentElement).toHaveTextContent('Rs 2,450.00');
    expect(screen.queryByText(/commission on the listing price/i)).not.toBeInTheDocument();
  });

  it('generates a run for the selected period and refreshes candidates and run history', async () => {
    renderPage();
    await selectPeriod();

    fireEvent.click(screen.getByRole('button', { name: 'Generate payout run' }));

    const periodStart = new Date('2026-09-01T00:00:00').toISOString();
    const periodEnd = new Date('2026-09-30T23:59:59.999').toISOString();
    await waitFor(() => expect(payoutService.createPayoutRun).toHaveBeenCalledWith({
      periodEnd,
      periodStart,
    }));
    await waitFor(() => expect(payoutService.listEligibleSellerPayoutItems.mock.calls.length).toBeGreaterThan(1));
    await waitFor(() => expect(payoutService.listPayoutRuns.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows a loading state while the payout run is being generated', async () => {
    let resolveRun!: (response: { data: { id: string }; message: string; statusCode: number }) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    const pendingRun = new Promise((resolve) => {
      resolveRun = resolve;
    });
    payoutService.createPayoutRun.mockReturnValue(pendingRun);
    renderPage();
    await selectPeriod();

    fireEvent.click(screen.getByRole('button', { name: 'Generate payout run' }));
    expect(await screen.findByRole('button', { name: 'Generating run…' })).toBeDisabled();

    resolveRun({ data: { id: 'run-1' }, message: 'Created.', statusCode: 201 });
    await screen.findByRole('button', { name: 'Generate payout run' });
  });

  it('explains why no items are eligible', async () => {
    payoutService.listEligibleSellerPayoutItems.mockResolvedValue(createEligibleResponse());
    renderPage();
    await selectPeriod(/No items are eligible for this period/);

    expect(screen.getByText(/buyer receipt confirmation and a posted local accounting snapshot are required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate payout run' })).toBeDisabled();
  });

  it('keeps loading and API errors visible', async () => {
    payoutService.listEligibleSellerPayoutItems.mockRejectedValue(new Error('Eligibility unavailable'));
    renderPage();
    fireEvent.change(await screen.findByLabelText('Period start'), {
      target: { value: '2026-09-01' },
    });
    fireEvent.change(await screen.findByLabelText('Period end'), {
      target: { value: '2026-09-30' },
    });

    expect(await screen.findByText(/could not load eligible payout items/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows a payout-run creation error', async () => {
    payoutService.createPayoutRun.mockRejectedValue(new Error('Run creation failed'));
    renderPage();
    await selectPeriod();
    fireEvent.click(screen.getByRole('button', { name: 'Generate payout run' }));

    expect(await screen.findByText('Run creation failed')).toBeInTheDocument();
  });

  it('keeps historical manual payout records and refund reporting available without manual creation', async () => {
    payoutService.listSellerPayouts.mockResolvedValue({
      ...emptyPage,
      data: [{
        id: 'payout-1',
        sellerId: 'seller-history',
        amount: 1250,
        method: 'bank_transfer',
        periodEnd: '2026-08-10',
        periodStart: '2026-08-01',
        reference: 'REF-1',
        sellerFullName: 'Historical Seller',
        paidAt: '2026-08-12T09:00:00.000Z',
      }],
    });
    renderPage();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Payout history' })).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(payoutService.listSellerPayouts).toHaveBeenCalled());
    expect(await screen.findByText('Historical Seller')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record payout' })).not.toBeInTheDocument();
    expect(payoutService.createSellerPayout).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Buyer refunds' }), { button: 0 });
    expect(await screen.findByText('No buyer refunds.')).toBeInTheDocument();
  });
});
