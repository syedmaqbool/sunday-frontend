import type { ReactNode } from 'react';
import type { SellerCoupon } from '@/types/sellerCoupon.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import SellerCoupons from '@/pages/admin/SellerCoupons';

const { couponState, createCouponMock, toastMock, updateCouponMock, usersState } = vi.hoisted(
  () => ({
    couponState: { coupons: [] as SellerCoupon[] },
    createCouponMock: vi.fn(),
    toastMock: vi.fn(),
    updateCouponMock: vi.fn(),
    usersState: { shouldFail: false },
  }),
);

vi.mock('@/hooks/use-toast', () => ({ toast: toastMock }));
vi.mock('@/queries/adminSellerCoupons.query', () => ({
  getAdminSellerListingsOptions: (sellerId?: string, isEnabled = false) => ({
    enabled: isEnabled,
    queryFn: async () => ({ data: [{ id: 'listing-1', title: 'Desk' }] }),
    queryKey: ['seller-listings', sellerId],
  }),
  getAdminUsersListOptions: () => ({
    queryFn: async () => {
      if (usersState.shouldFail) throw new Error('Users unavailable');
      return { data: [{ id: 'seller-1', firstName: 'Jamie', lastName: 'Seller' }] };
    },
    queryKey: ['admin-users-list'],
  }),
  getSellerCouponsOptions: (query: { page: number; size: number }) => ({
    queryFn: async () => ({
      data: couponState.coupons,
      pagination: {
        currentPage: query.page,
        lastPage: Math.max(1, Math.ceil(couponState.coupons.length / query.size)),
        nextPage: null,
        perPage: query.size,
        prevPage: null,
        total: couponState.coupons.length,
      },
    }),
    queryKey: ['seller-coupons', 'list', query],
  }),
  useCreateSellerCouponMutation: () => ({ mutateAsync: createCouponMock }),
  useDeleteSellerCouponMutation: () => ({ mutate: vi.fn() }),
  useUpdateSellerCouponMutation: () => ({ mutate: vi.fn(), mutateAsync: updateCouponMock }),
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
    value: string;
  }) => (
    <select onChange={event => onValueChange(event.target.value)} value={value}>
      <option value="" />
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

function buildCoupon(overrides: Partial<SellerCoupon> = {}): SellerCoupon {
  return {
    id: 'incentive-1',
    listingId: null,
    sellerId: 'seller-1',
    active: true,
    maxEligibleUnits: 10,
    minOrderAmount: 0,
    percentage: 10,
    reservedEligibleUnits: 2,
    scope: 'SELLER_WIDE',
    sellerIncentiveBonusAmount: 1250,
    usedEligibleUnits: 4,
    expiresAt: null,
    startsAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
    seller:
      overrides.seller === undefined
        ? { id: 'seller-1', fullName: 'Coupon Response Seller' }
        : overrides.seller,
  };
}

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SellerCoupons />
    </QueryClientProvider>,
  );
}

async function openCreateForm() {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /New Seller Incentive/ }));
  await screen.findByRole('heading', { name: 'Create Seller Incentive' });
  await waitFor(() =>
    expect(screen.getByRole('option', { name: 'Jamie Seller' })).toBeInTheDocument(),
  );
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Percentage' }), {
    target: { value: '10' },
  });
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'seller-1' } });
}

describe('seller incentives', () => {
  beforeEach(() => {
    usersState.shouldFail = false;
    couponState.coupons = [
      buildCoupon(),
      buildCoupon({
        id: 'incentive-2',
        maxEligibleUnits: null,
        percentage: 5,
        reservedEligibleUnits: 0,
        sellerIncentiveBonusAmount: 0,
        usedEligibleUnits: 1,
      }),
    ];
    createCouponMock.mockReset().mockResolvedValue({});
    toastMock.mockReset();
    updateCouponMock.mockReset().mockResolvedValue({});
  });

  afterEach(cleanup);

  it('shows the seller name from the coupon response when the users request fails', async () => {
    usersState.shouldFail = true;
    couponState.coupons = [
      buildCoupon({
        sellerId: 'seller-outside-first-page',
        seller: { id: 'seller-outside-first-page', fullName: 'Coupon Response Seller' },
      }),
    ];
    renderPage();

    const row = (await screen.findByText('10%')).closest('tr')!;
    expect(row).toHaveTextContent('Coupon Response Seller');
  });

  it('shows a placeholder when the coupon has no seller', async () => {
    couponState.coupons = [buildCoupon({ seller: null })];
    renderPage();

    const row = (await screen.findByText('10%')).closest('tr')!;
    expect(row.cells[0]).toHaveTextContent('—');
  });

  it('labels assignments and usage in seller incentive units without code values', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Seller Incentives' })).toBeInTheDocument();
    const cappedRow = screen.getByText('10%').closest('tr')!;
    expect(cappedRow).toHaveTextContent('4 used + 2 reserved / 10 units');
    expect(cappedRow).toHaveTextContent('Rs 1,250 generated');
    expect(cappedRow).not.toHaveTextContent('CAPPED10');
    const unlimitedRow = screen.getByText('1 used + 0 reserved / unlimited units').closest('tr')!;
    expect(unlimitedRow).toHaveTextContent('Rs 0 generated');
    expect(screen.queryByText('Code')).not.toBeInTheDocument();
  });

  it('creates a percentage-only seller incentive with existing assignment settings', async () => {
    await openCreateForm();
    fireEvent.change(screen.getByLabelText('Minimum order (Rs)'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Eligible unit cap'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Seller Incentive' }));

    await waitFor(() => expect(createCouponMock).toHaveBeenCalledTimes(1));
    expect(createCouponMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        sellerId: 'seller-1',
        maxEligibleUnits: 25,
        minOrderAmount: 500,
        percentage: 10,
        scope: 'SELLER_WIDE',
      }),
    );
    expect(createCouponMock.mock.calls[0][0]).not.toHaveProperty('code');
    expect(createCouponMock.mock.calls[0][0]).not.toHaveProperty('discountType');
    expect(createCouponMock.mock.calls[0][0]).not.toHaveProperty('discountValue');
  });

  it.each(['0', '-1', '1.5', '101'])('rejects invalid percentage %s', async percentage => {
    await openCreateForm();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Percentage' }), {
      target: { value: percentage },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Seller Incentive' }));
    await waitFor(() => expect(createCouponMock).not.toHaveBeenCalled());
  });

  it('edits the percentage and nullable unit cap', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Seller Incentives' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit seller incentive' })[0]);
    expect(await screen.findByRole('spinbutton', { name: 'Percentage' })).toHaveValue(10);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Percentage' }), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText('Eligible unit cap'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() =>
      expect(updateCouponMock).toHaveBeenCalledWith({
        id: 'incentive-1',
        payload: expect.objectContaining({ maxEligibleUnits: null, percentage: 15 }),
      }),
    );
  });

  it('shows usage details using bonus terms', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Seller Incentives' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Seller incentive usage' })[0]);
    expect(
      await screen.findByRole('heading', { name: 'Seller incentive usage' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4 used units')).toBeInTheDocument();
    expect(screen.getByText('2 reserved units')).toBeInTheDocument();
    expect(screen.getByText('10% seller bonus per eligible item')).toBeInTheDocument();
    expect(screen.getByText('Total seller bonus generated')).toBeInTheDocument();
    expect(screen.getByText('Rs 1,250')).toBeInTheDocument();
    expect(screen.queryByText(/redemptions|discount amount|code/i)).not.toBeInTheDocument();
  });

  it('does not expose a code field or discount type control in create or edit forms', async () => {
    await openCreateForm();
    expect(screen.queryByLabelText('Code')).not.toBeInTheDocument();
    expect(screen.queryByText('Discount type')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Percentage' })).toHaveAttribute('min', '1');
    expect(screen.queryByRole('spinbutton', { name: 'Percentage' })).toHaveAttribute('max', '100');
  });
});
