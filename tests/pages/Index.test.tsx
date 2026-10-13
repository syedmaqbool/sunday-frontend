import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Index from '@/pages/Index';

vi.mock('@/components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('@/components/HeroSection', () => ({ default: () => <div data-testid="hero-section" /> }));
vi.mock('@/components/CategoryGrid', () => ({ default: () => <div data-testid="category-grid" /> }));
vi.mock('@/components/FeaturedListings', () => ({
  default: ({ variant }: { variant: string }) => <div data-testid={`featured-listings-${variant}`} />,
}));
vi.mock('@/components/WhyShopWithUs', () => ({ default: () => <div data-testid="why-shop-with-us" /> }));
vi.mock('@/components/TrendingProducts', () => ({ default: () => <div data-testid="trending-products" /> }));
vi.mock('@/components/TopFAQs', () => ({ default: () => <div data-testid="top-faqs" /> }));
vi.mock('@/components/MobileAppBanner', () => ({ default: () => <div data-testid="mobile-app-banner" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

describe('index page composition', () => {
  it('renders the homepage shell and sections in order', () => {
    render(<Index />);

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect([...screen.getByRole('main').children].map((element: HTMLElement) => element.dataset.testid)).toEqual([
      'hero-section',
      'category-grid',
      'featured-listings-fresh',
      'why-shop-with-us',
      'trending-products',
      'featured-listings-personalized',
      'top-faqs',
    ]);
    expect(screen.getByTestId('mobile-app-banner')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
