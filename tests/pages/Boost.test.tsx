import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Boost from '@/pages/Boost';

const {
  getPaymentInstructionsMock,
  listBoostableListingsMock,
  listMyBoostPurchasesMock,
  listMyBoostsMock,
  resubmitBoostPaymentProofMock,
  startPayFastBoostCheckoutMock,
  uploadPaymentProofMock,
} = vi.hoisted(() => ({
  getPaymentInstructionsMock: vi.fn(),
  listBoostableListingsMock: vi.fn(),
  listMyBoostPurchasesMock: vi.fn(),
  listMyBoostsMock: vi.fn(),
  resubmitBoostPaymentProofMock: vi.fn(),
  startPayFastBoostCheckoutMock: vi.fn(),
  uploadPaymentProofMock: vi.fn(),
}));

vi.mock('@/services/clientBoost.service', () => ({
  listBoostableListings: listBoostableListingsMock,
  listMyBoostPurchases: listMyBoostPurchasesMock,
  listMyBoosts: listMyBoostsMock,
  resubmitBoostPaymentProof: resubmitBoostPaymentProofMock,
  startPayFastBoostCheckout: startPayFastBoostCheckoutMock,
}));

vi.mock('@/services/checkout.service', () => ({
  cancelOrder: vi.fn(),
  createOrder: vi.fn(),
  getPaymentInstructions: getPaymentInstructionsMock,
  quoteCheckout: vi.fn(),
  resubmitManualPayment: vi.fn(),
  uploadPaymentProof: uploadPaymentProofMock,
}));

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

function renderBoostPage(path = '/boost') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Boost />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('seller boost status', () => {
  beforeEach(() => {
    listMyBoostPurchasesMock.mockReset().mockResolvedValue({
      data: [],
      message: 'Boost purchases fetched.',
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 0,
      },
      statusCode: 200,
    });
    getPaymentInstructionsMock.mockReset().mockResolvedValue({
      data: {
        accountIban: 'PK00 1234',
        accountNumber: '123456789',
        accountTitle: 'Sunday Store',
        bankOrWalletLabel: 'Example Bank',
      },
      message: 'Payment instructions fetched.',
      statusCode: 200,
    });
    uploadPaymentProofMock.mockReset().mockResolvedValue({
      data: { id: 'replacement-proof-id' },
      message: 'Proof uploaded.',
      statusCode: 201,
    });
    resubmitBoostPaymentProofMock.mockReset().mockResolvedValue({
      data: {
        boostPurchaseId: 'purchase-resubmit',
        paymentInstructions: {
          accountIban: 'PK00 1234',
          accountNumber: '123456789',
          accountTitle: 'Sunday Store',
          bankOrWalletLabel: 'Example Bank',
        },
        paymentSubmission: {
          id: 'submission-2',
          proofFileId: 'replacement-proof-id',
          status: 'SUBMITTED',
          createdAt: '2026-10-18T10:00:00.000Z',
        },
        status: 'PENDING_REVIEW',
      },
      message: 'Replacement proof submitted.',
      statusCode: 200,
    });
    listMyBoostsMock.mockReset().mockResolvedValue({
      data: [
        {
          id: 'boost-1',
          boostPurchaseId: 'purchase-1',
          listingId: 'listing-1',
          packageId: 'package-1',
          sellerId: 'seller-1',
          durationDays: 7,
          isActive: false,
          packageName: 'One week',
          paymentStatus: 'PENDING',
          placement: 'FOR_YOU',
          pricePaid: 2100,
          endsAt: '2026-10-25T08:00:00.000Z',
          startsAt: '2026-10-18T08:00:00.000Z',
          createdAt: '2026-10-18T08:00:00.000Z',
          updatedAt: '2026-10-18T08:00:00.000Z',
        },
      ],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 1,
      },
    });
    listBoostableListingsMock.mockResolvedValue({
      data: [
        {
          id: 'listing-1',
          coverImage: { url: '/listing.png' },
          price: 10_000,
          title: 'Leather Tote',
        },
      ],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 1,
      },
    });
  });

  it('shows a pending purchase as awaiting review without counting it as active', async () => {
    listMyBoostPurchasesMock.mockResolvedValue({
      data: [
        {
          id: 'purchase-1',
          amount: 2100,
          boosts: [
            {
              id: 'boost-1',
              boostPurchaseId: 'purchase-1',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 2100,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: { reviewNote: null, status: 'SUBMITTED', reviewedAt: null },
          status: 'PENDING_REVIEW',
          refundCompletedAt: null,
        },
      ],
      message: 'Boost purchases fetched.',
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 1,
      },
      statusCode: 200,
    });
    renderBoostPage();

    expect(await screen.findByRole('heading', { name: 'Active Boosts (0)' })).toBeInTheDocument();
    expect(await screen.findByText('Awaiting payment review')).toBeInTheDocument();
    expect(await screen.findAllByText('Leather Tote')).toHaveLength(2);
  });

  it('shows purchase decisions and offers resubmission only when replacement proof is requested', async () => {
    const activeWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeWindowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    listMyBoostPurchasesMock.mockResolvedValue({
      data: [
        {
          id: 'purchase-pending',
          amount: 600,
          boosts: [
            {
              id: 'boost-pending',
              boostPurchaseId: 'purchase-pending',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 600,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: { reviewNote: null, status: 'SUBMITTED', reviewedAt: null },
          status: 'PENDING_REVIEW',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-active',
          amount: 2000,
          boosts: [
            {
              id: 'boost-active',
              boostPurchaseId: 'purchase-active',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: true,
              packageName: 'One week',
              paymentStatus: 'PAID',
              placement: 'FOR_YOU',
              pricePaid: 2000,
              endsAt: activeWindowEnd,
              startsAt: activeWindowStart,
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: {
            reviewNote: 'Payment verified.',
            status: 'APPROVED',
            reviewedAt: '2026-10-18T09:00:00.000Z',
          },
          status: 'APPROVED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-rejected',
          amount: 1500,
          boosts: [
            {
              id: 'boost-rejected',
              boostPurchaseId: 'purchase-rejected',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 1500,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: {
            reviewNote: 'Receipt is unclear.',
            status: 'REJECTED',
            reviewedAt: '2026-10-18T09:00:00.000Z',
          },
          status: 'REJECTED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-resubmit',
          amount: 800,
          boosts: [
            {
              id: 'boost-resubmit',
              boostPurchaseId: 'purchase-resubmit',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 800,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: {
            reviewNote: 'Please provide a clearer receipt.',
            status: 'RESUBMISSION_REQUESTED',
            reviewedAt: '2026-10-18T09:00:00.000Z',
          },
          status: 'RESUBMISSION_REQUESTED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-refund-required',
          amount: 1200,
          boosts: [
            {
              id: 'boost-refund-required',
              boostPurchaseId: 'purchase-refund-required',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 1200,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: {
            reviewNote: 'Listing is no longer eligible.',
            status: 'APPROVED',
            reviewedAt: '2026-10-18T09:00:00.000Z',
          },
          status: 'REFUND_REQUIRED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-refunded',
          amount: 700,
          boosts: [
            {
              id: 'boost-refunded',
              boostPurchaseId: 'purchase-refunded',
              listingId: 'listing-1',
              packageId: 'package-1',
              sellerId: 'seller-1',
              durationDays: 7,
              isActive: false,
              packageName: 'One week',
              paymentStatus: 'PENDING',
              placement: 'FOR_YOU',
              pricePaid: 700,
              endsAt: '2026-10-25T08:00:00.000Z',
              startsAt: '2026-10-18T08:00:00.000Z',
              createdAt: '2026-10-18T08:00:00.000Z',
              updatedAt: '2026-10-18T08:00:00.000Z',
            },
          ],
          paymentSubmission: {
            reviewNote: 'Listing is no longer eligible.',
            status: 'APPROVED',
            reviewedAt: '2026-10-18T09:00:00.000Z',
          },
          status: 'REFUNDED',
          refundCompletedAt: '2026-10-19T10:00:00.000Z',
        },
      ],
      message: 'Boost purchases fetched.',
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 6,
      },
      statusCode: 200,
    });

    renderBoostPage();

    expect(await screen.findByText('Boost Purchase History')).toBeInTheDocument();
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(await screen.findAllByText('Awaiting payment review')).toHaveLength(1);
    expect(await screen.findByText('Rejected')).toBeInTheDocument();
    expect(await screen.findByText('Refund required')).toBeInTheDocument();
    expect(await screen.findByText('Refunded')).toBeInTheDocument();
    expect(await screen.findByText(/Please provide a clearer receipt/)).toBeInTheDocument();
    expect(await screen.findAllByText(/Reviewed/)).toHaveLength(5);
    expect(screen.getByText(/Refund completed/)).toBeInTheDocument();
    const resubmitButton = screen.getByRole('button', { name: 'Resubmit payment proof' });
    expect(screen.getAllByText(/Rs/).length).toBeGreaterThanOrEqual(4);

    fireEvent.click(resubmitButton);
    const paymentDialog = await screen.findByRole('dialog');
    expect(
      within(paymentDialog).getByRole('heading', { name: 'Resubmit payment proof' }),
    ).toBeInTheDocument();
    expect(await within(paymentDialog).findByText('Sunday Store')).toBeInTheDocument();
    fireEvent.change(within(paymentDialog).getByLabelText('Bank or wallet name'), {
      target: { value: 'Example Bank' },
    });
    fireEvent.change(within(paymentDialog).getByLabelText('Sender account title/name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(within(paymentDialog).getByLabelText('Sender account number'), {
      target: { value: '123456789' },
    });
    fireEvent.change(within(paymentDialog).getByLabelText('Transaction screenshot'), {
      target: { files: [new File(['proof'], 'replacement.png', { type: 'image/png' })] },
    });
    fireEvent.click(within(paymentDialog).getByRole('button', { name: 'Resubmit payment proof' }));

    await waitFor(() => expect(uploadPaymentProofMock).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(resubmitBoostPaymentProofMock).toHaveBeenCalledWith('listing-1', 'purchase-resubmit', {
        proofFileId: 'replacement-proof-id',
        senderAccountNumber: '123456789',
        senderAccountTitle: 'Jane Doe',
        senderBankName: 'Example Bank',
      }),
    );
  });

  it('lets sellers move through every page of purchase history', async () => {
    listMyBoostPurchasesMock.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve({
        data: [
          {
            id: `purchase-${page}`,
            amount: page === 1 ? 600 : 900,
            boosts: [],
            paymentSubmission: null,
            status: page === 1 ? 'PENDING_REVIEW' : 'REJECTED',
            refundCompletedAt: null,
          },
        ],
        message: 'Boost purchases fetched.',
        pagination: {
          currentPage: page,
          lastPage: 2,
          nextPage: page === 1 ? 2 : null,
          perPage: 100,
          prevPage: page === 1 ? null : 1,
          total: 2,
        },
        statusCode: 200,
      }),
    );

    renderBoostPage();

    expect(await screen.findByText('Awaiting payment review')).toBeInTheDocument();
    expect(screen.getByText('Showing page 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Showing page 2 of 2')).toBeInTheDocument();
    expect(listMyBoostPurchasesMock).toHaveBeenLastCalledWith({ page: 2, size: 100 });
  });
});

function boostWindow(
  startsAt: string,
  endsAt: string,
  paymentStatus: 'PENDING' | 'PAID',
  overrides: Partial<{
    createdAt: string;
    packageId: string | null;
    packageName: string | null;
  }> = {},
) {
  return {
    boostPurchaseId: 'purchase-pay',
    listingId: 'listing-1',
    packageId: null as string | null,
    sellerId: 'seller-1',
    durationDays: 3,
    isActive: false,
    packageName: null as string | null,
    paymentStatus,
    placement: 'SEARCH',
    pricePaid: 1000,
    endsAt,
    startsAt,
    createdAt: startsAt,
    updatedAt: startsAt,
    ...overrides,
  };
}

function packageBoostWindow(
  startsAt: string,
  endsAt: string,
  paymentStatus: 'PENDING' | 'PAID',
  createdAt: string,
) {
  return boostWindow(startsAt, endsAt, paymentStatus, {
    createdAt,
    packageId: 'package-1',
    packageName: 'One week',
  });
}

function purchaseFixture(
  overrides: Partial<{
    boosts: ReturnType<typeof boostWindow>[];
    id: string;
    paymentSubmission: { reviewNote: string | null; reviewedAt: string | null; status: string };
    status: string;
  }>,
) {
  const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  return {
    id: 'purchase-pay',
    amount: 1000,
    boosts: [boostWindow(createdAt, '2099-01-01T00:00:00.000Z', 'PENDING')],
    paymentSubmission: null,
    refundCompletedAt: null,
    status: 'PENDING_PAYMENT',
    ...overrides,
  };
}

function mockPurchases(data: unknown[]) {
  listMyBoostPurchasesMock.mockResolvedValue({
    data,
    message: 'Boost purchases fetched.',
    pagination: {
      currentPage: 1,
      lastPage: 1,
      nextPage: null,
      perPage: 100,
      prevPage: null,
      total: data.length,
    },
    statusCode: 200,
  });
}

describe('seller PayFast boost purchases', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PAYFAST_CHECKOUT_ENABLED', 'true');
    startPayFastBoostCheckoutMock.mockReset().mockResolvedValue({
      data: {
        accessToken: 'access-token',
        amount: 1000,
        basketId: 'BOOST-purchase-pay',
        currencyCode: 'PKR',
        fields: { BASKET_ID: 'BOOST-purchase-pay', TOKEN: 'access-token' },
        paymentUrl: 'https://payfast.example/checkout',
      },
      message: 'PayFast checkout created successfully.',
      statusCode: 200,
    });
    listMyBoostsMock.mockResolvedValue({
      data: [],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 0,
      },
    });
    listBoostableListingsMock.mockResolvedValue({
      data: [
        {
          id: 'listing-1',
          coverImage: { url: '/listing.png' },
          price: 10_000,
          title: 'Leather Tote',
        },
      ],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        nextPage: null,
        perPage: 100,
        prevPage: null,
        total: 1,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const form of document.querySelectorAll('body > form')) form.remove();
  });

  it('pays a pending boost through PayFast before its deadline without any proof upload', async () => {
    mockPurchases([purchaseFixture({})]);
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    renderBoostPage();

    expect(await screen.findByText('Awaiting PayFast payment')).toBeInTheDocument();
    expect(screen.getByText(/Pay by/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay with PayFast' }));

    await waitFor(() =>
      expect(startPayFastBoostCheckoutMock).toHaveBeenCalledWith({
        listingId: 'listing-1',
        purchaseId: 'purchase-pay',
      }),
    );
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(document.querySelector('input[name="BASKET_ID"]')).toHaveValue('BOOST-purchase-pay');
    expect(uploadPaymentProofMock).not.toHaveBeenCalled();
  });

  it('shows a pending boost past its 30 minute deadline as expired with no way to pay', async () => {
    const createdAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({ boosts: [boostWindow(createdAt, '2099-01-01T00:00:00.000Z', 'PENDING')] }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Payment expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay with PayFast' })).not.toBeInTheDocument();
  });

  it('does not treat a PayFast return as verified payment while the backend still reports pending', async () => {
    mockPurchases([purchaseFixture({})]);
    renderBoostPage('/boost?boostPurchaseId=purchase-pay');

    expect(
      await screen.findByText(/PayFast has not confirmed this payment yet/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/payment (has been )?confirmed/i)).not.toBeInTheDocument();
    expect(screen.getByText('Awaiting PayFast payment')).toBeInTheDocument();
  });

  it('shows a returned boost as active only once the backend has verified its payment', async () => {
    const startsAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({
        boosts: [boostWindow(startsAt, endsAt, 'PAID')],
        status: 'APPROVED',
      }),
    ]);
    renderBoostPage('/boost?boostPurchaseId=purchase-pay');

    expect(await screen.findByRole('heading', { name: 'Active Boosts (0)' })).toBeInTheDocument();
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(
      screen.queryByText(/PayFast has not confirmed this payment yet/),
    ).not.toBeInTheDocument();
  });

  it('shows a returned boost that has ended with the ended notice and no PayFast confirmation', async () => {
    const startsAt = '2026-01-10T00:00:00.000Z';
    const endsAt = '2026-01-17T00:00:00.000Z';
    mockPurchases([
      purchaseFixture({
        boosts: [packageBoostWindow(startsAt, endsAt, 'PAID', startsAt)],
        status: 'APPROVED',
      }),
    ]);
    renderBoostPage('/boost?boostPurchaseId=purchase-pay');

    expect(await screen.findByText('This boost has ended.')).toBeInTheDocument();
    expect(screen.queryByText(/PayFast confirmed payment/)).not.toBeInTheDocument();
  });

  it('re-checks a payable PayFast purchase again within 5 seconds', async () => {
    mockPurchases([purchaseFixture({})]);
    renderBoostPage();

    expect(await screen.findByText('Awaiting PayFast payment')).toBeInTheDocument();
    const callsBeforePoll = listMyBoostPurchasesMock.mock.calls.length;
    await waitFor(
      () => expect(listMyBoostPurchasesMock.mock.calls.length).toBeGreaterThan(callsBeforePoll),
      {
        timeout: 7_000,
      },
    );
  }, 10_000);

  it('does not re-check a purchase that is no longer payable', async () => {
    const startsAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({ boosts: [boostWindow(startsAt, endsAt, 'PAID')], status: 'APPROVED' }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Active')).toBeInTheDocument();
    const callsBeforeWait = listMyBoostPurchasesMock.mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 5_500));
    expect(listMyBoostPurchasesMock.mock.calls.length).toBe(callsBeforeWait);
  }, 12_000);

  it('shows a custom campaign with its selected dates and marks it ended once the end date passes', async () => {
    const startsAt = '2026-01-10T00:00:00.000Z';
    const endsAt = '2026-01-12T00:00:00.000Z';
    mockPurchases([
      purchaseFixture({
        boosts: [boostWindow(startsAt, endsAt, 'PAID')],
        status: 'APPROVED',
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Ended')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active Boosts (0)' })).toBeInTheDocument();
    expect(
      screen.getByText(
        `Runs ${new Date(startsAt).toLocaleDateString()} to ${new Date(endsAt).toLocaleDateString()}`,
      ),
    ).toBeInTheDocument();
  });

  it('shows a pending custom campaign whose selected end date has passed as ended with no way to pay', async () => {
    const createdAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const startsAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({ boosts: [boostWindow(startsAt, endsAt, 'PENDING', { createdAt })] }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Ended')).toBeInTheDocument();
    expect(screen.queryByText('Awaiting PayFast payment')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay with PayFast' })).not.toBeInTheDocument();
  });

  it('pays a pending package boost through PayFast inside its 30 minute window', async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const startsAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({
        id: 'purchase-package',
        boosts: [packageBoostWindow(startsAt, '2099-01-01T00:00:00.000Z', 'PENDING', createdAt)],
      }),
    ]);
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    renderBoostPage();

    expect(await screen.findByText('Awaiting PayFast payment')).toBeInTheDocument();
    expect(screen.getByText(/Pay by/)).toBeInTheDocument();
    expect(screen.queryByText(/Runs /)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay with PayFast' }));

    await waitFor(() =>
      expect(startPayFastBoostCheckoutMock).toHaveBeenCalledWith({
        listingId: 'listing-1',
        purchaseId: 'purchase-package',
      }),
    );
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  });

  it('shows a pending package past its 30 minute deadline as expired with no way to pay', async () => {
    const createdAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    const startsAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({
        id: 'purchase-package',
        boosts: [packageBoostWindow(startsAt, '2099-01-01T00:00:00.000Z', 'PENDING', createdAt)],
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Payment expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay with PayFast' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay by/)).not.toBeInTheDocument();
  });

  it('shows a paid package as active while inside its window', async () => {
    const startsAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockPurchases([
      purchaseFixture({
        id: 'purchase-package',
        boosts: [packageBoostWindow(startsAt, endsAt, 'PAID', startsAt)],
        status: 'APPROVED',
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Awaiting PayFast payment')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay with PayFast' })).not.toBeInTheDocument();
  });

  it('shows a paid package as ended after its end date', async () => {
    const startsAt = '2026-01-10T00:00:00.000Z';
    const endsAt = '2026-01-17T00:00:00.000Z';
    mockPurchases([
      purchaseFixture({
        id: 'purchase-package',
        boosts: [packageBoostWindow(startsAt, endsAt, 'PAID', startsAt)],
        status: 'APPROVED',
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Ended')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('keeps requested replacement proof available for an existing manual boost with the flag on', async () => {
    mockPurchases([
      purchaseFixture({
        id: 'purchase-resubmit',
        paymentSubmission: {
          reviewNote: 'Please provide a clearer receipt.',
          reviewedAt: '2026-10-18T09:00:00.000Z',
          status: 'RESUBMISSION_REQUESTED',
        },
        status: 'RESUBMISSION_REQUESTED',
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Replacement proof requested')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay with PayFast' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resubmit payment proof' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(startPayFastBoostCheckoutMock).not.toHaveBeenCalled();
  });

  it('offers no PayFast or new proof for a manual boost awaiting review with the flag on', async () => {
    mockPurchases([
      purchaseFixture({
        id: 'purchase-review',
        paymentSubmission: { reviewNote: null, reviewedAt: null, status: 'SUBMITTED' },
        status: 'PENDING_REVIEW',
      }),
    ]);
    renderBoostPage();

    expect(await screen.findByText('Awaiting payment review')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /PayFast|Resubmit payment proof/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay by/)).not.toBeInTheDocument();
    expect(startPayFastBoostCheckoutMock).not.toHaveBeenCalled();
  });
});
