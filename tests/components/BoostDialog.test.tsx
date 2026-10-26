import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import BoostDialog from '@/components/BoostDialog';

const {
  boostWithCampaignMock,
  boostWithPackageMock,
  getListingBoostCampaignQuoteMock,
  getPaymentInstructionsMock,
  listBoostPackagesMock,
  toastSuccessMock,
  uploadPaymentProofMock,
} = vi.hoisted(() => ({
  boostWithCampaignMock: vi.fn(),
  boostWithPackageMock: vi.fn(),
  getListingBoostCampaignQuoteMock: vi.fn(),
  getPaymentInstructionsMock: vi.fn(),
  listBoostPackagesMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  uploadPaymentProofMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'seller-1' } }) }));
vi.mock('@/services/clientBoost.service', () => ({
  boostWithCampaign: boostWithCampaignMock,
  boostWithPackage: boostWithPackageMock,
  getListingBoostCampaignQuote: getListingBoostCampaignQuoteMock,
  listActiveBoosts: vi.fn(),
  listBoostableListings: vi.fn(),
  listBoostPackages: listBoostPackagesMock,
  listMyBoosts: vi.fn(),
}));
vi.mock('@/services/checkout.service', () => ({
  cancelOrder: vi.fn(),
  createOrder: vi.fn(),
  getPaymentInstructions: getPaymentInstructionsMock,
  quoteCheckout: vi.fn(),
  resubmitManualPayment: vi.fn(),
  uploadPaymentProof: uploadPaymentProofMock,
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: toastSuccessMock } }));

function renderBoostDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BoostDialog listingId="listing-1" listingTitle="Leather Tote" />
    </QueryClientProvider>,
  );
}

describe('seller boost purchase dialog', () => {
  beforeEach(() => {
    boostWithPackageMock.mockReset().mockResolvedValue({
      data: {
        id: 'purchase-1',
        listingId: 'listing-1',
        sellerId: 'seller-1',
        amount: 1250,
        boosts: [
          {
            id: 'boost-1',
            listingId: 'listing-1',
            paymentStatus: 'PENDING',
            placement: 'FOR_YOU',
            pricePaid: 1250,
            endsAt: '2026-10-25T08:00:00.000Z',
            startsAt: '2026-10-18T08:00:00.000Z',
          },
        ],
        paymentInstructions: {
          accountIban: 'PK00 1234',
          accountNumber: '123456789',
          accountTitle: 'Sunday Store',
          bankOrWalletLabel: 'Example Bank',
        },
        paymentSubmission: {
          id: 'submission-1',
          proofFileId: 'proof-file-id',
          status: 'SUBMITTED',
          createdAt: '2026-10-18T08:00:00.000Z',
        },
        status: 'PENDING_REVIEW',
        createdAt: '2026-10-18T08:00:00.000Z',
      },
      message: 'Payment proof submitted.',
      statusCode: 201,
    });
    listBoostPackagesMock.mockReset().mockResolvedValue({
      data: [
        {
          id: 'package-1',
          active: true,
          credits: 100,
          description: 'One week of placement',
          durationDays: 7,
          name: 'One week',
          placement: 'FOR_YOU',
          price: 1000,
        },
      ],
      message: 'Boost packages fetched.',
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
    getListingBoostCampaignQuoteMock.mockReset().mockResolvedValue({
      data: { amount: 1850, durationDays: 5 },
      message: 'Campaign quote calculated.',
      statusCode: 200,
    });
    uploadPaymentProofMock.mockReset().mockResolvedValue({
      data: { id: 'proof-file-id' },
      message: 'Proof uploaded.',
      statusCode: 201,
    });
    toastSuccessMock.mockReset();
  });

  it('submits proof without a client payment status and shows the server pending amount', async () => {
    renderBoostDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Boost' }));
    fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Quick Packages' }), { button: 0 });
    expect(await screen.findByText('Rs 1000.00')).toBeInTheDocument();
    fireEvent.click(screen.getByText('One week'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    expect(await screen.findByText('Boost amount: Rs 1,000.00')).toBeInTheDocument();
    expect(await screen.findByText('Sunday Store')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sender account title/name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText('Sender account number'), {
      target: { value: '123456789' },
    });
    fireEvent.change(screen.getByLabelText('Transaction screenshot'), {
      target: { files: [new File(['proof'], 'proof.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit payment proof' }));

    await waitFor(() =>
      expect(boostWithPackageMock).toHaveBeenCalledWith('listing-1', {
        proofFileId: 'proof-file-id',
        packageIds: ['package-1'],
        senderAccountNumber: '123456789',
        senderAccountTitle: 'Jane Doe',
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringContaining('Rs 1,250.00'));
    expect(toastSuccessMock).toHaveBeenCalledWith(
      expect.stringContaining('awaiting payment review'),
    );
    expect(toastSuccessMock).not.toHaveBeenCalledWith(
      expect.stringContaining('Your boost is active.'),
    );
  });

  it('shows a server campaign quote before the seller continues to payment', async () => {
    renderBoostDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Boost' }));

    await waitFor(() => expect(getListingBoostCampaignQuoteMock).toHaveBeenCalled());
    expect(await screen.findByText('Rs 1,850.00')).toBeInTheDocument();
    expect(screen.getByText('Campaign duration: 5 days')).toBeInTheDocument();
    expect(getListingBoostCampaignQuoteMock).toHaveBeenCalledWith(
      'listing-1',
      expect.objectContaining({
        placement: 'FOR_YOU',
        endsAt: expect.any(String),
        startsAt: expect.any(String),
      }),
    );
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    const paymentDialog = await screen.findByRole('dialog', { name: 'Complete manual payment' });
    expect(within(paymentDialog).getByText('Boost amount: Rs 1,850.00')).toBeInTheDocument();
    expect(within(paymentDialog).getByText('Campaign duration: 5 days')).toBeInTheDocument();
    expect(within(paymentDialog).getByText(/Transfer the boost amount below/)).toBeInTheDocument();
  });
});
