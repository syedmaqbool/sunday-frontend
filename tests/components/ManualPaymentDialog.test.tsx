import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualPaymentDialog } from '@/components/ManualPaymentDialog';

const { uploadPaymentProofMock } = vi.hoisted(() => ({
  uploadPaymentProofMock: vi.fn(),
}));

vi.mock('@/queries/checkout.query', () => ({
  getPaymentInstructionsOptions: () => ({
    queryFn: async () => ({
      data: {
        accountNumber: 'PK00 1234',
        accountTitle: 'Sunday Store',
        bankOrWalletLabel: 'Example Bank',
      },
    }),
    queryKey: ['checkout', 'payment-instructions'],
  }),
  useUploadPaymentProofMutation: () => ({
    isPending: false,
    mutateAsync: uploadPaymentProofMock,
  }),
}));

function renderDialog(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onOpenChange = vi.fn();

  return {
    onOpenChange,
    onSubmit,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ManualPaymentDialog
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          open
        />
      </QueryClientProvider>,
    ),
  };
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Sender account title/name'), {
    target: { value: 'Jane Doe' },
  });
  fireEvent.change(screen.getByLabelText('Sender account number'), {
    target: { value: '123456789' },
  });
  fireEvent.change(screen.getByLabelText('Transaction screenshot'), {
    target: {
      files: [new File(['proof'], 'proof.png', { type: 'image/png' })],
    },
  });
}

describe('manual payment dialog', () => {
  beforeEach(() => {
    uploadPaymentProofMock.mockReset();
    uploadPaymentProofMock.mockResolvedValue({ data: { id: 'proof-file-id' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays read-only payment instructions and validates required sender fields', async () => {
    renderDialog();

    expect(await screen.findByText('Sunday Store')).toBeInTheDocument();
    expect(screen.getByText('PK00 1234')).toBeInTheDocument();
    expect(screen.getByText('Example Bank')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit payment proof/i }));

    expect(await screen.findByText('Sender account title/name is required.')).toBeInTheDocument();
    expect(screen.getByText('Sender account number is required.')).toBeInTheDocument();
    expect(screen.getByText('Transaction screenshot is required.')).toBeInTheDocument();
    expect(uploadPaymentProofMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported screenshot types before upload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog(onSubmit);
    await screen.findByText('Sunday Store');

    fireEvent.change(screen.getByLabelText('Sender account title/name'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText('Sender account number'), {
      target: { value: '123456789' },
    });
    fireEvent.change(screen.getByLabelText('Transaction screenshot'), {
      target: {
        files: [new File(['proof'], 'proof.gif', { type: 'image/gif' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit payment proof/i }));

    expect(await screen.findByText('Use a JPEG, PNG, or WebP image.')).toBeInTheDocument();
    expect(uploadPaymentProofMock).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows upload errors and keeps entered values', async () => {
    uploadPaymentProofMock.mockRejectedValueOnce(new Error('Upload service is unavailable.'));
    renderDialog();
    await screen.findByText('Sunday Store');
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /submit payment proof/i }));

    expect(await screen.findByText('Upload service is unavailable.')).toBeInTheDocument();
    expect(screen.getByLabelText('Sender account title/name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Sender account number')).toHaveValue('123456789');
  });

  it('passes the uploaded proof ID to order creation and prevents duplicate uploads', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog(onSubmit);
    await screen.findByText('Sunday Store');
    fillValidForm();

    const submit = screen.getByRole('button', { name: /submit payment proof/i });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      proofFileId: 'proof-file-id',
      senderAccountNumber: '123456789',
      senderAccountTitle: 'Jane Doe',
    }));
    expect(uploadPaymentProofMock).toHaveBeenCalledOnce();
  });

  it('shows the order error without closing or clearing the form', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Order total changed.'));
    renderDialog(onSubmit);
    await screen.findByText('Sunday Store');
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /submit payment proof/i }));

    expect(await screen.findByText('Order total changed.')).toBeInTheDocument();
    expect(screen.getByLabelText('Sender account title/name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Sender account number')).toHaveValue('123456789');
  });

  it('cancels without uploading or submitting an order', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { onOpenChange } = renderDialog(onSubmit);
    await screen.findByText('Sunday Store');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(uploadPaymentProofMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
