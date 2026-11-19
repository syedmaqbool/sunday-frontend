import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import PayFastChargeReviews from '@/pages/admin/PayFastChargeReviews';

const PAYMENT_ONE = '11111111-1111-4111-8111-111111111111';
const PAYMENT_TWO = '22222222-2222-4222-8222-222222222222';
const REVIEWER_ID = '33333333-3333-4333-8333-333333333333';

const serviceMock = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  resolve: vi.fn(),
}));
const toastSuccessMock = vi.hoisted(() => vi.fn());
const showErrorToastMock = vi.hoisted(() => vi.fn());
const accessState = vi.hoisted(() => ({
  permissions: ['PAYOUTS_READ', 'PAYOUTS_UPDATE'] as string[],
}));

vi.mock('@/services/adminPayFastChargeReview.service', () => ({
  getAdminPayFastChargeReview: serviceMock.get,
  listAdminPayFastChargeReviews: serviceMock.list,
  resolveAdminPayFastChargeReview: serviceMock.resolve,
}));

vi.mock('@/hooks/useAccessControl', () => ({
  useAccessControl: () => ({
    can: (permission: string | string[]) =>
      (Array.isArray(permission) ? permission : [permission]).every(item =>
        accessState.permissions.includes(item),
      ),
  }),
}));

vi.mock('@/lib/errorToast', () => ({
  showErrorToast: showErrorToastMock,
}));

vi.mock('sonner', () => ({
  toast: { success: toastSuccessMock },
}));

function charge(overrides: Record<string, unknown> = {}) {
  return {
    amount: 450,
    boostPurchaseId: null,
    createdAt: '2026-11-10T09:00:00.000Z',
    currency: 'PKR',
    id: PAYMENT_ONE,
    orderId: '44444444-4444-4444-8444-444444444444',
    paymentIdentifiers: {
      basket_id: 'BASKET-100',
      merchant_id: 'MERCHANT-1',
      payment_id: 'PAY-100',
      pf_payment_id: 'PF-100',
    },
    provider: 'PAYFAST',
    purchaseStatus: 'PAYMENT_EXPIRED',
    reason: 'DUPLICATE_CHARGE',
    resolution: null,
    transactionId: 'TXN-100',
    ...overrides,
  };
}

function listResponse(records = [charge()]) {
  return {
    data: records,
    message: 'PayFast charge reviews fetched successfully.',
    pagination: {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      perPage: 20,
      prevPage: null,
      total: records.length,
    },
    statusCode: 200,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PayFastChargeReviews />
    </QueryClientProvider>,
  );
}

describe('admin PayFast charge reviews', () => {
  beforeEach(() => {
    accessState.permissions = ['PAYOUTS_READ', 'PAYOUTS_UPDATE'];
    serviceMock.list.mockReset().mockResolvedValue(
      listResponse([
        charge(),
        charge({
          id: PAYMENT_TWO,
          reason: 'PAYMENT_AFTER_EXPIRY',
          transactionId: 'TXN-200',
          amount: 900,
        }),
      ]),
    );
    serviceMock.get.mockReset();
    serviceMock.resolve.mockReset();
    toastSuccessMock.mockReset();
    showErrorToastMock.mockReset();
  });

  it('lists each unresolved charge separately with its reason, amount and transaction', async () => {
    renderPage();

    const rows = await screen.findAllByRole('row', { name: /TXN-/ });
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('TXN-100')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Duplicate Charge')).toBeInTheDocument();
    expect(within(rows[0]).getByText('PKR 450')).toBeInTheDocument();
    expect(within(rows[1]).getByText('TXN-200')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Payment After Expiry')).toBeInTheDocument();
    expect(serviceMock.list).toHaveBeenCalledWith({ page: 1, size: 20 });
  });

  it('shows each charge record ID in its list row so it can be looked up later', async () => {
    renderPage();

    const rows = await screen.findAllByRole('row', { name: /TXN-/ });
    expect(within(rows[0]).getByText(PAYMENT_ONE)).toBeInTheDocument();
    expect(within(rows[1]).getByText(PAYMENT_TWO)).toBeInTheDocument();
  });

  it('inspects a selected charge with its purchase, reason, amount and identifiers', async () => {
    serviceMock.get.mockResolvedValue({
      data: charge(),
      message: 'PayFast charge review fetched successfully.',
      statusCode: 200,
    });
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);

    const detail = screen.getByRole('region', { name: 'Charge details' });
    await within(detail).findByText(PAYMENT_ONE);
    expect(serviceMock.get).toHaveBeenCalledWith(PAYMENT_ONE);
    expect(within(detail).getByText(PAYMENT_ONE)).toBeInTheDocument();
    expect(within(detail).getByText('44444444-4444-4444-8444-444444444444')).toBeInTheDocument();
    expect(within(detail).getByText('Duplicate Charge')).toBeInTheDocument();
    expect(within(detail).getByText('PKR 450')).toBeInTheDocument();
    expect(within(detail).getByText('BASKET-100')).toBeInTheDocument();
    expect(within(detail).getByText('MERCHANT-1')).toBeInTheDocument();
    expect(within(detail).getByText('PAY-100')).toBeInTheDocument();
    expect(within(detail).getByText('PF-100')).toBeInTheDocument();
    expect(within(detail).getByRole('button', { name: 'Record outcome' })).toBeInTheDocument();
  });

  it('records a manual refund outcome and shows the recorded outcome afterwards', async () => {
    const resolvedCharge = charge({
      resolution: {
        note: 'Refunded through the PayFast dashboard',
        outcome: 'REFUND_COMPLETED',
        reviewedAt: '2026-11-18T10:00:00.000Z',
        reviewerId: REVIEWER_ID,
      },
    });
    serviceMock.get
      .mockReset()
      .mockResolvedValueOnce({ data: charge(), message: 'ok', statusCode: 200 })
      .mockResolvedValue({ data: resolvedCharge, message: 'ok', statusCode: 200 });
    serviceMock.resolve.mockResolvedValue({
      data: resolvedCharge,
      message: 'PayFast charge review resolved successfully.',
      statusCode: 200,
    });
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);
    const detail = screen.getByRole('region', { name: 'Charge details' });
    await within(detail).findByText(PAYMENT_ONE);

    fireEvent.click(within(detail).getByRole('radio', { name: 'Manual refund completed' }));
    fireEvent.change(within(detail).getByLabelText('Note'), {
      target: { value: ' Refunded through the PayFast dashboard ' },
    });
    fireEvent.click(within(detail).getByRole('button', { name: 'Record outcome' }));

    await waitFor(() =>
      expect(serviceMock.resolve).toHaveBeenCalledWith(PAYMENT_ONE, {
        note: 'Refunded through the PayFast dashboard',
        outcome: 'REFUND_COMPLETED',
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('PayFast charge outcome recorded');
    expect(await within(detail).findByText('Outcome recorded')).toBeInTheDocument();
    expect(within(detail).getByText('Manual refund completed')).toBeInTheDocument();
    expect(within(detail).queryByRole('button', { name: 'Record outcome' })).toBeNull();
  });

  it('requires an outcome and a note before recording a decision', async () => {
    serviceMock.get.mockResolvedValue({ data: charge(), message: 'ok', statusCode: 200 });
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);
    const detail = screen.getByRole('region', { name: 'Charge details' });
    await within(detail).findByText(PAYMENT_ONE);
    fireEvent.click(within(detail).getByRole('button', { name: 'Record outcome' }));

    expect(await within(detail).findByText('Choose an outcome.')).toBeInTheDocument();
    expect(within(detail).getByText('A note is required.')).toBeInTheDocument();
    expect(serviceMock.resolve).not.toHaveBeenCalled();
  });

  it('shows the charge without an outcome form when the staff member cannot update payouts', async () => {
    accessState.permissions = ['PAYOUTS_READ'];
    serviceMock.get.mockResolvedValue({ data: charge(), message: 'ok', statusCode: 200 });
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);
    const detail = screen.getByRole('region', { name: 'Charge details' });
    await within(detail).findByText(PAYMENT_ONE);

    expect(within(detail).queryByRole('button', { name: 'Record outcome' })).toBeNull();
    expect(
      within(detail).getByText(/You do not have permission to record an outcome\./),
    ).toBeInTheDocument();
  });

  it('denies the charge review page without payout read permission', () => {
    accessState.permissions = ['ORDERS_READ'];
    renderPage();

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(serviceMock.list).not.toHaveBeenCalled();
  });

  it('reports a list failure instead of an empty state', async () => {
    serviceMock.list.mockReset().mockRejectedValue(new Error('Server error'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load PayFast charge reviews.',
    );
    expect(screen.queryByText('No unresolved PayFast charges.')).toBeNull();
  });

  it('keeps the form and reports the error when the charge was already resolved', async () => {
    serviceMock.get.mockResolvedValue({ data: charge(), message: 'ok', statusCode: 200 });
    serviceMock.resolve.mockRejectedValue(new Error('Already resolved'));
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);
    const detail = screen.getByRole('region', { name: 'Charge details' });
    await within(detail).findByText(PAYMENT_ONE);
    fireEvent.click(within(detail).getByRole('radio', { name: 'No refund required' }));
    fireEvent.change(within(detail).getByLabelText('Note'), { target: { value: 'Duplicate' } });
    fireEvent.click(within(detail).getByRole('button', { name: 'Record outcome' }));

    await waitFor(() =>
      expect(showErrorToastMock).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to record the charge outcome',
      ),
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(within(detail).getByRole('button', { name: 'Record outcome' })).toBeInTheDocument();
  });

  it('shows an error when the selected charge cannot be loaded', async () => {
    serviceMock.get.mockRejectedValue(new Error('Not found'));
    renderPage();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Inspect' }))[0]!);

    expect(await screen.findByText('Charge unavailable')).toBeInTheDocument();
  });

  it('pages through unresolved charges', async () => {
    serviceMock.list
      .mockReset()
      .mockResolvedValueOnce({
        ...listResponse([charge()]),
        pagination: {
          currentPage: 1,
          lastPage: 2,
          nextPage: 2,
          perPage: 20,
          prevPage: null,
          total: 2,
        },
      })
      .mockResolvedValueOnce({
        ...listResponse([charge({ id: PAYMENT_TWO, transactionId: 'TXN-300' })]),
        pagination: {
          currentPage: 2,
          lastPage: 2,
          nextPage: null,
          perPage: 20,
          prevPage: 1,
          total: 2,
        },
      });
    renderPage();

    expect(await screen.findByText('TXN-100')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('TXN-300')).toBeInTheDocument();
    expect(serviceMock.list).toHaveBeenLastCalledWith({ page: 2, size: 20 });
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('looks up a resolved charge by its record ID to track the recorded outcome', async () => {
    serviceMock.list.mockReset().mockResolvedValue(listResponse([]));
    serviceMock.get.mockResolvedValue({
      data: charge({
        resolution: {
          note: 'Refunded through the PayFast dashboard',
          outcome: 'REFUND_COMPLETED',
          reviewedAt: '2026-11-18T10:00:00.000Z',
          reviewerId: REVIEWER_ID,
        },
      }),
      message: 'ok',
      statusCode: 200,
    });
    renderPage();

    fireEvent.change(await screen.findByLabelText('Charge record ID'), {
      target: { value: PAYMENT_ONE },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Look up charge' }));

    expect(await screen.findByText('Outcome recorded')).toBeInTheDocument();
    expect(serviceMock.get).toHaveBeenCalledWith(PAYMENT_ONE);
    const detail = screen.getByRole('region', { name: 'Charge details' });
    expect(within(detail).getByText('Manual refund completed')).toBeInTheDocument();
  });

  it('rejects a lookup that is not a charge record ID', async () => {
    renderPage();

    fireEvent.change(await screen.findByLabelText('Charge record ID'), {
      target: { value: 'not-an-id' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Look up charge' }));

    expect(await screen.findByText('Enter a valid charge record ID.')).toBeInTheDocument();
    expect(serviceMock.get).not.toHaveBeenCalled();
  });
});
