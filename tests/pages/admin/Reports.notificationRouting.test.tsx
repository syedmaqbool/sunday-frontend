import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Reports from '@/pages/admin/Reports';

const { reports } = vi.hoisted(() => ({
  reports: [{
    id: 'report-1',
    listingId: 'listing-1',
    reportedUserId: null,
    adminNotes: null,
    details: null,
    listingTitle: 'Selected report listing',
    messageContent: null,
    reason: 'MISLEADING_LISTING',
    reportedUserFullName: null,
    reporterFullName: 'Reporter',
    resolverFullName: null,
    status: 'OPEN',
    resolvedAt: null,
    resolvedBy: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }],
}));

vi.mock('@/queries/adminReport.query', () => ({
  getAdminReportsOptions: (status: string) => ({
    queryFn: async () => status === 'OPEN' || status === 'all' ? reports : [],
    queryKey: ['admin-reports', status],
  }),
  useResolveReportMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

function LocationControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
    </>
  );
}

function renderReports(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationControls />
        <Reports />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin report notification navigation', () => {
  it('restores the selected report from the URL and browser history', async () => {
    renderReports(['/admin/reports', '/admin/reports?report=report-1']);

    expect(await screen.findByText('Selected report listing')).toBeInTheDocument();
    expect(document.querySelector('[data-selected="true"]')).toHaveTextContent('Selected report listing');
    expect(screen.getByTestId('location')).toHaveTextContent('report=report-1');

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/reports'));
    expect(document.querySelector('[data-selected="true"]')).not.toBeInTheDocument();
  });

  it('falls back to the reports list when the selected report is unavailable', async () => {
    renderReports(['/admin/reports?report=missing-report']);

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('report='));
    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
  });
});
