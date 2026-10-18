import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Boost from '@/pages/Boost';

const {
  getPaymentInstructionsMock,
  listBoostableListingsMock,
  listMyBoostPurchasesMock,
  listMyBoostsMock,
  resubmitBoostPaymentProofMock,
  uploadPaymentProofMock,
} = vi.hoisted(() => ({
  getPaymentInstructionsMock: vi.fn(),
  listBoostableListingsMock: vi.fn(),
  listMyBoostPurchasesMock: vi.fn(),
  listMyBoostsMock: vi.fn(),
  resubmitBoostPaymentProofMock: vi.fn(),
  uploadPaymentProofMock: vi.fn(),
}));

vi.mock('@/services/clientBoost.service', () => ({
  listBoostableListings: listBoostableListingsMock,
  listMyBoostPurchases: listMyBoostPurchasesMock,
  listMyBoosts: listMyBoostsMock,
  resubmitBoostPaymentProof: resubmitBoostPaymentProofMock,
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

function renderBoostPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
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
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 0 },
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
      data: [{
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
      }],
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 1 },
    });
    listBoostableListingsMock.mockResolvedValue({
      data: [{
        id: 'listing-1',
        coverImage: { url: '/listing.png' },
        price: 10_000,
        title: 'Leather Tote',
      }],
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 1 },
    });
  });

  it('shows a pending purchase as awaiting review without counting it as active', async () => {
    listMyBoostPurchasesMock.mockResolvedValue({
      data: [{
        id: 'purchase-1',
        amount: 2100,
        boosts: [{
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
        }],
        paymentSubmission: { reviewNote: null, status: 'SUBMITTED', reviewedAt: null },
        status: 'PENDING_REVIEW',
        refundCompletedAt: null,
      }],
      message: 'Boost purchases fetched.',
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 1 },
      statusCode: 200,
    });
    renderBoostPage();

    expect(await screen.findByRole('heading', { name: 'Active Boosts (0)' })).toBeInTheDocument();
    expect(await screen.findByText('Awaiting payment review')).toBeInTheDocument();
    expect(await screen.findAllByText('Leather Tote')).toHaveLength(2);
  });

  it('shows purchase decisions and offers resubmission only when replacement proof is requested', async () => {
    listMyBoostPurchasesMock.mockResolvedValue({
      data: [
        {
          id: 'purchase-pending',
          amount: 600,
          boosts: [{
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
          }],
          paymentSubmission: { reviewNote: null, status: 'SUBMITTED', reviewedAt: null },
          status: 'PENDING_REVIEW',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-active',
          amount: 2000,
          boosts: [{
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
            endsAt: '2026-10-25T08:00:00.000Z',
            startsAt: '2026-10-18T08:00:00.000Z',
            createdAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          paymentSubmission: { reviewNote: 'Payment verified.', status: 'APPROVED', reviewedAt: '2026-10-18T09:00:00.000Z' },
          status: 'APPROVED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-rejected',
          amount: 1500,
          boosts: [{
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
          }],
          paymentSubmission: { reviewNote: 'Receipt is unclear.', status: 'REJECTED', reviewedAt: '2026-10-18T09:00:00.000Z' },
          status: 'REJECTED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-resubmit',
          amount: 800,
          boosts: [{
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
          }],
          paymentSubmission: { reviewNote: 'Please provide a clearer receipt.', status: 'RESUBMISSION_REQUESTED', reviewedAt: '2026-10-18T09:00:00.000Z' },
          status: 'RESUBMISSION_REQUESTED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-refund-required',
          amount: 1200,
          boosts: [{
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
          }],
          paymentSubmission: { reviewNote: 'Listing is no longer eligible.', status: 'APPROVED', reviewedAt: '2026-10-18T09:00:00.000Z' },
          status: 'REFUND_REQUIRED',
          refundCompletedAt: null,
        },
        {
          id: 'purchase-refunded',
          amount: 700,
          boosts: [{
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
          }],
          paymentSubmission: { reviewNote: 'Listing is no longer eligible.', status: 'APPROVED', reviewedAt: '2026-10-18T09:00:00.000Z' },
          status: 'REFUNDED',
          refundCompletedAt: '2026-10-19T10:00:00.000Z',
        },
      ],
      message: 'Boost purchases fetched.',
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 6 },
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
    expect(within(paymentDialog).getByRole('heading', { name: 'Resubmit payment proof' })).toBeInTheDocument();
    expect(await within(paymentDialog).findByText('Sunday Store')).toBeInTheDocument();
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
    await waitFor(() => expect(resubmitBoostPaymentProofMock).toHaveBeenCalledWith(
      'listing-1',
      'purchase-resubmit',
      {
        proofFileId: 'replacement-proof-id',
        senderAccountNumber: '123456789',
        senderAccountTitle: 'Jane Doe',
      },
    ));
  });

  it('lets sellers move through every page of purchase history', async () => {
    listMyBoostPurchasesMock.mockImplementation(({ page }: { page: number }) => Promise.resolve({
      data: [{
        id: `purchase-${page}`,
        amount: page === 1 ? 600 : 900,
        boosts: [],
        paymentSubmission: null,
        status: page === 1 ? 'PENDING_REVIEW' : 'REJECTED',
        refundCompletedAt: null,
      }],
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
    }));

    renderBoostPage();

    expect(await screen.findByText('Awaiting payment review')).toBeInTheDocument();
    expect(screen.getByText('Showing page 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Showing page 2 of 2')).toBeInTheDocument();
    expect(listMyBoostPurchasesMock).toHaveBeenLastCalledWith({ page: 2, size: 100 });
  });
});
