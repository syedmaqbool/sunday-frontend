import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUserDetailsDialog from '@/components/admin/AdminUserDetailsDialog';

const userService = vi.hoisted(() => ({
  getAdminUserById: vi.fn(),
  createAdminUser: vi.fn(),
  listAdminUsers: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/services/user.service', () => userService);

const detailResponse = {
  data: {
    address: '15 Garden Road, Lahore',
    dateOfBirth: '1994-06-17',
    email: 'amina@example.com',
    firstName: 'Amina',
    image: {
      id: 'portrait-id',
      filename: 'amina.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
      url: 'https://images.example.com/amina.jpg',
    },
    lastName: 'Raza',
    marketingEmailConsent: true,
    phone: '+923001234567',
    status: 'ACTIVE',
    createdAt: '2026-08-03T10:30:00.000Z',
  },
  message: 'User loaded',
  statusCode: 200,
};

function renderDialog() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AdminUserDetailsDialog userId="user-id" onClose={vi.fn()} open />
    </QueryClientProvider>,
  );
}

describe('admin user details dialog', () => {
  beforeEach(() => {
    userService.getAdminUserById.mockReset().mockResolvedValue(detailResponse);
  });

  it('shows account fields as read-only text and displays a profile image', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    expect(await within(dialog).findByAltText('Amina Raza profile')).toHaveAttribute('src', 'https://images.example.com/amina.jpg');
    expect(within(dialog).getByText('Amina')).toBeInTheDocument();
    expect(within(dialog).getByText('Raza')).toBeInTheDocument();
    expect(within(dialog).getByText('amina@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('+923001234567')).toBeInTheDocument();
    expect(within(dialog).getByText('15 Garden Road, Lahore')).toBeInTheDocument();
    expect(within(dialog).getByText('Jun 17, 1994')).toBeInTheDocument();
    expect(within(dialog).getByText('Aug 3, 2026')).toBeInTheDocument();
    expect(within(dialog).getByText('Active')).toBeInTheDocument();
    expect(within(dialog).getByText('Consented')).toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows a loading state while the detail request is pending', async () => {
    userService.getAdminUserById.mockReturnValue(new Promise(() => {}));
    renderDialog();

    expect(await screen.findByRole('status')).toHaveTextContent('Loading user details');
  });

  it('shows a recoverable error state when the detail request fails', async () => {
    userService.getAdminUserById.mockRejectedValue(new Error('Request failed'));
    renderDialog();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load user details. Please try again.');
    expect(screen.getByRole('dialog', { name: 'User details' })).toBeInTheDocument();
  });
});
