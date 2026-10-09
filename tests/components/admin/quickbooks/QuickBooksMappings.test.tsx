import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuickBooksMappings from '@/components/admin/quickbooks/QuickBooksMappings';

const quickBooksService = vi.hoisted(() => ({
  getAdminQuickBooksAccountMappingVersions: vi.fn(),
  getAdminQuickBooksSellerVendorMappings: vi.fn(),
}));

vi.mock('@/services/adminQuickBooks.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/adminQuickBooks.service')>();
  return { ...actual, ...quickBooksService };
});

describe('quickbooks account mappings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quickBooksService.getAdminQuickBooksAccountMappingVersions.mockResolvedValue({
      data: [],
      message: 'Loaded.',
      pagination: {
        currentPage: 1,
        lastPage: 0,
        nextPage: null,
        perPage: 20,
        prevPage: null,
        total: 0,
      },
      statusCode: 200,
    });
    quickBooksService.getAdminQuickBooksSellerVendorMappings.mockResolvedValue({ data: [] });
  });

  it('allows mapping the seller incentive marketing cost category', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <QuickBooksMappings
          canManageMappings
          canReadMappings
          isPostingEnvironmentConnected
          postingEnvironment="SANDBOX"
        />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Add account mapping version' }));

    expect(await screen.findByText('Seller incentive marketing cost')).toBeInTheDocument();
    expect(screen.getByText('SELLER_INCENTIVE_MARKETING_COGS')).toBeInTheDocument();
    expect(screen.getByLabelText('QuickBooks account ID', { selector: '#quickbooks-account-id-SELLER_INCENTIVE_MARKETING_COGS' })).toBeInTheDocument();
  });
});
