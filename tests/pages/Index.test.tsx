import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '@/pages/Index';

vi.mock('@/components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('@/components/HeroSection', () => ({ default: () => <div data-testid="hero-section" /> }));
vi.mock('@/components/CategoryGrid', () => ({ default: () => <div data-testid="category-grid" /> }));
vi.mock('@/components/WhyShopWithUs', () => ({ default: () => <div data-testid="why-shop-with-us" /> }));
vi.mock('@/components/TopFAQs', () => ({ default: () => <div data-testid="top-faqs" /> }));
vi.mock('@/components/MobileAppBanner', () => ({ default: () => <div data-testid="mobile-app-banner" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));
const authState = vi.hoisted(() => ({ user: { id: 'buyer-1' } as { id: string } | null }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const featuredListings = [
  { id: 'shared-listing', title: 'Shared listing', brand: 'Brand', categoryValue: 'fashion', price: 100, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
  { id: 'fresh-second', title: 'Fresh second listing', brand: 'Brand', categoryValue: 'fashion', price: 200, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
];
const trendingListings = [
  { id: 'shared-listing', title: 'Shared listing', brand: 'Brand', categoryValue: 'fashion', price: 100, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
  { id: 'boosted-second', title: 'Boosted second listing', brand: 'Brand', categoryValue: 'fashion', price: 300, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
];
const personalizedListings = [
  { id: 'for-you-second', title: 'Picked second listing', brand: 'Brand', categoryValue: 'fashion', price: 400, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
  { id: 'for-you-first', title: 'Picked first listing', brand: 'Brand', categoryValue: 'fashion', price: 500, condition: 'NEW', size: 'M', status: 'APPROVED', images: [] },
];
let onboardingCompleted = true;
let emptyFeed: 'featured' | 'trending' | 'for-you' | null = null;

function response(data: unknown[]) {
  return new Response(JSON.stringify({ data, pagination: { lastPage: 1 } }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

function renderHomepage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  authState.user = { id: 'buyer-1' };
  onboardingCompleted = true;
  emptyFeed = null;
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes('/api/v1/listings/featured'))
      return response(emptyFeed === 'featured' ? [] : featuredListings);
    if (url.includes('/api/v1/listings/trending'))
      return response(emptyFeed === 'trending' ? [] : trendingListings);
    if (url.includes('/api/v1/listings/for-you'))
      return response(emptyFeed === 'for-you' ? [] : personalizedListings);
    if (url.includes('/api/v1/preferences/me'))
      return new Response(JSON.stringify({ data: { onboardingCompleted } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    if (url.includes('/api/v1/boosts/active'))
      return response([{ listingId: 'boosted-second' }]);
    if (url.includes('/api/v1/boosts'))
      return response([]);
    return response([]);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('index page composition', () => {
  it('renders the homepage shell and sections in order', async () => {
    renderHomepage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Picked for You' })).toBeInTheDocument());

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect([...screen.getByRole('main').querySelectorAll('h2')].map(element => element.textContent)).toEqual([
      'Fresh Drops',
      'Trending Now',
      'Picked for You',
    ]);
    expect(screen.getByTestId('mobile-app-banner')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders each ranked feed response independently in its server order', async () => {
    renderHomepage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Picked for You' })).toBeInTheDocument());

    const sections = screen.getAllByRole('heading', { level: 2 }).map(heading => heading.closest('section')!);
    expect(sections.map(section => within(section).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Fresh Drops',
      'Trending Now',
      'Picked for You',
    ]);
    expect(within(sections[0]).getAllByRole('link').map(link => link.getAttribute('aria-label'))).toEqual([
      'Shared listing',
      'Fresh second listing',
    ]);
    expect(within(sections[1]).getAllByRole('link').map(link => link.getAttribute('aria-label'))).toEqual([
      'Shared listing',
      'Boosted second listing',
    ]);
    expect(within(sections[2]).getAllByRole('link').map(link => link.getAttribute('aria-label'))).toEqual([
      'Picked second listing',
      'Picked first listing',
    ]);
  });

  it('hides Picked for You for signed-out buyers', async () => {
    authState.user = null;
    const signedOutFetch = vi.mocked(fetch);
    renderHomepage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Fresh Drops' })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Picked for You' })).not.toBeInTheDocument();
    expect(signedOutFetch.mock.calls.some(([input]) =>
      (input instanceof Request ? input.url : String(input)).includes('/api/v1/listings/for-you'),
    )).toBe(false);
  });

  it('hides Picked for You when onboarding is incomplete', async () => {
    onboardingCompleted = false;
    renderHomepage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Fresh Drops' })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Picked for You' })).not.toBeInTheDocument();
  });

  it.each([
    ['featured', 'Fresh Drops'],
    ['trending', 'Trending Now'],
    ['for-you', 'Picked for You'],
  ] as const)('hides only the %s section when its response is empty', async (feed, hiddenSection) => {
    emptyFeed = feed;
    renderHomepage();

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2));
    expect(screen.queryByRole('heading', { name: hiddenSection })).not.toBeInTheDocument();
    for (const section of ['Fresh Drops', 'Trending Now', 'Picked for You']) {
      if (section !== hiddenSection)
        expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });
});
