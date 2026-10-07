import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlaggedBuyers from '@/pages/admin/FlaggedBuyers';
import { adminFlaggedBuyersQueryKey } from '@/queries/adminFlaggedBuyers.query';
import { notificationsQueryKey } from '@/queries/notification.query';

const getRulesMock = vi.hoisted(() => vi.fn());
const getBuyersMock = vi.hoisted(() => vi.fn());
const getHistoryMock = vi.hoisted(() => vi.fn());
const updateRulesMock = vi.hoisted(() => vi.fn());
const warnBuyerMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const showErrorToastMock = vi.hoisted(() => vi.fn());
const accessMock = vi.hoisted(() => vi.fn((_permission: string | string[]) => true));

vi.mock('@/services/adminFlaggedBuyers.service', () => ({
  getAdminFlaggedBuyerComplaintHistory: getHistoryMock,
  getAdminFlaggedBuyerRules: getRulesMock,
  getAdminFlaggedBuyers: getBuyersMock,
  updateAdminFlaggedBuyerRules: updateRulesMock,
  warnAdminFlaggedBuyer: warnBuyerMock,
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

function historyResponse(page = 1, lastPage = 1) {
  return {
    data: page === 1
      ? [{
          id: 'complaint-1',
          reason: 'Item arrived damaged',
          status: 'REFUNDED' as const,
          createdAt: '2026-09-20T12:00:00.000Z',
        }]
      : [{
          id: 'complaint-2',
          reason: 'Item was not as described',
          status: 'RETURN_RECEIVED' as const,
          createdAt: '2026-09-12T12:00:00.000Z',
        }],
    message: 'Success',
    pagination: {
      currentPage: page,
      lastPage,
      nextPage: page < lastPage ? page + 1 : null,
      perPage: 20,
      prevPage: page > 1 ? page - 1 : null,
      total: lastPage > 1 ? 2 : 1,
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
    getHistoryMock.mockReset().mockResolvedValue(historyResponse());
    updateRulesMock.mockReset().mockResolvedValue(ruleResponse(4, 120));
    warnBuyerMock.mockReset().mockResolvedValue({ message: 'Buyer warning sent successfully.', statusCode: 200 });
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

  it('opens and closes the selected buyer history dialog with backend fields', async () => {
    renderPage();
    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(await screen.findByRole('heading', { name: 'Complaint history' })).toBeInTheDocument();
    expect(screen.getByText('Qualifying complaints for Alex Buyer.')).toBeInTheDocument();
    expect(await screen.findByText('20 Sep 2026')).toBeInTheDocument();
    expect(screen.getByText('REFUNDED')).toBeInTheDocument();
    expect(screen.getByText('Item arrived damaged')).toBeInTheDocument();
    expect(getHistoryMock).toHaveBeenCalledWith('buyer-1', { page: 1, size: 20 });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Complaint history' })).not.toBeInTheDocument());
  });

  it('sends the default warning with an empty JSON object and resets after success', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPage(queryClient);
    expect(await screen.findByText('Alex Buyer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Warn' }));

    expect(await screen.findByRole('heading', { name: 'Warn buyer' })).toBeInTheDocument();
    expect(screen.getByText(/Send a warning to Alex Buyer about their refund activity/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Custom message (optional)' })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Send warning' }));

    await waitFor(() => expect(warnBuyerMock).toHaveBeenCalledWith('buyer-1', {}));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Warn buyer' })).not.toBeInTheDocument());
    expect(toastSuccessMock).toHaveBeenCalledWith('Buyer warning sent');
    expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: notificationsQueryKey.all() });
    fireEvent.click(screen.getByRole('button', { name: 'Warn' }));
    expect(await screen.findByRole('textbox', { name: 'Custom message (optional)' })).toHaveValue('');
  });

  it('trims and sends a custom warning message', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Warn' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom message (optional)' }), { target: { value: '  Please contact support.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send warning' }));

    await waitFor(() => expect(warnBuyerMock).toHaveBeenCalledWith('buyer-1', { message: 'Please contact support.' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Warn buyer' })).not.toBeInTheDocument());
  });

  it('disables warning submission while pending', async () => {
    warnBuyerMock.mockImplementationOnce(() => new Promise(() => {}));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Warn' }));
    const submitButton = screen.getByRole('button', { name: 'Send warning' });
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
  });

  it('keeps the dialog open and shows an error when warning submission fails', async () => {
    warnBuyerMock.mockRejectedValueOnce(new Error('send failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Warn' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send warning' }));

    await waitFor(() => expect(showErrorToastMock).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Warn buyer' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Custom message (optional)' })).toHaveValue('');
  });

  it('pages through complaint history using the API pagination', async () => {
    getHistoryMock.mockImplementation((_buyerId: string, { page }: { page: number }) => Promise.resolve(historyResponse(page, 2)));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));
    expect(await screen.findByText('Item arrived damaged')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next history page' }));

    expect(await screen.findByText('Item was not as described')).toBeInTheDocument();
    expect(getHistoryMock).toHaveBeenLastCalledWith('buyer-1', { page: 2, size: 20 });
    expect(screen.getByRole('button', { name: 'Previous history page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next history page' })).toBeDisabled();
  });

  it('shows loading, empty, and error states in the complaint history dialog', async () => {
    getHistoryMock.mockImplementationOnce(() => new Promise(() => {}));
    const loadingPage = renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));
    expect(screen.getByLabelText('Loading complaint history')).toBeInTheDocument();
    loadingPage.unmount();

    getHistoryMock.mockReset().mockResolvedValue({ ...historyResponse(), data: [], pagination: { ...historyResponse().pagination, lastPage: 0, total: 0 } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));
    expect(await screen.findByText('No qualifying complaint history.')).toBeInTheDocument();

    getHistoryMock.mockReset().mockRejectedValueOnce(new Error('load failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'History' }));
    expect(await screen.findByText('Unable to load complaint history.')).toBeInTheDocument();
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
