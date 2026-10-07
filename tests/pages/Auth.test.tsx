import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Auth from '@/pages/Auth';

const { authState, sendOtpMock, signInMock, signUpMock, toastMock } = vi.hoisted(() => ({
  authState: { user: null as { id: string } | null },
  sendOtpMock: vi.fn(),
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked: isChecked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (isChecked: boolean) => void }) => (
    <input
      id={id}
      onChange={event => onCheckedChange(event.currentTarget.checked)}
      checked={isChecked}
      type="checkbox"
    />
  ),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signIn: signInMock, signUp: signUpMock, user: authState.user }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/services/auth.service', () => ({ sendRegisterOtp: sendOtpMock }));
vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({ id, onChange, value }: { id: string; onChange: (value: string) => void; value: string }) => (
    <input id={id} onChange={event => onChange(event.currentTarget.value)} value={value} />
  ),
  InputOTPGroup: ({ children }: any) => <div>{children}</div>,
  InputOTPSlot: () => null,
}));

function Destination({ label }: { label: string }) {
  const location = useLocation();

  return <div data-testid="destination">{`${label}${location.search}`}</div>;
}

function renderAuth(returnTo?: string) {
  return render(
    <MemoryRouter initialEntries={[{
      pathname: '/auth',
      state: returnTo ? { from: returnTo } : null,
    }]}
    >
      <Routes>
        <Route element={<Auth />} path="/auth" />
        <Route element={<Destination label="Index" />} path="/" />
        <Route element={<Destination label="Listings" />} path="/listings" />
        <Route element={<Destination label="Checkout" />} path="/checkout" />
        <Route element={<Destination label="Preferences" />} path="/preferences" />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitLogin() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
}

describe('signup WhatsApp behavior', () => {
  beforeEach(() => {
    authState.user = null;
    sendOtpMock.mockReset().mockResolvedValue(undefined);
    signInMock.mockReset();
    signUpMock.mockReset().mockResolvedValue(undefined);
    toastMock.mockReset();
  });

  it('removes the consent checkbox and always sends true during signup', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.queryByText(/transactional WhatsApp messages/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1 (415) 555-2671' } });
    fireEvent.change(screen.getByLabelText('Date of Birth'), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }));
    await waitFor(() => expect(sendOtpMock).toHaveBeenCalledWith({ email: 'ada@example.com' }));

    fireEvent.change(screen.getByLabelText('OTP Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Terms & Conditions/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({
        phone: '+14155552671',
        whatsappTransactionalNotificationsEnabled: true,
      }));
    });
  });
});

describe('sign-in navigation', () => {
  beforeEach(() => {
    authState.user = null;
    signInMock.mockReset().mockResolvedValue({ preferences: { onboardingCompleted: true } });
    signUpMock.mockReset();
    toastMock.mockReset();
  });

  it('sends a completed sign-in to listings by default', async () => {
    renderAuth();

    await submitLogin();

    expect(await screen.findByTestId('destination')).toHaveTextContent('Listings');
  });

  it('preserves an explicit non-root destination after sign-in', async () => {
    renderAuth('/checkout?source=offer');

    await submitLogin();

    expect(await screen.findByTestId('destination')).toHaveTextContent('Checkout?source=offer');
  });

  it('sends a root destination to listings and preserves its query', async () => {
    renderAuth('/?category=women&source=home#featured');

    await submitLogin();

    expect(await screen.findByTestId('destination')).toHaveTextContent('Listings?category=women&source=home');
  });

  it('sends an already signed-in user to listings by default', async () => {
    authState.user = { id: 'user-id' };
    renderAuth();

    expect(await screen.findByTestId('destination')).toHaveTextContent('Listings');
  });

  it('keeps incomplete onboarding in preferences after sign-in', async () => {
    signInMock.mockResolvedValue({ preferences: { onboardingCompleted: false } });
    renderAuth();

    await submitLogin();

    expect(await screen.findByTestId('destination')).toHaveTextContent('Preferences');
  });
});
