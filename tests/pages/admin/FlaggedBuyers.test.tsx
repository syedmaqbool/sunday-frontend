import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlaggedBuyers from '@/pages/admin/FlaggedBuyers';
import { adminFlaggedBuyersQueryKey } from '@/queries/adminFlaggedBuyers.query';

const getRulesMock = vi.hoisted(() => vi.fn());
const getBuyersMock = vi.hoisted(() => vi.fn());
const updateRulesMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const showErrorToastMock = vi.hoisted(() => vi.fn());
const accessMock = vi.hoisted(() => vi.fn((_permission: string | string[]) => true));

vi.mock('@/services/adminFlaggedBuyers.service', () => ({
  getAdminFlaggedBuyerRules: getRulesMock,
  getAdminFlaggedBuyers: getBuyersMock,
  updateAdminFlaggedBuyerRules: updateRulesMock,
}));

vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({ can: accessMock }),
}));

vi.mock('@/lib/errorToast', () => ({
  showErrorToast: showErrorToastMock,
}));

vi.mock('sonner', () => ({
  toast: { success: toastSuccessMock },
}));

function ruleResponse(threshold = 3, windowDays = 90) {
  return {
    data: { threshold, windowDays },
    message: 'Success',
    statusCode: 200,
  };
}

function buyersResponse(page = 1, lastPage = 1) {
  return {
    aggregates: { countedComplaintRowCount: 8, qualifyingBuyerCount: 3 },
    data: page === 1
      ? [{
          buyerId: 'buyer-1',
          displayName: 'Alex Buyer',
          qualifyingComplaintCount: 4,
          latestQualifyingComplaintCreatedAt: '2026-09-24T12:00:00.000Z',
        }]
      : [{
          buyerId: 'buyer-2',
          displayName: 'Blair Buyer',
          qualifyingComplaintCount: 3,
          latestQualifyingComplaintCreatedAt: '2026-09-20T12:00:00.000Z',
        }],
    message: 'Success',
    pagination: {
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
      perPage: 20,
      prevPage: page > 1 ? page - 1 : null,
      total: 3,
    },
    statusCode: 200,
  };
}

function renderPage(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FlaggedBuyers />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe('admin flagged buyer rules', () => {
  beforeEach(() => {
    getRulesMock.mockReset().mockResolvedValue(ruleResponse());
    getBuyersMock.mockReset().mockResolvedValue(buyersResponse());
    updateRulesMock.mockReset().mockResolvedValue(ruleResponse(4, 120));
    toastSuccessMock.mockReset();
    showErrorToastMock.mockReset();
    accessMock.mockReset().mockReturnValue(true);
  });

  it('loads and displays the backend default rule', async () => {
    renderPage();

    expect(await screen.findByLabelText('Complaint threshold')).toHaveValue('3');
    expect(screen.getByLabelText('Lookback window (days)')).toHaveValue('90');
  });

  it('displays the backend aggregates and buyer row values without changing API order', async () => {
    renderPage();

    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    expect(screen.getByText('8', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('3', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('4', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByText('24 Sep 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/seller/buyer-1');
    expect(getBuyersMock).toHaveBeenCalledWith({ page: 1, size: 20 });
  });

  it('uses the response pagination to load every buyer page', async () => {
    getBuyersMock.mockImplementation(({ page }: { page: number }) => Promise.resolve(buyersResponse(page, 2)));
    renderPage();

    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Blair Buyer')).toBeInTheDocument();
    expect(getBuyersMock).toHaveBeenLastCalledWith({ page: 2, size: 20 });
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('returns to the first buyer page after saving a changed rule', async () => {
    getBuyersMock.mockImplementation(({ page }: { page: number }) => Promise.resolve(buyersResponse(page, 2)));
    renderPage();
    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Blair Buyer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => expect(getBuyersMock).toHaveBeenLastCalledWith({ page: 1, size: 20 }));
    expect(screen.getByText('Alex Buyer')).toBeInTheDocument();
  });

  it('returns to the last available page if the result set shrinks while browsing', async () => {
    getBuyersMock.mockImplementation(({ page }: { page: number }) => Promise.resolve(
      page === 1
        ? buyersResponse(1, 2)
        : {
            ...buyersResponse(2, 1),
            data: [],
            pagination: {
              ...buyersResponse(2, 1).pagination,
              lastPage: 1,
              total: 1,
            },
          },
    ));
    renderPage();
    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(getBuyersMock).toHaveBeenLastCalledWith({ page: 1, size: 20 }));
    expect(screen.getByText('Alex Buyer')).toBeInTheDocument();
  });

  it('shows loading, empty, and API error states for the buyer list', async () => {
    getBuyersMock.mockImplementationOnce(() => new Promise(() => {}));
    const loadingPage = renderPage();
    expect(screen.getByLabelText('Loading flagged buyers')).toBeInTheDocument();
    loadingPage.unmount();

    getBuyersMock.mockReset().mockResolvedValueOnce({
      ...buyersResponse(),
      aggregates: { countedComplaintRowCount: 0, qualifyingBuyerCount: 0 },
      data: [],
      pagination: { ...buyersResponse().pagination, lastPage: 0, total: 0 },
    });
    renderPage();
    expect(await screen.findByText('No buyers meet the current rule.')).toBeInTheDocument();

    getBuyersMock.mockReset().mockRejectedValueOnce(new Error('load failed'));
    renderPage();
    expect(await screen.findByText('Unable to load flagged buyers.')).toBeInTheDocument();
  });

  it('saves edited values and invalidates flagged buyer queries', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPage(queryClient);
    fireEvent.change(await screen.findByLabelText('Complaint threshold'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Lookback window (days)'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => expect(updateRulesMock).toHaveBeenCalledWith({ threshold: 4, windowDays: 120 }));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith('Flagged buyer rule saved'));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminFlaggedBuyersQueryKey.all() });
  });

  it.each(['0', '-1', '1.5'])('rejects invalid threshold %s before submission', async (value) => {
    renderPage();
    fireEvent.change(await screen.findByLabelText('Complaint threshold'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => expect(screen.getByText('Threshold must be a positive whole number.')).toBeInTheDocument(), { timeout: 10_000 });
    expect(updateRulesMock).not.toHaveBeenCalled();
  });

  it.each(['0', '-1', '1.5'])('rejects invalid lookback window %s before submission', async (value) => {
    renderPage();
    fireEvent.change(await screen.findByLabelText('Lookback window (days)'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => expect(screen.getByText('Lookback window must be a positive whole number.')).toBeInTheDocument(), { timeout: 10_000 });
    expect(updateRulesMock).not.toHaveBeenCalled();
  });

  it('does not allow users without update permission to submit changes', async () => {
    accessMock.mockImplementation(permission => !Array.isArray(permission));
    renderPage();

    expect(await screen.findByLabelText('Complaint threshold')).toBeDisabled();
    expect(screen.getByLabelText('Lookback window (days)')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save rule' })).not.toBeInTheDocument();
  });

  it('shows API errors when loading or saving rules fails', async () => {
    getRulesMock.mockRejectedValueOnce(new Error('load failed'));
    renderPage();
    expect(await screen.findByText('Unable to load the flagged buyer rule.')).toBeInTheDocument();

    getRulesMock.mockReset().mockResolvedValue(ruleResponse());
    updateRulesMock.mockRejectedValueOnce(new Error('save failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Save rule' }));
    await waitFor(() => expect(showErrorToastMock).toHaveBeenCalled());
  });
});
