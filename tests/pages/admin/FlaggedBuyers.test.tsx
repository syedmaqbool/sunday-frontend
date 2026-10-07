import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlaggedBuyers from '@/pages/admin/FlaggedBuyers';
import { adminFlaggedBuyersQueryKey } from '@/queries/adminFlaggedBuyers.query';

const getRulesMock = vi.hoisted(() => vi.fn());
const updateRulesMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const showErrorToastMock = vi.hoisted(() => vi.fn());
const accessMock = vi.hoisted(() => vi.fn((_permission: string | string[]) => true));

vi.mock('@/services/adminFlaggedBuyers.service', () => ({
  getAdminFlaggedBuyerRules: getRulesMock,
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

function renderPage(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <FlaggedBuyers />
      </QueryClientProvider>,
    ),
  };
}

describe('admin flagged buyer rules', () => {
  beforeEach(() => {
    getRulesMock.mockReset().mockResolvedValue(ruleResponse());
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
