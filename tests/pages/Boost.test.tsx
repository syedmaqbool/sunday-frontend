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
          createdAt: '2026-10-18T10:00:00.000Z',
          id: 'submission-2',
          proofFileId: 'replacement-proof-id',
          status: 'SUBMITTED',
        },
        status: 'PENDING_REVIEW',
      },
      message: 'Replacement proof submitted.',
      statusCode: 200,
    });
    listMyBoostsMock.mockReset().mockResolvedValue({
      data: [{
        boostPurchaseId: 'purchase-1',
        createdAt: '2026-10-18T08:00:00.000Z',
        durationDays: 7,
        endsAt: '2026-10-25T08:00:00.000Z',
        id: 'boost-1',
        isActive: false,
        listingId: 'listing-1',
        packageId: 'package-1',
        packageName: 'One week',
        paymentStatus: 'PENDING',
        placement: 'FOR_YOU',
        pricePaid: 2100,
        sellerId: 'seller-1',
        startsAt: '2026-10-18T08:00:00.000Z',
        updatedAt: '2026-10-18T08:00:00.000Z',
      }],
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 1 },
    });
    listBoostableListingsMock.mockResolvedValue({
      data: [{
        coverImage: { url: '/listing.png' },
        id: 'listing-1',
        price: 10000,
        title: 'Leather Tote',
      }],
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 100, prevPage: null, total: 1 },
    });
  });

  it('shows a pending purchase as awaiting review without counting it as active', async () => {
    listMyBoostPurchasesMock.mockResolvedValue({
      data: [{
        amount: 2100,
        boosts: [{
          boostPurchaseId: 'purchase-1',
          createdAt: '2026-10-18T08:00:00.000Z',
          durationDays: 7,
          endsAt: '2026-10-25T08:00:00.000Z',
          id: 'boost-1',
          isActive: false,
          listingId: 'listing-1',
          packageId: 'package-1',
          packageName: 'One week',
          paymentStatus: 'PENDING',
          placement: 'FOR_YOU',
          pricePaid: 2100,
          sellerId: 'seller-1',
          startsAt: '2026-10-18T08:00:00.000Z',
          updatedAt: '2026-10-18T08:00:00.000Z',
        }],
        id: 'purchase-1',
        paymentSubmission: { reviewNote: null, reviewedAt: null, status: 'SUBMITTED' },
        refundCompletedAt: null,
        status: 'PENDING_REVIEW',
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
          amount: 600,
          boosts: [{
            boostPurchaseId: 'purchase-pending',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-pending',
            isActive: false,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 600,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-pending',
          paymentSubmission: { reviewNote: null, reviewedAt: null, status: 'SUBMITTED' },
          refundCompletedAt: null,
          status: 'PENDING_REVIEW',
        },
        {
          amount: 2000,
          boosts: [{
            boostPurchaseId: 'purchase-active',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-active',
            isActive: true,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PAID',
            placement: 'FOR_YOU',
            pricePaid: 2000,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-active',
          paymentSubmission: { reviewNote: 'Payment verified.', reviewedAt: '2026-10-18T09:00:00.000Z', status: 'APPROVED' },
          refundCompletedAt: null,
          status: 'APPROVED',
        },
        {
          amount: 1500,
          boosts: [{
            boostPurchaseId: 'purchase-rejected',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-rejected',
            isActive: false,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 1500,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-rejected',
          paymentSubmission: { reviewNote: 'Receipt is unclear.', reviewedAt: '2026-10-18T09:00:00.000Z', status: 'REJECTED' },
          refundCompletedAt: null,
          status: 'REJECTED',
        },
        {
          amount: 800,
          boosts: [{
            boostPurchaseId: 'purchase-resubmit',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-resubmit',
            isActive: false,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 800,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-resubmit',
          paymentSubmission: { reviewNote: 'Please provide a clearer receipt.', reviewedAt: '2026-10-18T09:00:00.000Z', status: 'RESUBMISSION_REQUESTED' },
          refundCompletedAt: null,
          status: 'RESUBMISSION_REQUESTED',
        },
        {
          amount: 1200,
          boosts: [{
            boostPurchaseId: 'purchase-refund-required',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-refund-required',
            isActive: false,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 1200,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-refund-required',
          paymentSubmission: { reviewNote: 'Listing is no longer eligible.', reviewedAt: '2026-10-18T09:00:00.000Z', status: 'APPROVED' },
          refundCompletedAt: null,
          status: 'REFUND_REQUIRED',
        },
        {
          amount: 700,
          boosts: [{
            boostPurchaseId: 'purchase-refunded',
            createdAt: '2026-10-18T08:00:00.000Z',
            durationDays: 7,
            endsAt: '2026-10-25T08:00:00.000Z',
            id: 'boost-refunded',
            isActive: false,
            listingId: 'listing-1',
            packageId: 'package-1',
            packageName: 'One week',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 700,
            sellerId: 'seller-1',
            startsAt: '2026-10-18T08:00:00.000Z',
            updatedAt: '2026-10-18T08:00:00.000Z',
          }],
          id: 'purchase-refunded',
          paymentSubmission: { reviewNote: 'Listing is no longer eligible.', reviewedAt: '2026-10-18T09:00:00.000Z', status: 'APPROVED' },
          refundCompletedAt: '2026-10-19T10:00:00.000Z',
          status: 'REFUNDED',
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
});
