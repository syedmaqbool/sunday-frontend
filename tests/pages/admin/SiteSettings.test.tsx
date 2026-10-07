import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SiteSettings from '@/pages/admin/SiteSettings';
import { getPublicHeroImageOptions, siteSettingsQueryKey } from '@/queries/siteSettings.query';

const { getHeroImageMock, getPublicHeroImageMock, updateHeroImageMock } = vi.hoisted(() => ({
  getHeroImageMock: vi.fn(),
  getPublicHeroImageMock: vi.fn(),
  updateHeroImageMock: vi.fn(),
}));

const promiseConstructorWithResolvers = Promise as PromiseConstructor & {
  withResolvers: <Value>() => {
    promise: Promise<Value>;
    resolve: (value: PromiseLike<Value> | Value) => void;
  };
};
const queryClients: QueryClient[] = [];

vi.mock('@/services/adminSiteSettings.service', () => ({
  getHeroImage: getHeroImageMock,
  getPublicHeroImage: getPublicHeroImageMock,
  updateHeroImage: updateHeroImageMock,
}));

function PublicHeroProbe() {
  const { data } = useQuery(getPublicHeroImageOptions());

  return <div data-testid="public-hero-url">{data?.url}</div>;
}

function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  queryClients.push(queryClient);
  return queryClient;
}

describe('site settings', () => {
  afterEach(() => {
    for (const queryClient of queryClients) queryClient.clear();
    queryClients.length = 0;
    vi.clearAllMocks();
  });

  it('waits for admin settings before showing the form when public hero data is cached', async () => {
    const queryClient = createQueryClient();
    const publicHero = { url: '/public-banner.jpg' };
    const adminHero = { url: '/admin-banner.jpg' };
    const adminRequest = promiseConstructorWithResolvers.withResolvers<{ data: { value: typeof adminHero } }>();

    getPublicHeroImageMock.mockResolvedValue({ data: { value: publicHero } });
    getHeroImageMock.mockReturnValue(adminRequest.promise);

    await queryClient.prefetchQuery(getPublicHeroImageOptions());
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);

    render(
      <QueryClientProvider client={queryClient}>
        <PublicHeroProbe />
        <SiteSettings />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getHeroImageMock).toHaveBeenCalledOnce());
    expect(screen.getByRole('status', { name: 'Loading site settings' })).toBeInTheDocument();
    expect(screen.queryByText('Desktop banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Desktop hero preview' })).not.toBeInTheDocument();
    expect(screen.getByTestId('public-hero-url')).toHaveTextContent('/public-banner.jpg');

    await act(async () => {
      adminRequest.resolve({ data: { value: adminHero } });
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Desktop hero preview' })).toHaveAttribute('src', '/admin-banner.jpg');
    });
    expect(screen.queryByRole('status', { name: 'Loading site settings' })).not.toBeInTheDocument();
  });

  it('shows a retry action after the initial settings request fails', async () => {
    const queryClient = createQueryClient();
    getHeroImageMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { value: { url: '/admin-banner.jpg' } } });

    render(
      <QueryClientProvider client={queryClient}>
        <SiteSettings />
      </QueryClientProvider>,
    );

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load site settings');
    expect(screen.queryByText('Desktop banner')).not.toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Desktop hero preview' })).toHaveAttribute('src', '/admin-banner.jpg');
    });
    expect(getHeroImageMock).toHaveBeenCalledTimes(2);
  });

  it('uses the form defaults when no hero setting exists yet', async () => {
    const queryClient = createQueryClient();
    getHeroImageMock.mockRejectedValue(new Error('Request failed with status 404'));

    render(
      <QueryClientProvider client={queryClient}>
        <SiteSettings />
      </QueryClientProvider>,
    );

    expect(await screen.findByDisplayValue('Style doesn\'t')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves unsaved form edits when settings refresh', async () => {
    const queryClient = createQueryClient();
    const refreshRequest = promiseConstructorWithResolvers.withResolvers<{ data: { value: { url: string } } }>();
    getHeroImageMock
      .mockResolvedValueOnce({ data: { value: { url: '/initial-banner.jpg' } } })
      .mockReturnValueOnce(refreshRequest.promise);

    render(
      <QueryClientProvider client={queryClient}>
        <SiteSettings />
      </QueryClientProvider>,
    );

    const desktopUrlInput = await screen.findByPlaceholderText('Or paste a desktop image URL');
    await waitFor(() => expect(desktopUrlInput).toHaveValue('/initial-banner.jpg'));
    fireEvent.change(desktopUrlInput, { target: { value: '/unsaved-banner.jpg' } });

    let refreshPromise = Promise.resolve();
    await act(async () => {
      refreshPromise = queryClient.invalidateQueries({ queryKey: siteSettingsQueryKey.adminHeroImage() });
    });

    await waitFor(() => expect(getHeroImageMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('status', { name: 'Loading site settings' })).not.toBeInTheDocument();
    expect(desktopUrlInput).toHaveValue('/unsaved-banner.jpg');

    await act(async () => {
      refreshRequest.resolve({ data: { value: { url: '/refreshed-banner.jpg' } } });
      await refreshPromise;
    });

    expect(getHeroImageMock).toHaveBeenCalledTimes(2);
    expect(desktopUrlInput).toHaveValue('/unsaved-banner.jpg');
    expect(screen.getByRole('img', { name: 'Desktop hero preview' })).toHaveAttribute('src', '/unsaved-banner.jpg');
  });

  it('applies refreshed settings when the form has no unsaved edits', async () => {
    const queryClient = createQueryClient();
    getHeroImageMock
      .mockResolvedValueOnce({ data: { value: { url: '/initial-banner.jpg' } } })
      .mockResolvedValueOnce({ data: { value: { url: '/refreshed-banner.jpg' } } });

    render(
      <QueryClientProvider client={queryClient}>
        <SiteSettings />
      </QueryClientProvider>,
    );

    const desktopUrlInput = await screen.findByPlaceholderText('Or paste a desktop image URL');
    await waitFor(() => expect(desktopUrlInput).toHaveValue('/initial-banner.jpg'));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: siteSettingsQueryKey.adminHeroImage() });
    });

    await waitFor(() => expect(desktopUrlInput).toHaveValue('/refreshed-banner.jpg'));
    expect(screen.getByRole('img', { name: 'Desktop hero preview' })).toHaveAttribute('src', '/refreshed-banner.jpg');
  });

  it('keeps edits made while a save request is in flight', async () => {
    const queryClient = createQueryClient();
    const saveRequest = promiseConstructorWithResolvers.withResolvers<{ data: { value: { url: string } } }>();
    getHeroImageMock
      .mockResolvedValueOnce({ data: { value: { url: '/initial-banner.jpg' } } })
      .mockResolvedValueOnce({ data: { value: { url: '/submitted-banner.jpg' } } });
    updateHeroImageMock.mockReturnValue(saveRequest.promise);

    render(
      <QueryClientProvider client={queryClient}>
        <SiteSettings />
      </QueryClientProvider>,
    );

    const desktopUrlInput = await screen.findByPlaceholderText('Or paste a desktop image URL');
    await waitFor(() => expect(desktopUrlInput).toHaveValue('/initial-banner.jpg'));
    fireEvent.change(desktopUrlInput, { target: { value: '/submitted-banner.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateHeroImageMock).toHaveBeenCalledOnce());
    fireEvent.change(desktopUrlInput, { target: { value: '/newer-unsaved-banner.jpg' } });

    await act(async () => {
      saveRequest.resolve({ data: { value: { url: '/submitted-banner.jpg' } } });
    });

    await waitFor(() => expect(getHeroImageMock).toHaveBeenCalledTimes(2));
    expect(desktopUrlInput).toHaveValue('/newer-unsaved-banner.jpg');
    expect(screen.getByRole('img', { name: 'Desktop hero preview' })).toHaveAttribute('src', '/newer-unsaved-banner.jpg');
  });
});
