import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HeroSection from '@/components/HeroSection';

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/queries/siteSettings.query', () => ({
  getPublicHeroImageOptions: () => ({}),
}));

describe('hero section', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it('shows an accessible muted placeholder while hero settings load', () => {
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <HeroSection />
      </MemoryRouter>,
    );

    const loadingState = screen.getByRole('status', { name: 'Loading hero' });
    expect(loadingState).toHaveClass('min-h-[85vh]', 'bg-muted');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
