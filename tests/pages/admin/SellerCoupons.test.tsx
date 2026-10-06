import type { ReactNode } from 'react';
import type { SellerCoupon } from '@/types/sellerCoupon.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SellerCoupons from '@/pages/admin/SellerCoupons';

const { couponState, createCouponMock, toastMock, updateCouponMock } = vi.hoisted(() => ({
  couponState: { coupons: [] as SellerCoupon[] },
  createCouponMock: vi.fn(),
  toastMock: vi.fn(),
  updateCouponMock: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: toastMock }));
vi.mock('@/queries/adminSellerCoupons.query', () => ({
  getAdminSellerListingsOptions: (sellerId?: string, isEnabled = false) => ({
    enabled: isEnabled,
    queryFn: async () => ({ data: [] }),
    queryKey: ['seller-listings', sellerId],
  }),
  getAdminUsersListOptions: () => ({
    queryFn: async () => ({ data: [{ id: 'seller-1', firstName: 'Jamie', lastName: 'Seller' }] }),
    queryKey: ['admin-users-list'],
  }),
  getSellerCouponsOptions: () => ({
    queryFn: async () => couponState.coupons,
    queryKey: ['seller-coupons', 'list'],
  }),
  useCreateSellerCouponMutation: () => ({ mutateAsync: createCouponMock }),
  useDeleteSellerCouponMutation: () => ({ mutate: vi.fn() }),
  useUpdateSellerCouponMutation: () => ({ mutate: vi.fn(), mutateAsync: updateCouponMock }),
}));
// Radix Select does not run in jsdom, so a native select stands in for it.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: { children: ReactNode; onValueChange: (value: string) => void; value: string }) => (
    <select onChange={event => onValueChange(event.target.value)} value={value}>
      <option value="" />
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

function buildCoupon(overrides: Partial<SellerCoupon> = {}): SellerCoupon {
  return {
    id: 'coupon-1',
    listingId: null,
    sellerId: 'seller-1',
    active: true,
    code: 'CAPPED10',
    currentOrders: 4,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxOrders: 10,
    minOrderAmount: 0,
    reservedOrders: 2,
    scope: 'SELLER_WIDE',
    expiresAt: null,
    startsAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SellerCoupons />
    </QueryClientProvider>,
  );
}

async function openCreateForm() {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /New Coupon/ }));
  await screen.findByText('Create Seller Coupon');
  await waitFor(() => expect(screen.getByRole('option', { name: 'Jamie Seller' })).toBeInTheDocument());
  fireEvent.change(screen.getByPlaceholderText('SELLER10'), { target: { value: 'save10' } });
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'seller-1' } });
  fireEvent.change(screen.getByPlaceholderText('10'), { target: { value: '10' } });
}

describe('seller coupon max orders', () => {
  beforeEach(() => {
    couponState.coupons = [
      buildCoupon(),
      buildCoupon({ id: 'coupon-2', code: 'OPEN5', currentOrders: 1, discountValue: 5, maxOrders: null, reservedOrders: 0 }),
    ];
    createCouponMock.mockReset().mockResolvedValue({});
    toastMock.mockReset();
    updateCouponMock.mockReset().mockResolvedValue({});
  });

  it('shows completed and pending orders against the cap or as unlimited', async () => {
    renderPage();

    const cappedCode = await screen.findByText('CAPPED10');
    const cappedRow = cappedCode.closest('tr')!;
    expect(cappedRow).toHaveTextContent('4 completed + 2 pending / 10 max');
    const unlimitedRow = screen.getByText('OPEN5').closest('tr')!;
    expect(unlimitedRow).toHaveTextContent('1 completed + 0 pending / unlimited');
  });

  it('exposes only an optional max orders limit', async () => {
    await openCreateForm();

    expect(screen.getByLabelText('Max orders')).toHaveAttribute('placeholder', 'Unlimited');
    expect(screen.queryByText('Max uses')).not.toBeInTheDocument();
    expect(screen.queryByText('Per user limit')).not.toBeInTheDocument();
  });

  it.each(['0', '-1', '1.5'])('rejects %s max orders', async (maxOrders) => {
    await openCreateForm();
    fireEvent.change(screen.getByLabelText('Max orders'), { target: { value: maxOrders } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Max orders must be a positive whole number.',
    })));
    expect(createCouponMock).not.toHaveBeenCalled();
  });

  it('creates a capped coupon with maxOrders', async () => {
    await openCreateForm();
    fireEvent.change(screen.getByLabelText('Max orders'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));

    await waitFor(() => expect(createCouponMock).toHaveBeenCalledTimes(1));
    const payload = createCouponMock.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ sellerId: 'seller-1', code: 'SAVE10', maxOrders: 25 }));
    expect(payload).not.toHaveProperty('maxUses');
    expect(payload).not.toHaveProperty('perUserLimit');
  });

  it('creates an unlimited coupon when max orders is blank', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Coupon' }));

    await waitFor(() => expect(createCouponMock).toHaveBeenCalledTimes(1));
    expect(createCouponMock.mock.calls[0][0]).toEqual(expect.objectContaining({ maxOrders: null }));
  });

  it('updates the cap and clears it to unlimited', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit CAPPED10' }));
    expect(await screen.findByLabelText('Max orders')).toHaveValue(10);

    fireEvent.change(screen.getByLabelText('Max orders'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateCouponMock).toHaveBeenCalledTimes(1));
    expect(updateCouponMock).toHaveBeenCalledWith({
      id: 'coupon-1',
      payload: expect.objectContaining({ maxOrders: 12 }),
    });
    expect(updateCouponMock.mock.calls[0][0].payload).not.toHaveProperty('maxUses');
    expect(updateCouponMock.mock.calls[0][0].payload).not.toHaveProperty('perUserLimit');

    fireEvent.click(await screen.findByRole('button', { name: 'Edit CAPPED10' }));
    fireEvent.change(await screen.findByLabelText('Max orders'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateCouponMock).toHaveBeenCalledTimes(2));
    expect(updateCouponMock.mock.calls[1][0].payload).toEqual(expect.objectContaining({ maxOrders: null }));
  });
});
