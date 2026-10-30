import type { ReactNode } from 'react';
import type { SellerCoupon } from '@/types/sellerCoupon.type';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import SellerCoupons from '@/pages/admin/SellerCoupons';

const {
  couponState,
  createCouponMock,
  searchRequests,
  sellerListingsCalls,
  toastMock,
  updateCouponMock,
} = vi.hoisted(() => ({
  couponState: { coupons: [] as SellerCoupon[] },
  createCouponMock: vi.fn(),
  searchRequests: [] as Array<Record<string, unknown>>,
  sellerListingsCalls: [] as Array<[string | undefined, boolean]>,
  toastMock: vi.fn(),
  updateCouponMock: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: toastMock }));
vi.mock('@/queries/adminUsers.query', () => ({
  getAdminUsersQueryOptions: (parameters: Record<string, unknown>, enabled = true) => ({
    enabled,
    queryFn: async () => {
      searchRequests.push(parameters);
      return {
        data:
          parameters.search === 'nobody'
            ? []
            : [
                {
                  id: 'seller-1',
                  firstName: 'Jamie',
                  lastName: 'Seller',
                  email: 'jamie@example.com',
                },
                {
                  id: 'seller-outside-first-page',
                  firstName: 'Faraway',
                  lastName: 'Seller',
                  email: 'faraway@example.com',
                },
              ],
      };
    },
    queryKey: ['admin-users', 'list', parameters],
  }),
}));
vi.mock('@/queries/adminSellerCoupons.query', () => ({
  getAdminSellerListingsOptions: (sellerId?: string, isEnabled = false) => {
    sellerListingsCalls.push([sellerId, isEnabled]);
    return {
      enabled: isEnabled,
      queryFn: async () => ({ data: [{ id: 'listing-1', title: 'Desk' }] }),
      queryKey: ['seller-listings', sellerId],
    };
  },
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
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Percentage' }), {
    target: { value: '10' },
  });
}

describe('seller incentives', () => {
  beforeEach(() => {
    searchRequests.length = 0;
    sellerListingsCalls.length = 0;
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

  it('shows the seller name from the coupon response in the edit picker', async () => {
    couponState.coupons = [
      buildCoupon({
        sellerId: 'seller-outside-first-page',
        seller: { id: 'seller-outside-first-page', fullName: 'Coupon Response Seller' },
      }),
    ];
    renderPage();

    const row = (await screen.findByText('10%')).closest('tr')!;
    expect(row).toHaveTextContent('Coupon Response Seller');
    fireEvent.click(screen.getByRole('button', { name: 'Edit seller incentive' }));
    expect(await screen.findByRole('combobox', { name: 'Assign to seller' })).toHaveTextContent(
      'Coupon Response Seller',
    );
    expect(searchRequests).toHaveLength(0);
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
    fireEvent.click(screen.getByRole('combobox', { name: 'Assign to seller' }));
    fireEvent.change(screen.getByPlaceholderText('Search seller name or email…'), {
      target: { value: 'Jamie' },
    });
    expect(await screen.findByText('Jamie Seller')).toBeInTheDocument();
    expect(screen.getByText('jamie@example.com')).toBeInTheDocument();
    expect(searchRequests).toContainEqual({
      search: 'Jamie',
      roleType: 'USER',
      status: 'ACTIVE',
      size: 20,
    });
    fireEvent.click(screen.getByRole('option', { name: /Jamie Seller/ }));
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

  it('debounces seller search and can select a seller beyond the first 100', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('combobox', { name: 'Assign to seller' }));
    const searchInput = screen.getByPlaceholderText('Search seller name or email…');
    fireEvent.change(searchInput, { target: { value: 'Fa' } });
    await new Promise(resolve => setTimeout(resolve, 100));
    fireEvent.change(searchInput, { target: { value: 'Faraway' } });
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(searchRequests).toHaveLength(0);
    expect(
      await screen.findByText('faraway@example.com', {}, { timeout: 1000 }),
    ).toBeInTheDocument();
    expect(searchRequests).toEqual([
      { search: 'Faraway', roleType: 'USER', status: 'ACTIVE', size: 20 },
    ]);
    fireEvent.click(screen.getByRole('option', { name: /Faraway Seller/ }));
    expect(screen.getByRole('combobox', { name: 'Assign to seller' })).toHaveTextContent(
      'Faraway Seller',
    );
    expect(screen.queryByText('Choose seller')).not.toBeInTheDocument();
  });

  it('shows an empty state when the seller search has no matches', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('combobox', { name: 'Assign to seller' }));
    fireEvent.change(screen.getByPlaceholderText('Search seller name or email…'), {
      target: { value: 'nobody' },
    });
    expect(await screen.findByText('No sellers found.')).toBeInTheDocument();
  });

  it('requires a seller assignment', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Seller Incentive' }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Choose a seller.' }),
      ),
    );
    expect(createCouponMock).not.toHaveBeenCalled();
  });

  it('loads approved seller listings after selecting a seller for an item-based coupon', async () => {
    await openCreateForm();
    fireEvent.click(screen.getByRole('combobox', { name: 'Assign to seller' }));
    fireEvent.change(screen.getByPlaceholderText('Search seller name or email…'), {
      target: { value: 'Jamie' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /Jamie Seller/ }));
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'item_based' },
    });
    expect(await screen.findByText('Desk')).toBeInTheDocument();
    expect(sellerListingsCalls).toContainEqual(['seller-1', true]);
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
