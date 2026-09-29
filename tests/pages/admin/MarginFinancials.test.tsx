import type {
  AdminMarginReportOrder,
  AdminMarginReportParams,
  AdminMarginReportResponse,
} from '@/types/adminMarginReport.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '@/AppRoutes';
import MarginFinancials, { getAdminMarginDateRange } from '@/pages/admin/MarginFinancials';

const getAdminMarginReportMock = vi.hoisted(() => vi.fn());
const canAccessFinanceMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/adminMarginReport.service', () => ({
  getAdminMarginReport: getAdminMarginReportMock,
}));

vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({ can: canAccessFinanceMock, isAdmin: false }),
}));

vi.mock('@/pages/AdminDashboard', async () => {
  const { Outlet } = await import('react-router-dom');
  return { default: () => <Outlet /> };
});

function createOrder(overrides: Partial<AdminMarginReportOrder> = {}): AdminMarginReportOrder {
  return {
    id: 'order-12345678',
    bankNames: 'HBL',
    buyerDiscount: 50,
    buyerName: 'Buyer Person',
    estimatedPayoutFee: 25,
    finalOrderAmount: 1850,
    orderValue: 2000,
    platformCommission: 300,
    platformMargin: 125,
    sellerCouponDiscount: 100,
    sellerPayout: 1900,
    sellers: [{
      sellerId: 'seller-1',
      bankName: 'HBL',
      estimatedPayout: 1900,
      estimatedPayoutFee: 25,
      grossItemValue: 2000,
      items: [{
        commissionAmount: 300,
        quantity: 2,
        title: 'Vintage jacket',
        unitPrice: 1000,
      }],
      sellerName: 'Seller One',
    }],
    sellerShare: 100,
    status: 'DELIVERED',
    createdAt: '2026-09-28T15:00:00.000Z',
    ...overrides,
  };
}

function createReport(
  overrides: Partial<AdminMarginReportResponse> = {},
): AdminMarginReportResponse {
  return {
    aggregates: {
      buyerDiscount: 2000,
      estimatedPayoutFee: 1500,
      finalOrderAmount: 120_456,
      matchingOrderCount: 100,
      negativeMarginOrderCount: 20,
      nonNegativeMarginOrderCount: 80,
      orderValue: 123_456,
      platformCommission: 15_000,
      platformMargin: 8700,
      sellerCouponDiscount: 1000,
      sellerPayout: 105_000,
      sellerShare: 800,
    },
    data: [createOrder()],
    message: 'Margin report fetched successfully.',
    pagination: {
      currentPage: 1,
      lastPage: 3,
      nextPage: 2,
      perPage: 20,
      prevPage: null,
      total: 45,
    },
    statusCode: 200,
    ...overrides,
  };
}

function renderPage({ route = false }: { route?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/admin/margins']}
      >
        {route ? <AppRoutes /> : <MarginFinancials />}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin margin report page', () => {
  beforeEach(() => {
    canAccessFinanceMock.mockReset().mockReturnValue(true);
    getAdminMarginReportMock.mockReset().mockResolvedValue(createReport());
  });

  it('converts the today preset from local midnight through the current instant', () => {
    const referenceDate = new Date(2026, 8, 29, 12, 34, 56, 789);
    const localMidnight = new Date(referenceDate);
    localMidnight.setHours(0, 0, 0, 0);

    expect(getAdminMarginDateRange('today', referenceDate)).toEqual({
      from: localMidnight.toISOString(),
      to: referenceDate.toISOString(),
    });
  });

  it.each([7, 30, 90] as const)('converts the trailing %i-day preset to UTC instants', (days) => {
    const referenceDate = new Date(2026, 8, 29, 12, 34, 56, 789);
    const startDate = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);

    expect(getAdminMarginDateRange(`${days}d`, referenceDate)).toEqual({
      from: startDate.toISOString(),
      to: referenceDate.toISOString(),
    });
  });

  it('omits bounds for the all-time preset', () => {
    expect(getAdminMarginDateRange('all', new Date(2026, 8, 29))).toEqual({});
  });

  it('explains when orders appear in the report', async () => {
    renderPage();

    expect(await screen.findByText(
      'Orders with items appear in this report only after every item is delivered, either when the buyer confirms receipt or when delivery completes automatically.',
    )).toBeInTheDocument();
  });

  it('renders API rows, pagination, and aggregates without order-status filtering', async () => {
    const report = createReport({
      aggregates: {
        ...createReport().aggregates,
        matchingOrderCount: 47,
        negativeMarginOrderCount: 19,
        nonNegativeMarginOrderCount: 28,
        orderValue: 876_543,
        platformMargin: 23_456,
      },
      data: [
        createOrder({
          id: 'awaiting-order-1',
          buyerName: 'Buyer with awaiting overall status',
          status: 'AWAITING_PAYMENT',
        }),
        createOrder({
          id: 'cancelled-order-1',
          buyerName: 'Buyer with cancelled overall status',
          platformMargin: -250,
          status: 'CANCELLED',
        }),
      ],
      pagination: {
        currentPage: 2,
        lastPage: 4,
        nextPage: 3,
        perPage: 20,
        prevPage: 1,
        total: 67,
      },
    });
    getAdminMarginReportMock.mockResolvedValue(report);
    renderPage();

    expect(await screen.findByRole('row', { name: /AWAITING PAYMENT/ })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /CANCELLED/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Summary/ })).toHaveTextContent(
      'Summary · 47 orders (28 positive, 19 negative)',
    );
    expect(screen.getByText('Rs 876,543')).toBeInTheDocument();
    expect(screen.getByText('Rs 23,456')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 4 · 67 orders')).toBeInTheDocument();
  });

  it('is reachable at /admin/margins and requests the default filters', async () => {
    renderPage({ route: true });

    expect(await screen.findByRole('heading', { name: 'Margin & Order Financials' })).toBeInTheDocument();
    expect(getAdminMarginReportMock).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.any(String),
      marginFilter: 'all',
      page: 1,
      size: 20,
      to: expect.any(String),
    }));
  });

  it('resets pagination and refreshes aggregates when search, margin, and date filters change', async () => {
    getAdminMarginReportMock.mockImplementation(async (parameters: AdminMarginReportParams) => {
      if (parameters.marginFilter === 'positive') {
        return createReport({
          aggregates: {
            ...createReport().aggregates,
            matchingOrderCount: 4,
            negativeMarginOrderCount: 0,
            nonNegativeMarginOrderCount: 4,
          },
          data: [createOrder({ platformMargin: 0 })],
        });
      }
      const currentPage = parameters.page ?? 1;
      return createReport({
        pagination: {
          ...createReport().pagination,
          currentPage,
          nextPage: currentPage < 3 ? currentPage + 1 : null,
          prevPage: currentPage > 1 ? currentPage - 1 : null,
        },
      });
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(getAdminMarginReportMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    fireEvent.change(screen.getByRole('textbox', { name: 'Search orders' }), {
      target: { value: 'Buyer Person' },
    });
    await waitFor(() => expect(getAdminMarginReportMock).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1,
      search: 'Buyer Person',
    })));

    fireEvent.click(screen.getByRole('combobox', { name: 'Margin filter' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Positive only (includes zero)' }));
    await waitFor(() => expect(getAdminMarginReportMock).toHaveBeenLastCalledWith(expect.objectContaining({
      marginFilter: 'positive',
      page: 1,
      search: 'Buyer Person',
    })));
    expect(await screen.findByRole('heading', { name: 'Summary' })).toHaveTextContent(
      'Summary · 4 orders (4 positive, 0 negative)',
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Date range' }));
    fireEvent.click(await screen.findByRole('option', { name: 'All time' }));
    await waitFor(() => {
      const lastParameters = getAdminMarginReportMock.mock.lastCall?.[0];
      expect(lastParameters).toEqual(expect.objectContaining({
        marginFilter: 'positive',
        page: 1,
        search: 'Buyer Person',
      }));
      expect(lastParameters).not.toHaveProperty('from');
      expect(lastParameters).not.toHaveProperty('to');
    });
  });

  it('expands seller and item financial details from the report', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Expand order order-12345678' }));

    const sellerDetails = await screen.findByRole('region', { name: 'Seller One seller details' });
    expect(sellerDetails).toHaveTextContent('Bank: HBL');
    expect(screen.getByText('Buyer Person').closest('p')).toHaveTextContent(
      'Buyer: Buyer Person · Seller 5% share reported: Rs 100',
    );
    expect(sellerDetails).toHaveTextContent('Estimated payout: Rs 1,900');
    expect(sellerDetails).toHaveTextContent('Estimated fee: Rs 25');
    expect(screen.getByText('Vintage jacket × 2')).toBeInTheDocument();
    expect(sellerDetails).toHaveTextContent('Gross line value: Rs 2,000');
    expect(sellerDetails).toHaveTextContent('Commission: Rs 300');
  });

  it('does not request the report without finance read access', () => {
    canAccessFinanceMock.mockReturnValue(false);
    renderPage();

    expect(screen.getByText('Finance dashboard access is required to view Margin & Financials.')).toBeInTheDocument();
    expect(getAdminMarginReportMock).not.toHaveBeenCalled();
  });

  it('shows a retry action when the report request fails', async () => {
    getAdminMarginReportMock.mockRejectedValueOnce(new Error('Request failed'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the margin report.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the loading state while the report request is pending', async () => {
    let resolveReport!: (value: AdminMarginReportResponse) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    const pendingReport = new Promise<AdminMarginReportResponse>((resolve) => {
      resolveReport = resolve;
    });
    getAdminMarginReportMock.mockReturnValue(pendingReport);
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading orders…');

    resolveReport(createReport());
    expect(await screen.findByText('Rs 125')).toBeInTheDocument();
  });

  it('shows an empty state when the API returns no matching orders', async () => {
    const emptyAggregates = {
      ...createReport().aggregates,
      matchingOrderCount: 0,
      negativeMarginOrderCount: 0,
      nonNegativeMarginOrderCount: 0,
    };
    getAdminMarginReportMock.mockResolvedValue(createReport({
      aggregates: emptyAggregates,
      data: [],
      pagination: {
        currentPage: 1,
        lastPage: 0,
        nextPage: null,
        perPage: 20,
        prevPage: null,
        total: 0,
      },
    }));
    renderPage();

    expect(await screen.findByText('No orders match the current filters.')).toBeInTheDocument();
    expect(canAccessFinanceMock).toHaveBeenCalledWith('FINANCE_DASHBOARD_READ');
    expect(getAdminMarginReportMock).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: /Summary/ })).toHaveTextContent(
      'Summary · 0 orders (0 positive, 0 negative)',
    );
  });
});
