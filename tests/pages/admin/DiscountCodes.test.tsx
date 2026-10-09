import type { ReactNode } from 'react';
import type { DiscountCode } from '@/types/discountCode.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DiscountCodes from '@/pages/admin/DiscountCodes';

const { codeState, createDiscountCodeMock, listDiscountCodesMock } = vi.hoisted(() => ({
  codeState: { codes: [] as DiscountCode[] },
  createDiscountCodeMock: vi.fn(),
  listDiscountCodesMock: vi.fn(),
}));

vi.mock('@/services/discountCode.service', () => ({
  createDiscountCode: createDiscountCodeMock,
  deleteDiscountCode: vi.fn(),
  listDiscountCodes: listDiscountCodesMock,
  updateDiscountCode: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: { children: ReactNode; onValueChange: (value: string) => void; value: string }) => (
    <select onChange={event => onValueChange(event.target.value)} value={value}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DiscountCodes />
    </QueryClientProvider>,
  );
}

function buildCode(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: 'discount-1',
    active: true,
    code: 'SAVE10',
    currentUses: 7,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxUses: 20,
    maxUsesPerUser: 3,
    minOrderAmount: 0,
    expiresAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

async function openCreateForm() {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /New Code/ }));
  await screen.findByRole('heading', { name: 'Create Discount Code' });
  fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'SAVE20' } });
  fireEvent.change(screen.getByLabelText('Value'), { target: { value: '20' } });
}

describe('discount codes', () => {
  beforeEach(() => {
    codeState.codes = [];
    listDiscountCodesMock.mockReset().mockImplementation(async () => ({ data: codeState.codes }));
    createDiscountCodeMock.mockReset().mockResolvedValue({});
  });

  afterEach(cleanup);

  it.each(['0', '-1', '1.5'])('rejects a per-buyer cap of %s', async (cap) => {
    await openCreateForm();
    fireEvent.change(screen.getByLabelText('Max uses per buyer'), { target: { value: cap } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Code' }));

    await waitFor(() => expect(createDiscountCodeMock).not.toHaveBeenCalled());
  });

  it('creates a discount code with a numeric per-buyer cap', async () => {
    await openCreateForm();
    fireEvent.change(screen.getByLabelText('Max uses per buyer'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Code' }));

    await waitFor(() => expect(createDiscountCodeMock).toHaveBeenCalledTimes(1));
    expect(createDiscountCodeMock).toHaveBeenCalledWith(expect.objectContaining({ maxUsesPerUser: 3 }));
  });

  it('creates a discount code with a null per-buyer cap when the field is blank', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Code' }));

    await waitFor(() => expect(createDiscountCodeMock).toHaveBeenCalledTimes(1));
    expect(createDiscountCodeMock).toHaveBeenCalledWith(expect.objectContaining({ maxUsesPerUser: null }));
  });

  it('shows the per-buyer cap alongside existing global usage', async () => {
    codeState.codes = [
      buildCode(),
      buildCode({ id: 'discount-2', code: 'NOLIMIT', currentUses: 1, maxUses: null, maxUsesPerUser: null }),
    ];
    renderPage();

    const cappedCode = await screen.findByText('SAVE10');
    const cappedRow = cappedCode.closest('tr');
    expect(cappedRow).toHaveTextContent('7 / 20');
    expect(cappedRow).toHaveTextContent('Per buyer: 3');

    const unlimitedRow = screen.getByText('NOLIMIT').closest('tr');
    expect(unlimitedRow).toHaveTextContent('1');
    expect(unlimitedRow).toHaveTextContent('Per buyer: Unlimited');
  });
});
