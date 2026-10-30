import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Analytics from '@/pages/admin/Analytics';

const getAdminAnalyticsMock = vi.hoisted(() => vi.fn());
const listAdminMarketingLeadsMock = vi.hoisted(() => vi.fn());
const exportAdminMarketingLeadsMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
let createObjectURLMock: ReturnType<typeof vi.fn>;
let anchorClickMock: ReturnType<typeof vi.fn>;

vi.mock('@/services/adminAnalytics.service', () => ({
  exportAdminMarketingLeads: exportAdminMarketingLeadsMock,
  getAdminAnalytics: getAdminAnalyticsMock,
  listAdminMarketingLeads: listAdminMarketingLeadsMock,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const analyticsResponse = {
  data: {
    averageOffersBeforePurchase: {
      buyerAgeBucket: [],
      category: [],
      listingSize: [],
      location: [],
      priceRange: [],
    },
    breakdowns: {
      buyerAgeBucket: [],
      category: [],
      listingSize: [],
      location: [],
      priceRange: [],
    },
    funnels: {
      buyerAgeBucket: [],
      category: [],
      listingSize: [],
      location: [],
      priceRange: [],
    },
    kpis: {
      approvedListings: 0,
      averageOfferToOrderConversionRate: 0,
      currency: 'PKR',
      flaggedMessages: 0,
      itemsSold: 0,
      orderCount: 0,
      pendingListings: 0,
      refundRate: 0,
      totalListings: 0,
      totalRevenue: 0,
      totalUsers: 0,
    },
    priceVariance: {
      buyerAgeBucket: [],
      category: [],
      listingSize: [],
      location: [],
      priceRange: [],
    },
  },
};

const leadsResponse = {
  data: [
    {
      userId: 'lead-id',
      leadStatus: 'NEW',
      location: 'Lahore',
      name: 'Ali Khan',
      offerCount: 2,
      orderCount: 1,
      phone: '03001234567',
    },
  ],
  pagination: { page: 1, size: 50, total: 1, totalPages: 1 },
};

function renderAnalytics() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Analytics />
    </QueryClientProvider>,
  );
}

describe('admin analytics marketing-leads export', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    getAdminAnalyticsMock.mockReset().mockResolvedValue(analyticsResponse);
    listAdminMarketingLeadsMock.mockReset().mockResolvedValue(leadsResponse);
    exportAdminMarketingLeadsMock.mockReset();
    toastErrorMock.mockReset();
    createObjectURLMock = vi.fn().mockReturnValue('blob:marketing-leads');
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: createObjectURLMock,
      },
      revokeObjectURL: {
        configurable: true,
        value: vi.fn(),
      },
    });
    anchorClickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('downloads the successful backend CSV using active filters and its filename', async () => {
    exportAdminMarketingLeadsMock.mockResolvedValue(
      new Response('email,name\nali@example.com,Ali', {
        headers: {
          'content-disposition': 'attachment; filename="marketing-leads-export.csv"',
        },
      }),
    );
    renderAnalytics();

    await screen.findByText('Ali Khan');
    fireEvent.change(screen.getByPlaceholderText('Filter leads…'), {
      target: { value: 'ali' },
    });
    const createElementMock = vi.spyOn(document, 'createElement');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() =>
      expect(exportAdminMarketingLeadsMock).toHaveBeenCalledWith({ search: 'ali' }),
    );

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    const createdLinks = createElementMock.mock.results
      .map(result => result.value)
      .filter((value): value is HTMLAnchorElement => value instanceof HTMLAnchorElement);
    expect(createdLinks.at(-1)?.download).toBe('marketing-leads-export.csv');
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('shows a loading state, disables the button, and ignores duplicate clicks', async () => {
    let resolveExport!: (response: Response) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    const exportPromise = new Promise<Response>(resolve => {
      resolveExport = resolve;
    });
    exportAdminMarketingLeadsMock.mockReturnValue(exportPromise);
    renderAnalytics();

    const button = await screen.findByRole('button', { name: 'Download' });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);

    expect(screen.getAllByRole('button', { name: /downloading/i })).toHaveLength(2);
    expect(
      screen
        .getAllByRole('button', { name: /downloading/i })
        .every(control => control.hasAttribute('disabled')),
    ).toBe(true);
    expect(exportAdminMarketingLeadsMock).toHaveBeenCalledTimes(1);

    resolveExport(new Response('email,name\n'));
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('falls back to the default filename when the response has no filename header', async () => {
    exportAdminMarketingLeadsMock.mockResolvedValue(new Response('email,name\n'));
    renderAnalytics();

    const createElementMock = vi.spyOn(document, 'createElement');
    fireEvent.click(await screen.findByRole('button', { name: 'Download' }));

    await waitFor(() => expect(anchorClickMock).toHaveBeenCalledTimes(1));
    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    const createdLinks = createElementMock.mock.results
      .map(result => result.value)
      .filter((value): value is HTMLAnchorElement => value instanceof HTMLAnchorElement);
    expect(createdLinks.at(-1)?.download).toBe('marketing-leads.csv');
  });

  it('shows an error and does not create a file when export fails', async () => {
    exportAdminMarketingLeadsMock.mockRejectedValue(new Error('Export failed'));
    renderAnalytics();

    const button = await screen.findByRole('button', { name: 'Download' });
    fireEvent.click(button);

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith('Error', {
        description: 'Export failed',
      }),
    );

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(anchorClickMock).not.toHaveBeenCalled();
    expect(button).not.toBeDisabled();
  });

  it('passes the selected date range to analytics and marketing leads queries', async () => {
    exportAdminMarketingLeadsMock.mockResolvedValue(new Response('email,name\n'));
    renderAnalytics();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Last 7 days' }), { button: 0 });

    await waitFor(() => {
      expect(getAdminAnalyticsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endTime: expect.any(String),
          startTime: expect.any(String),
        }),
      );
      expect(listAdminMarketingLeadsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endTime: expect.any(String),
          startTime: expect.any(String),
        }),
      );
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(exportAdminMarketingLeadsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          endTime: expect.any(String),
          startTime: expect.any(String),
        }),
      );
    });
  });
});
