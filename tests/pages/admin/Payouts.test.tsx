import type { EligibleSellerPayoutItemsResponse } from '@/types/payout.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Payouts from '@/pages/admin/Payouts';

const payoutService = vi.hoisted(() => ({
  createPayoutRun: vi.fn(),
  createSellerPayout: vi.fn(),
  listEligibleSellerPayoutItems: vi.fn(),
  listAdminPayoutSellers: vi.fn(),
  getAdminSellerPayable: vi.fn(),
  listPayoutRunItems: vi.fn(),
  listPayoutRuns: vi.fn(),
  listRefundPayouts: vi.fn(),
  listSellerPayouts: vi.fn(),
  recordSellerPayoutCyclePayment: vi.fn(),
  recordAdminSellerPayment: vi.fn(),
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

const sellerSummaryResponse = {
  ...emptyPage,
  data: [
    {
      sellerId: 'seller-1',
      sellerFullName: 'Seller One',
      netSales: 20000,
      refundedAmount: 2500,
      refundedCount: 2,
      paid: 5000,
      balanceDue: 12500,
      payableStatus: 'PAYABLE' as const,
      reviewReason: null,
    },
    {
      sellerId: 'seller-2',
      sellerFullName: 'Seller Two',
      netSales: 0,
      refundedAmount: 0,
      refundedCount: 0,
      paid: 0,
      balanceDue: 0,
      payableStatus: 'NOTHING_DUE' as const,
      reviewReason: null,
    },
  ],
  aggregates: { grossSales: 24000, buyerRefunds: 2500, paid: 5000, balanceDue: 12500 },
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 2 },
};

const sellerPayablePreviewResponse = {
  data: {
    sellerId: 'seller-1',
    sellerFullName: 'Seller One',
    payableStatus: 'PAYABLE' as const,
    reviewReason: null,
    base: 10000,
    sellerIncentiveBonus: 2500,
    total: 12500,
    periodStart: '2026-09-01T00:00:00.000Z',
    periodEnd: '2026-09-30T23:59:59.999Z',
    itemCount: 3,
    bankAccountHolder: 'Seller One',
    bankAccountNumber: '1234567890',
    bankIban: 'PK00TEST0000000000000000',
    bankName: 'Example Bank',
    bankSwift: 'EXAMPKKA',
    bankDetailsMissing: false,
    bankDetailsDiffer: false,
  },
  message: 'Loaded.',
  statusCode: 200,
};

const sellerPaymentResponse = {
  data: {
    id: 'payment-1',
    sellerId: 'seller-1',
    amount: 12500,
    method: 'BANK_TRANSFER' as const,
    notes: 'October transfer',
    payoutRunItemIds: ['item-1', 'item-2'],
    periodEnd: '2026-09-30T23:59:59.999Z',
    periodStart: '2026-09-01T00:00:00.000Z',
    reference: 'BANK-123',
    paidAt: '2026-10-01T10:00:00.000Z',
  },
  message: 'Recorded.',
  statusCode: 201,
};

const eligibleResponse = createEligibleResponse({
  aggregates: { totalAmount: 2450 },
  data: [
    {
      orderId: 'order-12345678',
      orderItemId: 'order-item-1',
      sellerId: 'seller-1',
      amount: 2450,
      payoutComponent: 'SELLER_INCENTIVE_BONUS' as const,
      sellerFullName: 'Seller One',
      title: 'Vintage jacket',
      receivedAt: '2026-09-18T10:30:00.000Z',
    },
  ],
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 1 },
});

const payoutRun = {
  id: 'run-1',
  buyerRefundAmount: 0,
  buyerRefundItemCount: 0,
  generatedByFullName: 'Finance Admin',
  itemCount: 1,
  periodEnd: '2026-09-30T23:59:59.999Z',
  periodStart: '2026-09-01T00:00:00.000Z',
  sellerPayoutAmount: 2450,
  sellerPayoutItemCount: 1,
  totalAmount: 2450,
  generatedBy: 'admin-1',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const sellerPayoutRunItem = {
  id: 'run-item-1',
  buyerId: null,
  complaintId: null,
  orderId: 'order-12345678',
  orderItemId: 'order-item-1',
  payoutRunId: 'run-1',
  sellerId: 'seller-1',
  userId: 'seller-1',
  amount: 2450,
  bankAccountHolder: null,
  bankAccountNumber: null,
  bankIban: null,
  bankName: null,
  bankSwift: null,
  itemType: 'SELLER_PAYOUT' as const,
  payoutComponent: 'SELLER_INCENTIVE_BONUS' as const,
  periodEnd: payoutRun.periodEnd,
  periodStart: payoutRun.periodStart,
  sourceDate: '2026-09-18T10:30:00.000Z',
  sourceMetadata: { listingTitle: 'Vintage jacket' },
  sourceStatus: 'DELIVERED',
  sourceType: 'ORDER_ITEM',
  status: 'UNPAID' as const,
  userFullName: 'Seller One',
  paidAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const sellerBasePayoutRunItem = {
  ...sellerPayoutRunItem,
  id: 'run-item-2',
  amount: 10000,
  orderId: 'order-87654321',
  orderItemId: 'order-item-2',
  payoutComponent: 'BASE' as const,
  sourceMetadata: { listingTitle: 'Leather bag' },
};

const otherSellerPayoutRunItem = {
  ...sellerPayoutRunItem,
  id: 'run-item-3',
  amount: 2000,
  orderId: 'order-55555555',
  orderItemId: 'order-item-3',
  sellerId: 'seller-2',
  userId: 'seller-2',
  userFullName: 'Seller Two',
  payoutComponent: 'BASE' as const,
};

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

async function openRunDetails() {
  payoutService.listPayoutRuns.mockResolvedValue({
    ...emptyPage,
    data: [payoutRun],
  });
  if (!payoutService.listPayoutRunItems.getMockImplementation()) {
    payoutService.listPayoutRunItems.mockResolvedValue({
      ...emptyPage,
      data: [sellerPayoutRunItem],
    });
  }
  renderPage();
  fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout runs' }), { button: 0 });
  fireEvent.click(await screen.findByText('Finance Admin'));
  expect(await screen.findByRole('heading', { name: 'Payout run details' })).toBeInTheDocument();
  expect(payoutService.listPayoutRunItems).toHaveBeenCalledWith('run-1', { page: 1, size: 100 });
  expect((await screen.findAllByText('Seller One')).length).toBeGreaterThan(0);
}

describe('admin payout eligibility page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    payoutService.listPayoutRuns.mockResolvedValue(emptyPage);
    payoutService.listRefundPayouts.mockResolvedValue(emptyPage);
    payoutService.listSellerPayouts.mockResolvedValue(emptyPage);
    payoutService.listAdminPayoutSellers.mockResolvedValue(sellerSummaryResponse);
    payoutService.getAdminSellerPayable.mockResolvedValue(sellerPayablePreviewResponse);
    payoutService.listEligibleSellerPayoutItems.mockResolvedValue(eligibleResponse);
    payoutService.createPayoutRun.mockResolvedValue({
      data: { id: 'run-1' },
      message: 'Created.',
      statusCode: 201,
    });
  });

  it('opens the seller payout dialog with the server amount and payout split', async () => {
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    const sellerOneRow = screen.getByRole('row', { name: /Seller One/ });
    const sellerTwoRow = screen.getByRole('row', { name: /Seller Two/ });
    const recordSellerOneButton = within(sellerOneRow).getByRole('button', {
      name: 'Record payout',
    });
    expect(recordSellerOneButton).toBeEnabled();
    expect(within(sellerTwoRow).getByRole('button', { name: 'Record payout' })).toBeDisabled();

    fireEvent.click(recordSellerOneButton);

    expect(payoutService.getAdminSellerPayable).toHaveBeenCalledWith('seller-1');
    const dialog = await screen.findByRole('dialog');
    const amountInput = await within(dialog).findByLabelText('Amount (PKR)');
    expect(amountInput).toHaveValue('Rs 12,500.00');
    expect(amountInput).toHaveAttribute('readonly');
    expect(within(dialog).getByLabelText('Method')).toHaveValue('Bank transfer');
    expect(within(dialog).getByText(/^Sep 1, 2026 – /)).toBeInTheDocument();
    expect(within(dialog).getByText('Base payout')).toBeInTheDocument();
    expect(within(dialog).getByText('Rs 10,000.00')).toBeInTheDocument();
    expect(within(dialog).getByText('Seller incentive bonus')).toBeInTheDocument();
    expect(within(dialog).getByText('Rs 2,500.00')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/recording a payment does not move money/i),
    ).toBeInTheDocument();
  });

  it('shows read-only seller bank details and a dash for an absent SWIFT code', async () => {
    payoutService.getAdminSellerPayable.mockResolvedValue({
      ...sellerPayablePreviewResponse,
      data: { ...sellerPayablePreviewResponse.data, bankSwift: null },
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');

    await within(dialog).findByLabelText('Amount (PKR)');

    expect(within(dialog).getByLabelText('Account holder')).toHaveValue('Seller One');
    expect(within(dialog).getByLabelText('Account number')).toHaveValue('1234567890');
    expect(within(dialog).getByLabelText('IBAN')).toHaveValue('PK00TEST0000000000000000');
    expect(within(dialog).getByLabelText('Bank name')).toHaveValue('Example Bank');
    expect(within(dialog).getByLabelText('SWIFT')).toHaveValue('—');
    for (const label of ['Account holder', 'Account number', 'IBAN', 'Bank name', 'SWIFT']) {
      expect(within(dialog).getByLabelText(label)).toHaveAttribute('readonly');
    }
  });
  it('warns when payout items have different bank details without blocking save', async () => {
    payoutService.getAdminSellerPayable.mockResolvedValue({
      ...sellerPayablePreviewResponse,
      data: { ...sellerPayablePreviewResponse.data, bankDetailsDiffer: true },
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('Amount (PKR)');

    expect(
      within(dialog).getByText(/bank details differ between payout items/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save payout' })).toBeEnabled();
  });
  it('blocks payout recording when required bank details are missing', async () => {
    payoutService.getAdminSellerPayable.mockResolvedValue({
      ...sellerPayablePreviewResponse,
      data: {
        ...sellerPayablePreviewResponse.data,
        bankAccountHolder: null,
        bankAccountNumber: null,
        bankDetailsMissing: true,
        bankIban: null,
        bankName: null,
        bankSwift: null,
      },
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('Amount (PKR)');

    expect(within(dialog).getByText(/complete bank details are required/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save payout' })).toBeDisabled();
  });
  it('keeps entries and reloads the preview when the server refuses missing bank details', async () => {
    const missingBankDetailsError = new HTTPError(
      new Response(
        JSON.stringify({
          code: 'APP_SELLER_PAYOUT_BANK_DETAILS_MISSING',
          message: 'Complete bank details are required to record a seller payment.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 422 },
      ),
      new Request('http://localhost/api/v1/admin/payouts/sellers/seller-1/payment'),
      {} as never,
    );
    payoutService.getAdminSellerPayable
      .mockResolvedValueOnce(sellerPayablePreviewResponse)
      .mockResolvedValueOnce({
        ...sellerPayablePreviewResponse,
        data: { ...sellerPayablePreviewResponse.data, bankDetailsMissing: true },
      });
    payoutService.recordAdminSellerPayment.mockRejectedValueOnce(missingBankDetailsError);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    const referenceInput = await within(dialog).findByLabelText('Reference');
    const notesInput = within(dialog).getByLabelText('Notes (optional)');
    fireEvent.change(referenceInput, { target: { value: 'BANK-123' } });
    fireEvent.change(notesInput, { target: { value: 'Transfer made' } });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));

    expect(
      await within(dialog).findByText(
        'Complete bank details are required to record a seller payment.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(payoutService.getAdminSellerPayable).toHaveBeenCalledTimes(2));
    expect(referenceInput).toHaveValue('BANK-123');
    expect(notesInput).toHaveValue('Transfer made');
    expect(within(dialog).getByRole('button', { name: 'Save payout' })).toBeDisabled();
  });
  it('requires a reference and records the previewed amount with an idempotency key', async () => {
    payoutService.recordAdminSellerPayment.mockResolvedValue(sellerPaymentResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText('Amount (PKR)');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Reference is required.');
    expect(payoutService.recordAdminSellerPayment).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Reference'), { target: { value: 'BANK-123' } });
    fireEvent.change(within(dialog).getByLabelText('Notes (optional)'), {
      target: { value: 'October transfer' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));

    await waitFor(() => expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledTimes(1));
    expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledWith('seller-1', {
      expectedAmount: 12500,
      idempotencyKey: expect.any(String),
      notes: 'October transfer',
      reference: 'BANK-123',
    });
  });

  it('refreshes seller balances and disables the action when a payout is recorded', async () => {
    payoutService.listAdminPayoutSellers.mockImplementation(async () => {
      if (payoutService.recordAdminSellerPayment.mock.calls.length === 0) {
        return sellerSummaryResponse;
      }

      return {
        ...sellerSummaryResponse,
        data: [
          {
            ...sellerSummaryResponse.data[0],
            paid: 17500,
            balanceDue: 0,
            payableStatus: 'NOTHING_DUE' as const,
          },
          sellerSummaryResponse.data[1],
        ],
        aggregates: { ...sellerSummaryResponse.aggregates, paid: 17500, balanceDue: 0 },
      };
    });
    payoutService.recordAdminSellerPayment.mockResolvedValue(sellerPaymentResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(await within(dialog).findByLabelText('Reference'), {
      target: { value: 'BANK-123' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const updatedSellerRow = await screen.findByRole('row', { name: /Seller One/ });
    expect(within(updatedSellerRow).getByText('Rs 17,500.00')).toBeInTheDocument();
    expect(within(updatedSellerRow).getByText('Rs 0.00')).toBeInTheDocument();
    expect(within(updatedSellerRow).getByRole('button', { name: 'Record payout' })).toBeDisabled();
  });

  it('shows preview loading and lets the administrator retry a failed preview', async () => {
    payoutService.getAdminSellerPayable
      .mockRejectedValueOnce(new Error('Preview unavailable'))
      .mockResolvedValueOnce(sellerPayablePreviewResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');

    expect(
      await within(dialog).findByText(
        'Could not load the seller payout preview. Please try again.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));

    expect(await within(dialog).findByLabelText('Amount (PKR)')).toHaveValue('Rs 12,500.00');
    expect(payoutService.getAdminSellerPayable).toHaveBeenCalledTimes(2);
  });

  it('shows a loading state while the seller payout preview is being fetched', async () => {
    let resolvePreview!: (response: typeof sellerPayablePreviewResponse) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.getAdminSellerPayable.mockReturnValue(
      new Promise(resolve => {
        resolvePreview = resolve;
      }),
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Loading seller payout preview…')).toBeInTheDocument();
    resolvePreview(sellerPayablePreviewResponse);
    expect(await within(dialog).findByLabelText('Amount (PKR)')).toHaveValue('Rs 12,500.00');
  });

  it('keeps form entries and reuses the idempotency key after a failed payment request', async () => {
    payoutService.recordAdminSellerPayment
      .mockRejectedValueOnce(new Error('The response was lost.'))
      .mockResolvedValueOnce(sellerPaymentResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    const referenceInput = await within(dialog).findByLabelText('Reference');
    const notesInput = within(dialog).getByLabelText('Notes (optional)');
    fireEvent.change(referenceInput, { target: { value: 'BANK-123' } });
    fireEvent.change(notesInput, { target: { value: 'October transfer' } });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    expect(await within(dialog).findByText('The response was lost.')).toBeInTheDocument();
    expect(referenceInput).toHaveValue('BANK-123');
    expect(notesInput).toHaveValue('October transfer');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    await waitFor(() => expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledTimes(2));
    const firstPayload = payoutService.recordAdminSellerPayment.mock.calls[0][1];
    const retryPayload = payoutService.recordAdminSellerPayment.mock.calls[1][1];
    expect(retryPayload).toEqual(firstPayload);
  });

  it('prevents duplicate submission while a seller payment is pending', async () => {
    let resolvePayment!: (response: typeof sellerPaymentResponse) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.recordAdminSellerPayment.mockReturnValue(
      new Promise(resolve => {
        resolvePayment = resolve;
      }),
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(await within(dialog).findByLabelText('Reference'), {
      target: { value: 'BANK-123' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    const pendingButton = await within(dialog).findByRole('button', { name: 'Saving payout…' });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledTimes(1);

    resolvePayment(sellerPaymentResponse);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reloads a changed amount and requires an explicit retry with a new key', async () => {
    const staleAmountError = new HTTPError(
      new Response(
        JSON.stringify({
          code: 'APP_SELLER_PAYOUT_AMOUNT_CHANGED',
          message: 'Seller payable amount changed after it was previewed.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 409 },
      ),
      new Request('http://localhost/api/v1/admin/payouts/sellers/seller-1/payment'),
      {} as never,
    );
    payoutService.getAdminSellerPayable
      .mockResolvedValueOnce(sellerPayablePreviewResponse)
      .mockResolvedValueOnce({
        ...sellerPayablePreviewResponse,
        data: { ...sellerPayablePreviewResponse.data, base: 9000, total: 11000 },
      });
    payoutService.recordAdminSellerPayment
      .mockRejectedValueOnce(staleAmountError)
      .mockResolvedValueOnce(sellerPaymentResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    fireEvent.click(
      within(screen.getByRole('row', { name: /Seller One/ })).getByRole('button', {
        name: 'Record payout',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    const amountInput = await within(dialog).findByLabelText('Amount (PKR)');
    fireEvent.change(within(dialog).getByLabelText('Reference'), {
      target: { value: 'BANK-123' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    expect(
      await within(dialog).findByText(
        'The seller balance changed. Review the updated amount before saving again.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(amountInput).toHaveValue('Rs 11,000.00'));
    expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save payout' }));
    await waitFor(() => expect(payoutService.recordAdminSellerPayment).toHaveBeenCalledTimes(2));
    expect(payoutService.recordAdminSellerPayment.mock.calls[1][1].expectedAmount).toBe(11000);
    expect(payoutService.recordAdminSellerPayment.mock.calls[1][1].idempotencyKey).not.toBe(
      payoutService.recordAdminSellerPayment.mock.calls[0][1].idempotencyKey,
    );
  });

  it('shows seller balances and server totals on the By seller tab', async () => {
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });

    expect(await screen.findByRole('columnheader', { name: 'Net sales' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Refunded/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Paid' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Balance due' })).toBeInTheDocument();
    expect(screen.getByText('Seller One')).toBeInTheDocument();
    expect(screen.getByText('Rs 20,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('Rs 2,500.00')).toHaveLength(2);
    expect(screen.getAllByText('Rs 12,500.00')).toHaveLength(2);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Gross sales', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 24,000.00',
    );
    expect(screen.getByText('Buyer refunds', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 2,500.00',
    );
    expect(screen.getByText('Paid to sellers', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 5,000.00',
    );
    expect(screen.getByText('Balance due', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 12,500.00',
    );
  });

  it('moves through server pages of seller balances', async () => {
    payoutService.listAdminPayoutSellers.mockImplementation(async ({ page }) =>
      page === 1
        ? {
            ...sellerSummaryResponse,
            data: [sellerSummaryResponse.data[0]],
            pagination: {
              ...sellerSummaryResponse.pagination,
              currentPage: 1,
              lastPage: 2,
              nextPage: 2,
              total: 2,
            },
          }
        : {
            ...sellerSummaryResponse,
            data: [sellerSummaryResponse.data[1]],
            pagination: {
              ...sellerSummaryResponse.pagination,
              currentPage: 2,
              lastPage: 2,
              nextPage: null,
              prevPage: 1,
              total: 2,
            },
          },
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });
    expect(await screen.findByText('Seller One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(payoutService.listAdminPayoutSellers).toHaveBeenCalledWith({ page: 2, size: 20 }),
    );
    expect(await screen.findByText('Page 2 of 2 · 2 sellers')).toBeInTheDocument();
    expect(screen.getByText('Seller Two')).toBeInTheDocument();
    expect(screen.queryByText('Seller One')).not.toBeInTheDocument();
  });

  it('keeps server totals unchanged when the payout history seller filter changes', async () => {
    payoutService.listSellerPayouts.mockImplementation(async parameters => ({
      ...emptyPage,
      data: [
        {
          id: 'payout-1',
          sellerId: 'seller-1',
          sellerFullName: 'Seller One',
          amount: parameters.sellerId ? 1000 : 9000,
          method: 'bank_transfer',
          periodStart: null,
          periodEnd: null,
          reference: null,
          paidAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    }));
    renderPage();

    await screen.findByRole('tab', { name: 'Payout history' });
    expect(screen.getByText('Paid to sellers', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 5,000.00',
    );
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Payout history' }), { button: 0 });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Seller One' }));

    await waitFor(() =>
      expect(payoutService.listSellerPayouts).toHaveBeenCalledWith({ sellerId: 'seller-1' }),
    );
    expect(screen.getByText('Paid to sellers', { selector: 'p' }).parentElement).toHaveTextContent(
      'Rs 5,000.00',
    );
  });

  it('shows a retryable error when seller balances cannot be loaded', async () => {
    payoutService.listAdminPayoutSellers
      .mockRejectedValueOnce(new Error('Seller summaries unavailable'))
      .mockResolvedValueOnce(sellerSummaryResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });

    expect(await screen.findByText(/could not load seller balances/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Seller One')).toBeInTheDocument();
  });

  it('shows the empty state when there has been no seller activity', async () => {
    payoutService.listAdminPayoutSellers.mockResolvedValue(emptyPage);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });

    expect(await screen.findByText('No seller activity yet.')).toBeInTheDocument();
  });

  it('groups seller components and keeps each source item available in payout run details', async () => {
    payoutService.listPayoutRunItems.mockResolvedValue({
      ...emptyPage,
      data: [sellerPayoutRunItem, sellerBasePayoutRunItem, otherSellerPayoutRunItem],
    });
    await openRunDetails();

    expect(screen.getAllByText('Seller incentive bonus')).toHaveLength(1);
    expect(screen.getAllByText('Base payout')).toHaveLength(2);
    expect(screen.getAllByText('Seller incentive')).toHaveLength(2);
    expect(screen.getByText('Rs 12,450.00')).toBeInTheDocument();
    expect(screen.getAllByText('Rs 10,000.00')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /mark .* paid/i })).toHaveLength(2);
    expect(screen.getAllByText('Vintage jacket').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Leather bag').length).toBeGreaterThan(0);
    expect(screen.getByText('Order order-12')).toBeInTheDocument();
    expect(screen.getByText('Order order-87')).toBeInTheDocument();
    expect(screen.queryByText(/payout fee/i)).not.toBeInTheDocument();
  });

  it('loads every payout-run item page before grouping seller totals', async () => {
    payoutService.listPayoutRunItems.mockImplementation(async (_runId, parameters) => {
      const isFirstPage = parameters.page === 1;
      return {
        ...emptyPage,
        data: [isFirstPage ? sellerBasePayoutRunItem : sellerPayoutRunItem],
        pagination: {
          ...emptyPage.pagination,
          currentPage: isFirstPage ? 1 : 2,
          lastPage: 2,
          nextPage: isFirstPage ? 2 : null,
          perPage: 100,
          prevPage: isFirstPage ? null : 1,
          total: 2,
        },
      };
    });
    await openRunDetails();

    expect(payoutService.listPayoutRunItems).toHaveBeenCalledWith('run-1', { page: 2, size: 100 });
    expect(screen.getByText('Rs 12,450.00')).toBeInTheDocument();
    expect(screen.getByText('Leather bag')).toBeInTheDocument();
    expect(screen.getByText('Vintage jacket')).toBeInTheDocument();
    expect(screen.getByText('Order order-87')).toBeInTheDocument();
    expect(screen.getByText('Order order-12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark Seller One paid' })).toBeInTheDocument();
  });

  it('waits for a selected period and sends full calendar-day boundaries', async () => {
    renderPage();

    expect(
      await screen.findByText('Select a period to load payout-eligible items.'),
    ).toBeInTheDocument();
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
    expect(screen.getByText('Seller incentive bonus')).toBeInTheDocument();
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
    await waitFor(() =>
      expect(payoutService.createPayoutRun).toHaveBeenCalledWith({
        periodEnd,
        periodStart,
      }),
    );
    await waitFor(() =>
      expect(payoutService.listEligibleSellerPayoutItems.mock.calls.length).toBeGreaterThan(1),
    );
    await waitFor(() => expect(payoutService.listPayoutRuns.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows a loading state while the payout run is being generated', async () => {
    let resolveRun!: (response: {
      data: { id: string };
      message: string;
      statusCode: number;
    }) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    const pendingRun = new Promise(resolve => {
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

    expect(
      screen.getByText(
        /buyer receipt confirmation and a posted local accounting snapshot are required/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate payout run' })).toBeDisabled();
  });

  it('keeps loading and API errors visible', async () => {
    payoutService.listEligibleSellerPayoutItems.mockRejectedValue(
      new Error('Eligibility unavailable'),
    );
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

  it('records one payment for all unpaid components for a seller in the selected cycle', async () => {
    payoutService.listPayoutRunItems.mockResolvedValue({
      ...emptyPage,
      data: [sellerPayoutRunItem, sellerBasePayoutRunItem],
    });
    payoutService.recordSellerPayoutCyclePayment.mockResolvedValue({
      data: {
        amount: 12450,
        paidAt: '2026-10-07T10:15:00.000Z',
        payoutRunItemIds: ['run-item-1', 'run-item-2'],
        sellerId: 'seller-1',
      },
      message: 'Updated.',
      statusCode: 200,
    });
    await openRunDetails();

    expect(
      screen.getByText(/Record payment only after the external transfer/i),
    ).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Mark Seller One paid' }));

    await waitFor(() =>
      expect(payoutService.recordSellerPayoutCyclePayment).toHaveBeenCalledWith(
        'run-1',
        'seller-1',
        {},
      ),
    );
  });

  it('refreshes every seller component with the shared paid timestamp after success', async () => {
    payoutService.listPayoutRunItems.mockImplementation(async () => {
      const isPaid = payoutService.recordSellerPayoutCyclePayment.mock.calls.length > 0;
      return {
        ...emptyPage,
        data: [
          {
            ...sellerPayoutRunItem,
            status: isPaid ? 'PAID' : 'UNPAID',
            paidAt: isPaid ? '2026-10-07T10:15:00.000Z' : null,
          },
          {
            ...sellerBasePayoutRunItem,
            status: isPaid ? 'PAID' : 'UNPAID',
            paidAt: isPaid ? '2026-10-07T10:15:00.000Z' : null,
          },
        ],
      };
    });
    payoutService.recordSellerPayoutCyclePayment.mockResolvedValue({
      data: {
        amount: 12450,
        paidAt: '2026-10-07T10:15:00.000Z',
        payoutRunItemIds: ['run-item-1', 'run-item-2'],
        sellerId: 'seller-1',
      },
      message: 'Updated.',
      statusCode: 200,
    });
    await openRunDetails();

    fireEvent.click(await screen.findByRole('button', { name: 'Mark Seller One paid' }));

    await waitFor(() =>
      expect(payoutService.listPayoutRunItems.mock.calls.length).toBeGreaterThan(1),
    );
    expect(screen.getAllByText('Paid')).toHaveLength(2);
    expect(screen.getAllByText(/Paid · \w+ \d+, 2026, \d+:\d+ [AP]M/)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Mark Seller One paid' })).not.toBeInTheDocument();
  });

  it('disables repeat seller payment submission while the request is pending', async () => {
    let resolvePayment!: (response: { data: unknown; message: string; statusCode: number }) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.recordSellerPayoutCyclePayment.mockReturnValue(
      new Promise(resolve => {
        resolvePayment = resolve;
      }),
    );
    await openRunDetails();

    fireEvent.click(await screen.findByRole('button', { name: 'Mark Seller One paid' }));

    const pendingButton = await screen.findByRole('button', {
      name: 'Recording payment for Seller One',
    });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(payoutService.recordSellerPayoutCyclePayment).toHaveBeenCalledTimes(1);
    resolvePayment({ data: sellerPayoutRunItem, message: 'Updated.', statusCode: 200 });
  });

  it('shows payment errors and keeps buyer refunds separate from seller payment actions', async () => {
    payoutService.listPayoutRunItems.mockResolvedValue({
      ...emptyPage,
      data: [
        sellerPayoutRunItem,
        {
          ...sellerPayoutRunItem,
          id: 'refund-item-1',
          buyerId: 'buyer-1',
          sellerId: null,
          itemType: 'BUYER_REFUND',
          userFullName: 'Buyer One',
        },
      ],
    });
    payoutService.recordSellerPayoutCyclePayment.mockRejectedValue(
      new Error('Payment update failed'),
    );
    await openRunDetails();

    expect(screen.getAllByText('Buyer refunds').length).toBeGreaterThan(1);
    expect(screen.getByText('Buyer One')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /mark .* paid/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Mark Seller One paid' }));

    expect(await screen.findByText('Payment update failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark Seller One paid' })).toBeEnabled();
    expect(screen.getAllByText('Unpaid').length).toBeGreaterThan(0);
  });

  it('keeps historical manual payout records and refund reporting available without manual creation', async () => {
    payoutService.listSellerPayouts.mockResolvedValue({
      ...emptyPage,
      data: [
        {
          id: 'payout-1',
          sellerId: 'seller-history',
          amount: 1250,
          method: 'bank_transfer',
          periodEnd: '2026-08-10',
          periodStart: '2026-08-01',
          reference: 'REF-1',
          sellerFullName: 'Historical Seller',
          paidAt: '2026-08-12T09:00:00.000Z',
        },
      ],
    });
    renderPage();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Payout history' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
    await waitFor(() => expect(payoutService.listSellerPayouts).toHaveBeenCalled());
    expect(await screen.findByText('Historical Seller')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record payout' })).not.toBeInTheDocument();
    expect(payoutService.createSellerPayout).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Buyer refunds' }), { button: 0 });
    expect(await screen.findByText('No buyer refunds.')).toBeInTheDocument();
  });
});
