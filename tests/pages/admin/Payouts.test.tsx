import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Payouts from '@/pages/admin/Payouts';

const payoutService = vi.hoisted(() => ({
  listAdminBuyerRefunds: vi.fn(),
  listAdminPayoutSellers: vi.fn(),
  getAdminSellerPayment: vi.fn(),
  listAdminSellerPayments: vi.fn(),
  listAdminPayoutTransactions: vi.fn(),
  getAdminSellerPayable: vi.fn(),
  recordAdminSellerPayment: vi.fn(),
}));
const createObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const revokeObjectURLDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

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

const buyerRefundResponse = {
  ...emptyPage,
  data: [
    {
      buyerId: 'buyer-1',
      complaintId: 'complaint-1',
      orderId: 'order-12345678',
      orderItemId: 'order-item-1',
      amount: 1800,
      buyerFullName: 'Buyer One',
      date: '2026-10-10T12:00:00.000Z',
      listingTitle: 'Vintage jacket',
    },
    {
      buyerId: 'buyer-2',
      complaintId: 'complaint-2',
      orderId: 'order-87654321',
      orderItemId: 'order-item-2',
      amount: 900,
      buyerFullName: 'Buyer Two',
      date: '2026-10-08T12:00:00.000Z',
      listingTitle: 'Leather bag',
    },
  ],
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 2 },
};

const sellerPaymentsResponse = {
  ...emptyPage,
  data: [
    {
      id: 'payment-newest',
      sellerId: 'seller-1',
      sellerFullName: 'Seller One',
      amount: 7200,
      method: 'bank_transfer',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      reference: 'BANK-7200',
      paidAt: '2026-11-01T10:00:00.000Z',
      source: 'LEDGER' as const,
      notes: null,
    },
    {
      id: 'payment-legacy',
      sellerId: 'seller-2',
      sellerFullName: 'Seller Two',
      amount: 1800,
      method: null,
      periodStart: null,
      periodEnd: null,
      reference: null,
      paidAt: '2026-08-15T10:00:00.000Z',
      source: 'LEGACY' as const,
      notes: null,
    },
  ],
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 2 },
};

const sellerPaymentDetailsResponse = {
  data: {
    id: 'payment-newest',
    sellerId: 'seller-1',
    sellerFullName: 'Seller One',
    amount: 9700,
    baseAmount: 7200,
    sellerIncentiveBonusAmount: 2500,
    method: 'bank_transfer',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    reference: 'BANK-7200',
    notes: 'October transfer',
    paidAt: '2026-11-01T10:00:00.000Z',
    source: 'LEDGER' as const,
    itemsAvailable: true,
    items: [
      {
        orderId: '12345678-order',
        amount: 7200,
        buyerFullName: 'Buyer One',
        date: '2026-10-12T10:00:00.000Z',
        payoutComponent: 'BASE' as const,
        refunded: false,
        title: 'Leather jacket',
      },
      {
        orderId: '87654321-order',
        amount: 2500,
        buyerFullName: 'Buyer Two',
        date: '2026-10-15T10:00:00.000Z',
        payoutComponent: 'SELLER_INCENTIVE_BONUS' as const,
        refunded: false,
        title: 'Vintage bag',
      },
      {
        orderId: '55555555-order',
        amount: 1500,
        buyerFullName: 'Buyer Three',
        date: '2026-10-18T10:00:00.000Z',
        payoutComponent: 'BASE' as const,
        refunded: true,
        title: 'Refunded coat',
      },
    ],
  },
  message: 'Loaded.',
  statusCode: 200,
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

const transactionResponse = {
  ...emptyPage,
  data: [
    {
      id: 'sale-1:BASE',
      sellerId: 'seller-1',
      description: 'Vintage jacket',
      amount: 8500,
      date: '2026-09-18T10:30:00.000Z',
      payoutComponent: 'BASE' as const,
      reference: 'order-12345678',
      refunded: false,
      sellerFullName: 'Seller One',
      type: 'SALE' as const,
    },
    {
      id: 'sale-1:SELLER_INCENTIVE_BONUS',
      sellerId: 'seller-1',
      description: 'Vintage jacket',
      amount: 1500,
      date: '2026-09-18T10:30:00.000Z',
      payoutComponent: 'SELLER_INCENTIVE_BONUS' as const,
      reference: 'order-12345678',
      refunded: false,
      sellerFullName: 'Seller One',
      type: 'SALE' as const,
    },
    {
      id: 'sale-2:REFUNDED',
      sellerId: 'seller-2',
      description: 'Leather bag',
      amount: 0,
      date: '2026-09-17T10:30:00.000Z',
      payoutComponent: null,
      reference: 'order-87654321',
      refunded: true,
      sellerFullName: 'Seller Two',
      type: 'SALE' as const,
    },
    {
      id: 'payout:ledger:payment-1',
      sellerId: 'seller-1',
      description: 'Payout · bank transfer',
      amount: -3000,
      date: '2026-09-16T10:30:00.000Z',
      payoutComponent: null,
      reference: 'PAY-123',
      refunded: false,
      sellerFullName: 'Seller One',
      type: 'PAYOUT' as const,
    },
  ],
  pagination: { ...emptyPage.pagination, lastPage: 1, total: 4 },
};

function renderPage({ staleTime = 0 }: { staleTime?: number } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Payouts />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin payout eligibility page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (createObjectURLDescriptor) {
      Object.defineProperty(URL, 'createObjectURL', createObjectURLDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (revokeObjectURLDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', revokeObjectURLDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    payoutService.listAdminBuyerRefunds.mockResolvedValue(buyerRefundResponse);
    payoutService.listAdminPayoutSellers.mockResolvedValue(sellerSummaryResponse);
    payoutService.listAdminSellerPayments.mockResolvedValue(emptyPage);
    payoutService.getAdminSellerPayment.mockResolvedValue(sellerPaymentDetailsResponse);
    payoutService.getAdminSellerPayable.mockResolvedValue(sellerPayablePreviewResponse);
    payoutService.listAdminPayoutTransactions.mockResolvedValue(emptyPage);
  });

  it('shows the five payout tabs by seller first without the run-based flow', async () => {
    renderPage();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map(tab => tab.textContent)).toEqual([
      'By seller',
      'Transactions',
      'Buyer refunds',
      'Payout history',
      'Period report',
    ]);
    expect(tabs[0]).toHaveAttribute('data-state', 'active');
    expect(
      screen.getByText(/sales become payable after the buyer confirms receipt/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/generate.*run|5% commission/i)).not.toBeInTheDocument();
    expect(payoutService.listAdminPayoutSellers).toHaveBeenCalled();
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
  it('explains each finance review reason and disables payout for reviewed sellers', async () => {
    payoutService.listAdminPayoutSellers.mockResolvedValue({
      ...sellerSummaryResponse,
      data: [
        {
          ...sellerSummaryResponse.data[0],
          sellerId: 'seller-unallocated-payment',
          sellerFullName: 'Unallocated Seller',
          balanceDue: null,
          payableStatus: 'REVIEW_REQUIRED' as const,
          reviewReason: 'UNALLOCATED_PAID_AMOUNT' as const,
        },
        {
          ...sellerSummaryResponse.data[0],
          sellerId: 'seller-incomplete-adjustment',
          sellerFullName: 'Adjustment Seller',
          balanceDue: 1000,
          payableStatus: 'REVIEW_REQUIRED' as const,
          reviewReason: 'INCOMPLETE_ACCOUNTING_ADJUSTMENT' as const,
        },
        {
          ...sellerSummaryResponse.data[0],
          sellerId: 'seller-incomplete-calculation',
          sellerFullName: 'Calculation Seller',
          balanceDue: null,
          payableStatus: 'REVIEW_REQUIRED' as const,
          reviewReason: 'INCOMPLETE_PAYABLE_CALCULATION' as const,
        },
        {
          ...sellerSummaryResponse.data[0],
          sellerId: 'seller-payable',
          sellerFullName: 'Payable Seller',
        },
      ],
      pagination: { ...sellerSummaryResponse.pagination, total: 4 },
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'By seller' }), { button: 0 });

    const reviewedSellers = [
      ['Unallocated Seller', 'Unallocated paid amount'],
      ['Adjustment Seller', 'Incomplete accounting adjustment'],
      ['Calculation Seller', 'Incomplete payable calculation'],
    ] as const;
    for (const [sellerName, reasonLabel] of reviewedSellers) {
      const row = screen.getByRole('row', { name: new RegExp(sellerName) });
      expect(within(row).getByText(reasonLabel)).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'Record payout' })).toBeDisabled();
    }

    const unallocatedRow = screen.getByRole('row', { name: /Unallocated Seller/ });
    expect(within(unallocatedRow).getAllByRole('cell')[4]).toHaveTextContent('—');
    const payableRow = screen.getByRole('row', { name: /Payable Seller/ });
    expect(within(payableRow).getByRole('button', { name: 'Record payout' })).toBeEnabled();
  });

  it('shows a late finance review refusal and refreshes seller payment states', async () => {
    const reviewRequiredError = new HTTPError(
      new Response(
        JSON.stringify({
          statusCode: 422,
          code: 'APP_SELLER_PAYOUT_REVIEW_REQUIRED',
          message: 'Seller payment requires finance review.',
          reviewReason: 'INCOMPLETE_PAYABLE_CALCULATION',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 422 },
      ),
      new Request('http://localhost/api/v1/admin/payouts/sellers/seller-1/payment'),
      {} as never,
    );
    let sellerSummaryRequests = 0;
    payoutService.listAdminPayoutSellers.mockImplementation(async () => {
      sellerSummaryRequests += 1;
      if (sellerSummaryRequests === 1) return sellerSummaryResponse;

      return {
        ...sellerSummaryResponse,
        data: [
          {
            ...sellerSummaryResponse.data[0],
            balanceDue: null,
            payableStatus: 'REVIEW_REQUIRED' as const,
            reviewReason: 'INCOMPLETE_PAYABLE_CALCULATION' as const,
          },
          {
            ...sellerSummaryResponse.data[1],
            balanceDue: 2500,
            payableStatus: 'PAYABLE' as const,
            reviewReason: null,
          },
        ],
      };
    });
    payoutService.recordAdminSellerPayment.mockRejectedValue(reviewRequiredError);
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

    expect(
      await within(dialog).findByText(/requires finance review: incomplete payable calculation/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save payout' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    const reviewedRow = await screen.findByRole('row', { name: /Seller One/ });
    expect(within(reviewedRow).getByText('Incomplete payable calculation')).toBeInTheDocument();
    expect(within(reviewedRow).getByRole('button', { name: 'Record payout' })).toBeDisabled();
    const otherSellerRow = screen.getByRole('row', { name: /Seller Two/ });
    expect(within(otherSellerRow).getByRole('button', { name: 'Record payout' })).toBeEnabled();
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

  it('shows sales and payouts with refunded and incentive details in Transactions', async () => {
    payoutService.listAdminPayoutTransactions.mockResolvedValue(transactionResponse);
    renderPage();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });

    expect(await screen.findByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Seller' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Reference' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();

    expect(screen.getAllByText('Sale')).toHaveLength(3);
    expect(screen.getByText('Payout')).toBeInTheDocument();
    expect(screen.getByText('Seller incentive bonus')).toBeInTheDocument();
    expect(screen.getByText('+Rs 8,500.00')).toBeInTheDocument();
    expect(screen.getByText('-Rs 3,000.00')).toHaveClass('text-destructive');

    const refundedRow = screen.getByRole('row', { name: /Leather bag/ });
    expect(within(refundedRow).getByText('Refunded')).toBeInTheDocument();
    expect(refundedRow).toHaveClass('bg-destructive/5');
    expect(within(refundedRow).getByText('+Rs 0.00')).toHaveClass('line-through');
  });

  it('filters Transactions through the server by seller', async () => {
    payoutService.listAdminPayoutTransactions.mockImplementation(async parameters => ({
      ...transactionResponse,
      data: parameters.sellerId
        ? transactionResponse.data.filter(item => item.sellerId === parameters.sellerId)
        : transactionResponse.data,
    }));
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });
    expect(await screen.findByText('Leather bag')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Seller Two' }));

    expect(await screen.findByText('Leather bag')).toBeInTheDocument();
    await waitFor(() =>
      expect(payoutService.listAdminPayoutTransactions).toHaveBeenCalledWith({
        page: 1,
        sellerId: 'seller-2',
        size: 20,
      }),
    );
    expect(screen.queryByText('Vintage jacket')).not.toBeInTheDocument();
  });

  it('exports every transaction page for the selected seller using the reference CSV columns', async () => {
    const selectedSellerTransactions = [
      {
        ...transactionResponse.data[0],
        description: 'Jacket "Special"',
        reference: 'sale,"one"',
        sellerFullName: 'Seller Two',
        sellerId: 'seller-2',
      },
      {
        ...transactionResponse.data[3],
        sellerFullName: 'Seller Two',
        sellerId: 'seller-2',
      },
    ];
    payoutService.listAdminPayoutTransactions.mockImplementation(async ({ page, sellerId }) => {
      if (sellerId !== 'seller-2') return transactionResponse;

      return {
        ...transactionResponse,
        data: [selectedSellerTransactions[page === 1 ? 0 : 1]],
        pagination: {
          ...transactionResponse.pagination,
          currentPage: page,
          lastPage: 2,
          nextPage: page === 1 ? 2 : null,
          prevPage: page === 2 ? 1 : null,
          total: 2,
        },
      };
    });
    const createObjectUrl = vi.fn().mockReturnValue('blob:transactions');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
      writable: true,
    });
    const downloadedFiles: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedFiles.push(this.download);
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Seller Two' }));
    await screen.findByText('Leather bag');

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledTimes(1));

    const csvFile = createObjectUrl.mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Expected CSV text.'));
      });
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsText(csvFile);
    });
    expect(csv).toBe(
      '"Date","Type","Seller","Amount (PKR)","Description","Reference"\n' +
        '"2026-09-18 15:30","sale","Seller Two","8500.00","Jacket ""Special""","sale,""one"""\n' +
        '"2026-09-16 15:30","payout","Seller Two","-3000.00","Payout · bank transfer","PAY-123"',
    );
    expect(downloadedFiles).toHaveLength(1);
    expect(downloadedFiles[0]).toMatch(/^payout-transactions-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(payoutService.listAdminPayoutTransactions).toHaveBeenCalledWith({
      page: 2,
      sellerId: 'seller-2',
      size: 20,
    });
  });

  it('shows export progress and disables the button until all pages are ready', async () => {
    let resolveSecondPage!: (response: typeof transactionResponse) => void;
    payoutService.listAdminPayoutTransactions.mockImplementation(async ({ page }) =>
      page === 1
        ? {
            ...transactionResponse,
            pagination: { ...transactionResponse.pagination, lastPage: 2, nextPage: 2 },
          }
        : new Promise(resolve => {
            resolveSecondPage = resolve;
          }),
    );
    const createObjectUrl = vi.fn().mockReturnValue('blob:transactions');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
      writable: true,
    });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    const exportingButton = await screen.findByRole('button', { name: 'Exporting…' });
    expect(exportingButton).toBeDisabled();
    expect(createObjectUrl).not.toHaveBeenCalled();

    resolveSecondPage(transactionResponse);
    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('shows an export error and does not download partial results when a page fails', async () => {
    payoutService.listAdminPayoutTransactions.mockImplementation(async ({ page }) => {
      if (page === 2) throw new Error('Transactions page unavailable');

      return {
        ...transactionResponse,
        pagination: { ...transactionResponse.pagination, lastPage: 2, nextPage: 2 },
      };
    });
    const createObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
      writable: true,
    });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(
      await screen.findByText('Could not export transactions. Please try again.'),
    ).toBeInTheDocument();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('exports only the CSV header when no transactions match', async () => {
    payoutService.listAdminPayoutTransactions.mockResolvedValue(emptyPage);
    const createObjectUrl = vi.fn().mockReturnValue('blob:transactions');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
      writable: true,
    });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledTimes(1));

    const csvFile = createObjectUrl.mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Expected CSV text.'));
      });
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsText(csvFile);
    });
    expect(csv).toBe('"Date","Type","Seller","Amount (PKR)","Description","Reference"');
  });

  it('offers sellers beyond the current summary page in the Transactions filter', async () => {
    const visibleSellerSummaries = Array.from({ length: 20 }, (_, index) => ({
      ...sellerSummaryResponse.data[0],
      sellerId: `page-seller-${index + 1}`,
      sellerFullName: `Page Seller ${index + 1}`,
    }));
    const laterSeller = {
      ...sellerSummaryResponse.data[1],
      sellerId: 'seller-21',
      sellerFullName: 'Seller Twenty One',
    };
    payoutService.listAdminPayoutSellers.mockImplementation(async ({ size }) =>
      size === 100
        ? {
            ...sellerSummaryResponse,
            data: [...visibleSellerSummaries, laterSeller],
            pagination: { ...sellerSummaryResponse.pagination, lastPage: 1, total: 21 },
          }
        : {
            ...sellerSummaryResponse,
            data: visibleSellerSummaries,
            pagination: { ...sellerSummaryResponse.pagination, lastPage: 2, total: 21 },
          },
    );
    payoutService.listAdminPayoutTransactions.mockImplementation(async ({ sellerId }) => ({
      ...transactionResponse,
      data: sellerId ? [] : transactionResponse.data,
    }));
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Seller Twenty One' }));

    await waitFor(() =>
      expect(payoutService.listAdminPayoutTransactions).toHaveBeenCalledWith({
        page: 1,
        sellerId: 'seller-21',
        size: 20,
      }),
    );
  });

  it('moves through server pages of transactions', async () => {
    payoutService.listAdminPayoutTransactions.mockImplementation(async ({ page }) =>
      page === 1
        ? {
            ...transactionResponse,
            data: [transactionResponse.data[0]],
            pagination: {
              ...transactionResponse.pagination,
              currentPage: 1,
              lastPage: 2,
              nextPage: 2,
              total: 2,
            },
          }
        : {
            ...transactionResponse,
            data: [transactionResponse.data[2]],
            pagination: {
              ...transactionResponse.pagination,
              currentPage: 2,
              lastPage: 2,
              nextPage: null,
              prevPage: 1,
              total: 2,
            },
          },
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });
    expect(await screen.findByText('Vintage jacket')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(payoutService.listAdminPayoutTransactions).toHaveBeenCalledWith({
        page: 2,
        size: 20,
      }),
    );
    expect(await screen.findByText('Page 2 of 2 · 2 transactions')).toBeInTheDocument();
    expect(await screen.findByText('Leather bag')).toBeInTheDocument();
    expect(screen.queryByText('Vintage jacket')).not.toBeInTheDocument();
  });

  it('shows loading while Transactions are being fetched', async () => {
    let resolveTransactions!: (response: typeof transactionResponse) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.listAdminPayoutTransactions.mockReturnValue(
      new Promise(resolve => {
        resolveTransactions = resolve;
      }),
    );
    renderPage();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });
    expect(await screen.findByText('Loading transactions…')).toBeInTheDocument();

    resolveTransactions(transactionResponse);
    expect((await screen.findAllByText('Vintage jacket')).length).toBe(2);
  });

  it('shows no transactions when the server returns an empty page', async () => {
    payoutService.listAdminPayoutTransactions.mockResolvedValue(emptyPage);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });

    expect(await screen.findByText('No transactions.')).toBeInTheDocument();
  });

  it('shows a retryable error when Transactions cannot be loaded', async () => {
    payoutService.listAdminPayoutTransactions
      .mockRejectedValueOnce(new Error('Transactions unavailable'))
      .mockResolvedValueOnce(transactionResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Transactions' }), { button: 0 });

    expect(await screen.findByText(/could not load transactions/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect((await screen.findAllByText('Vintage jacket')).length).toBe(2);
  });

  it('lists refunded complaints from the refund report, newest first', async () => {
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Buyer refunds' }), { button: 0 });

    expect(await screen.findByText('Buyer One')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Buyer' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Order' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
    expect(screen.getByText('Vintage jacket')).toBeInTheDocument();
    expect(screen.getByText('Order order-12')).toBeInTheDocument();
    expect(screen.getByText('Rs 1,800.00')).toBeInTheDocument();

    const refundRows = screen.getAllByRole('row');
    expect(refundRows[1]).toHaveTextContent('Oct 10, 2026');
    expect(refundRows[2]).toHaveTextContent('Oct 8, 2026');
    expect(refundRows[1]).toHaveTextContent('Buyer One');
    expect(screen.queryByRole('button', { name: /mark.*refund.*paid/i })).not.toBeInTheDocument();
  });

  it('shows loading while buyer refunds are being fetched', async () => {
    let resolveRefunds!: (response: typeof buyerRefundResponse) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.listAdminBuyerRefunds.mockReturnValue(
      new Promise(resolve => {
        resolveRefunds = resolve;
      }),
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Buyer refunds' }), { button: 0 });

    expect(await screen.findByText('Loading buyer refunds…')).toBeInTheDocument();
    resolveRefunds({ ...buyerRefundResponse, data: [] });
    expect(await screen.findByText('No buyer refunds.')).toBeInTheDocument();
  });

  it('moves through server pages of buyer refunds', async () => {
    payoutService.listAdminBuyerRefunds.mockImplementation(async ({ page }) =>
      page === 1
        ? {
            ...buyerRefundResponse,
            data: [buyerRefundResponse.data[0]],
            pagination: {
              ...buyerRefundResponse.pagination,
              currentPage: 1,
              lastPage: 2,
              nextPage: 2,
              total: 2,
            },
          }
        : {
            ...buyerRefundResponse,
            data: [buyerRefundResponse.data[1]],
            pagination: {
              ...buyerRefundResponse.pagination,
              currentPage: 2,
              lastPage: 2,
              nextPage: null,
              prevPage: 1,
              total: 2,
            },
          },
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Buyer refunds' }), { button: 0 });
    expect(await screen.findByText('Buyer One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Page 2 of 2 · 2 buyer refunds')).toBeInTheDocument();
    expect(await screen.findByText('Buyer Two')).toBeInTheDocument();
    expect(screen.queryByText('Buyer One')).not.toBeInTheDocument();
  });

  it('shows a retryable error when buyer refunds cannot be loaded', async () => {
    payoutService.listAdminBuyerRefunds
      .mockRejectedValueOnce(new Error('Buyer refunds unavailable'))
      .mockResolvedValueOnce(buyerRefundResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Buyer refunds' }), { button: 0 });

    expect(await screen.findByText(/could not load buyer refunds/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Buyer One')).toBeInTheDocument();
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

  it('shows all seller payments in payout history without a seller filter', async () => {
    payoutService.listAdminSellerPayments.mockResolvedValue(sellerPaymentsResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });

    expect(await screen.findByText('Seller One')).toBeInTheDocument();
    expect(screen.queryByText('Filter by seller')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(payoutService.listAdminSellerPayments).toHaveBeenCalledWith({ page: 1, size: 20 });
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

  it('loads every period report page with server date filters and merges rows newest first', async () => {
    payoutService.listAdminSellerPayments.mockImplementation(async parameters => {
      const isFirstPage = parameters.page === 1;
      return {
        ...sellerPaymentsResponse,
        data: [
          isFirstPage
            ? { ...sellerPaymentsResponse.data[0], paidAt: '2026-09-29T10:00:00.000Z' }
            : { ...sellerPaymentsResponse.data[1], paidAt: '2026-09-03T10:00:00.000Z' },
        ],
        pagination: {
          ...emptyPage.pagination,
          currentPage: parameters.page,
          lastPage: 2,
          nextPage: isFirstPage ? 2 : null,
          perPage: 100,
          prevPage: isFirstPage ? null : 1,
          total: 2,
        },
      };
    });
    payoutService.listAdminBuyerRefunds.mockImplementation(async parameters => {
      const isFirstPage = parameters.page === 1;
      return {
        ...buyerRefundResponse,
        data: [
          isFirstPage
            ? { ...buyerRefundResponse.data[0], date: '2026-09-27T12:00:00.000Z' }
            : { ...buyerRefundResponse.data[1], date: '2026-09-05T12:00:00.000Z' },
        ],
        pagination: {
          ...emptyPage.pagination,
          currentPage: parameters.page,
          lastPage: 2,
          nextPage: isFirstPage ? 2 : null,
          perPage: 100,
          prevPage: isFirstPage ? null : 1,
          total: 2,
        },
      };
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Period report' }), { button: 0 });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-30' } });

    expect(await screen.findByText('Leather bag')).toBeInTheDocument();
    expect(payoutService.listAdminSellerPayments).toHaveBeenCalledWith({
      page: 1,
      paidFrom: new Date('2026-09-01T00:00:00').toISOString(),
      paidTo: new Date('2026-09-30T23:59:59.999').toISOString(),
      size: 100,
    });
    expect(payoutService.listAdminSellerPayments).toHaveBeenCalledWith({
      page: 2,
      paidFrom: new Date('2026-09-01T00:00:00').toISOString(),
      paidTo: new Date('2026-09-30T23:59:59.999').toISOString(),
      size: 100,
    });
    expect(payoutService.listAdminBuyerRefunds).toHaveBeenCalledWith({
      page: 1,
      resolvedFrom: new Date('2026-09-01T00:00:00').toISOString(),
      resolvedTo: new Date('2026-09-30T23:59:59.999').toISOString(),
      size: 100,
    });
    expect(payoutService.listAdminBuyerRefunds).toHaveBeenCalledWith({
      page: 2,
      resolvedFrom: new Date('2026-09-01T00:00:00').toISOString(),
      resolvedTo: new Date('2026-09-30T23:59:59.999').toISOString(),
      size: 100,
    });
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Sep 29, 2026');
    expect(rows[2]).toHaveTextContent('Sep 27, 2026');
    expect(rows[3]).toHaveTextContent('Sep 5, 2026');
    expect(rows[4]).toHaveTextContent('Sep 3, 2026');
  });

  it('rejects an inverted period without requesting report pages', async () => {
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Period report' }), { button: 0 });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } });

    expect(screen.getByText('Period end must be on or after period start.')).toBeInTheDocument();
    expect(
      payoutService.listAdminSellerPayments.mock.calls.some(
        ([parameters]) => 'paidFrom' in parameters,
      ),
    ).toBe(false);
    expect(
      payoutService.listAdminBuyerRefunds.mock.calls.some(
        ([parameters]) => 'resolvedFrom' in parameters,
      ),
    ).toBe(false);
  });

  it('hides partial results and offers retry when a report page fails', async () => {
    payoutService.listAdminSellerPayments.mockImplementation(async parameters => {
      if (!('paidFrom' in parameters)) return emptyPage;
      if (parameters.page === 2) throw new Error('Page unavailable');
      return {
        ...sellerPaymentsResponse,
        pagination: { ...sellerPaymentsResponse.pagination, lastPage: 2 },
      };
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Period report' }), { button: 0 });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-30' } });

    expect(
      await screen.findByText('Could not load the period report. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('BANK-7200')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(
        payoutService.listAdminSellerPayments.mock.calls.filter(
          ([parameters]) => parameters.page === 2 && 'paidFrom' in parameters,
        ).length,
      ).toBeGreaterThan(1),
    );
  });

  it('selects report rows by default and exports only the selected rows', async () => {
    let exportedBlob: Blob | undefined;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        exportedBlob = blob;
        return 'blob:period-report';
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    payoutService.listAdminSellerPayments.mockResolvedValue({
      ...sellerPaymentsResponse,
      data: [
        { ...sellerPaymentsResponse.data[0], paidAt: '2026-09-29T10:00:00.000Z' },
        { ...sellerPaymentsResponse.data[1], paidAt: '2026-09-03T10:00:00.000Z' },
      ],
    });
    payoutService.listAdminBuyerRefunds.mockResolvedValue({
      ...buyerRefundResponse,
      data: [
        { ...buyerRefundResponse.data[0], date: '2026-09-27T12:00:00.000Z' },
        { ...buyerRefundResponse.data[1], date: '2026-09-05T12:00:00.000Z' },
      ],
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Period report' }), { button: 0 });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-30' } });

    expect(await screen.findByText('4 of 4 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(screen.getByText('0 of 4 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Vintage jacket' }));
    expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export selected' }));

    expect(exportedBlob).toBeDefined();
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error);
      reader.readAsText(exportedBlob!);
    });
    expect(csv).toContain('"refund","Buyer One","Vintage jacket"');
    expect(csv).not.toContain('"payout"');
    expect(csv).not.toContain('"Leather bag"');
  });

  it('selects all report rows again when the date range changes', async () => {
    payoutService.listAdminSellerPayments.mockResolvedValue({
      ...sellerPaymentsResponse,
      data: [{ ...sellerPaymentsResponse.data[0], paidAt: '2026-09-15T10:00:00.000Z' }],
    });
    payoutService.listAdminBuyerRefunds.mockResolvedValue({ ...buyerRefundResponse, data: [] });
    renderPage({ staleTime: Infinity });
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Period report' }), { button: 0 });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-30' } });

    expect(await screen.findByText('1 of 1 selected')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-02' } });
    expect(await screen.findByText('1 of 1 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Payout · bank transfer' }));
    expect(screen.getByText('0 of 1 selected')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });

    expect(await screen.findByText('1 of 1 selected')).toBeInTheDocument();
  });

  it('shows loading and empty states while payout history loads', async () => {
    let resolvePayments!: (response: typeof emptyPage) => void;
    // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
    payoutService.listAdminSellerPayments.mockReturnValue(
      new Promise(resolve => {
        resolvePayments = resolve;
      }),
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });

    expect(screen.getByText('Loading payout history…')).toBeInTheDocument();
    resolvePayments(emptyPage);

    expect(await screen.findByText('No payouts recorded yet.')).toBeInTheDocument();
  });

  it('shows ledger and legacy payments in server order with empty legacy fields', async () => {
    payoutService.listAdminBuyerRefunds.mockResolvedValue(emptyPage);
    payoutService.listAdminSellerPayments.mockResolvedValue(sellerPaymentsResponse);
    renderPage();

    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });

    expect(await screen.findByText('Seller One')).toBeInTheDocument();
    expect(payoutService.listAdminSellerPayments).toHaveBeenCalledWith({ page: 1, size: 20 });
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Seller One');
    expect(rows[2]).toHaveTextContent('Seller Two');
    expect(rows[1]).toHaveTextContent('Nov 1, 2026');
    expect(rows[1]).toHaveTextContent('2026-10-01 → 2026-10-31');
    expect(rows[1]).toHaveTextContent('Bank Transfer');
    expect(rows[1]).toHaveTextContent('BANK-7200');
    expect(rows[2]).toHaveTextContent('—');
    expect(rows[2]).toHaveTextContent('Rs 1,800.00');
    expect(screen.queryByRole('button', { name: 'Record payout' })).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Buyer refunds' }), { button: 0 });
    expect(await screen.findByText('No buyer refunds.')).toBeInTheDocument();
  });

  it('opens accessible payout details with the recorded split and settled items', async () => {
    payoutService.listAdminSellerPayments.mockResolvedValue(sellerPaymentsResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    const paymentRow = await screen.findByRole('row', { name: /Seller One/ });

    expect(paymentRow).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(paymentRow, { key: 'Enter' });

    const dialog = await screen.findByRole('dialog', { name: 'Payout details' });
    expect(
      await within(dialog).findByText(/Seller One · Rs 9,700.00 · Nov 1, 2026/),
    ).toBeInTheDocument();
    expect(payoutService.getAdminSellerPayment).toHaveBeenCalledWith('payment-newest');
    expect(within(dialog).getByText('Bank Transfer')).toBeInTheDocument();
    expect(within(dialog).getByText('2026-10-01 → 2026-10-31')).toBeInTheDocument();
    expect(within(dialog).getByText('BANK-7200')).toBeInTheDocument();
    expect(within(dialog).getByText('October transfer')).toBeInTheDocument();
    expect(within(dialog).getByText('Base payout')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Rs 7,200.00')).toHaveLength(2);
    expect(within(dialog).getAllByText('Seller incentive bonus')).toHaveLength(2);
    expect(within(dialog).getAllByText('Rs 2,500.00')).toHaveLength(2);
    expect(within(dialog).getByText('Leather jacket')).toBeInTheDocument();
    expect(within(dialog).getByText('Buyer One')).toBeInTheDocument();
    expect(within(dialog).getByText('Order 12345678')).toBeInTheDocument();
    expect(within(dialog).getByText('Refunded')).toBeInTheDocument();
    expect(within(dialog).getByText('Refunded coat').closest('tr')).toHaveClass('bg-destructive/5');
  });

  it('explains when legacy payments have no item breakdown', async () => {
    payoutService.listAdminSellerPayments.mockResolvedValue({
      ...sellerPaymentsResponse,
      data: [sellerPaymentsResponse.data[1]],
    });
    payoutService.getAdminSellerPayment.mockResolvedValue({
      ...sellerPaymentDetailsResponse,
      data: {
        ...sellerPaymentDetailsResponse.data,
        id: 'payment-legacy',
        sellerId: 'seller-2',
        sellerFullName: 'Seller Two',
        amount: 1800,
        baseAmount: null,
        sellerIncentiveBonusAmount: null,
        method: null,
        periodStart: null,
        periodEnd: null,
        reference: null,
        notes: null,
        source: 'LEGACY' as const,
        itemsAvailable: false,
        items: [],
      },
    });
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    fireEvent.click(await screen.findByRole('row', { name: /Seller Two/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Payout details' });
    expect(
      await within(dialog).findByText('No item breakdown is available for this payment.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('columnheader', { name: 'Item' })).not.toBeInTheDocument();
  });

  it('offers retry for payout detail failures and explains when a payment is missing', async () => {
    const missingPaymentError = new HTTPError(
      new Response(JSON.stringify({ message: 'Payment not found.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      }),
      new Request('http://localhost/api/v1/admin/payouts/payments/payment-newest'),
      {} as never,
    );
    payoutService.listAdminSellerPayments.mockResolvedValue(sellerPaymentsResponse);
    payoutService.getAdminSellerPayment
      .mockRejectedValueOnce(new Error('Payout detail request failed'))
      .mockRejectedValueOnce(missingPaymentError);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    fireEvent.click(await screen.findByRole('row', { name: /Seller One/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Payout details' });
    expect(await within(dialog).findByText(/Could not load payout details/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));

    expect(
      await within(dialog).findByText('This payment is no longer available.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('moves through server pages of payout history', async () => {
    payoutService.listAdminSellerPayments.mockImplementation(async ({ page }) =>
      page === 1
        ? {
            ...sellerPaymentsResponse,
            data: [sellerPaymentsResponse.data[0]],
            pagination: {
              ...sellerPaymentsResponse.pagination,
              currentPage: 1,
              lastPage: 2,
              nextPage: 2,
              total: 2,
            },
          }
        : {
            ...sellerPaymentsResponse,
            data: [sellerPaymentsResponse.data[1]],
            pagination: {
              ...sellerPaymentsResponse.pagination,
              currentPage: 2,
              lastPage: 2,
              nextPage: null,
              prevPage: 1,
              total: 2,
            },
          },
    );
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });
    expect(await screen.findByText('Seller One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Seller Two')).toBeInTheDocument();
    expect(payoutService.listAdminSellerPayments).toHaveBeenCalledWith({ page: 2, size: 20 });
    expect(screen.getByText('Page 2 of 2 · 2 payments')).toBeInTheDocument();
  });

  it('shows a retryable error when payout history cannot be loaded', async () => {
    payoutService.listAdminSellerPayments
      .mockRejectedValueOnce(new Error('Payout history unavailable'))
      .mockResolvedValueOnce(sellerPaymentsResponse);
    renderPage();
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Payout history' }), { button: 0 });

    expect(await screen.findByText(/could not load payout history/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Seller One')).toBeInTheDocument();
  });
});
