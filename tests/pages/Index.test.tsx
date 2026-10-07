import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '@/pages/Index';

const authState = vi.hoisted(() => ({
  loading: false,
  user: null as { id: string } | null,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));
vi.mock('@/components/ComingSoonLanding', () => ({
  default: () => <div data-testid="coming-soon">Coming soon</div>,
}));
vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="auth-loading" />,
}));

function ListingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <div data-testid="listings-location">{`${location.pathname}${location.search}${location.hash}`}</div>
      <button onClick={() => navigate(-1)} type="button">Go back</button>
    </>
  );
}

function renderIndex(initialEntries = ['/?category=women&source=home#featured']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route element={<div>Previous page</div>} path="/previous" />
        <Route element={<Index />} path="/" />
        <Route element={<ListingsPage />} path="/listings" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('index route navigation', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = null;
  });

  it('waits for authentication restoration before showing the index', () => {
    authState.loading = true;

    renderIndex();

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('coming-soon')).not.toBeInTheDocument();
  });

  it('shows the current index to guests', () => {
    renderIndex();

    expect(screen.getByTestId('coming-soon')).toBeInTheDocument();
  });

  it('redirects authenticated visitors to listings with the query and replaces history', () => {
    authState.user = { id: 'user-id' };

    renderIndex(['/previous', '/?category=women&source=home#featured']);

    expect(screen.getByTestId('listings-location')).toHaveTextContent('/listings?category=women&source=home');
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('Previous page')).toBeInTheDocument();
  });
});
