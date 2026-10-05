import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagement from '@/pages/admin/UserManagement';

const userService = vi.hoisted(() => ({
  getAdminUserById: vi.fn(),
  createAdminUser: vi.fn(),
  getAdminUserAuditHistory: vi.fn(),
  listAdminUsers: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/services/user.service', () => userService);

const listResponse = {
  data: [{
    id: 'user-id',
    roleId: null,
    address: '15 Garden Road',
    email: 'amina@example.com',
    firstName: 'Amina',
    image: null,
    lastName: 'Raza',
    marketingEmailConsent: true,
    phone: '+923001234567',
    roleName: null,
    status: 'ACTIVE',
    termsVersion: null,
    username: 'amina-raza',
    marketingEmailConsentUpdatedAt: null,
    termsAcceptedAt: null,
    createdAt: '2026-08-03T10:30:00.000Z',
    updatedAt: '2026-08-03T10:30:00.000Z',
  }],
  message: 'Users loaded',
  pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 20, prevPage: null, total: 1 },
  statusCode: 200,
};

const detailResponse = {
  data: {
    address: '15 Garden Road',
    dateOfBirth: '1994-06-17',
    email: 'amina@example.com',
    firstName: 'Amina',
    image: null,
    lastName: 'Raza',
    marketingEmailConsent: true,
    phone: '+923001234567',
    status: 'ACTIVE',
    createdAt: '2026-08-03T10:30:00.000Z',
  },
  message: 'User loaded',
  statusCode: 200,
};

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <UserManagement />
    </QueryClientProvider>,
  );
}

describe('platform Users details', () => {
  beforeEach(() => {
    userService.listAdminUsers.mockReset().mockResolvedValue(listResponse);
    userService.getAdminUserById.mockReset().mockResolvedValue(detailResponse);
    userService.getAdminUserAuditHistory.mockReset().mockResolvedValue({
      data: [],
      message: 'Audit history loaded',
      pagination: { currentPage: 1, lastPage: 1, nextPage: null, perPage: 10, prevPage: null, total: 0 },
      statusCode: 200,
    });
  });

  it('opens the selected user details and closes the dialog', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'View details for Amina Raza' }));

    expect(await screen.findByRole('dialog', { name: 'User details' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Address')).toHaveValue('15 Garden Road');
    expect(userService.getAdminUserById).toHaveBeenCalledWith('user-id');

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'User details' })).not.toBeInTheDocument());
    expect(screen.getByText('Platform Users')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-1 of 1')).toBeInTheDocument();
  });

  it('keeps the user list available when loading details fails', async () => {
    userService.getAdminUserById.mockRejectedValue(new Error('Request failed'));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Search by name or email'), { target: { value: 'Amina' } });
    fireEvent.click(await screen.findByRole('button', { name: 'View details for Amina Raza' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load user details. Please try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));

    expect(screen.getByText('Platform Users')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name or email')).toHaveValue('Amina');
    expect(screen.getByText('Showing 1-1 of 1')).toBeInTheDocument();
  });

  it('keeps the current search, status, and page after closing user details', async () => {
    userService.listAdminUsers.mockResolvedValue({
      ...listResponse,
      pagination: { ...listResponse.pagination, lastPage: 2, nextPage: 2, total: 21 },
    });
    renderPage();

    const statusFilter = screen.getByRole('combobox');
    fireEvent.keyDown(statusFilter, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Active' }));
    fireEvent.change(screen.getByPlaceholderText('Search by name or email'), { target: { value: 'Amina' } });
    await waitFor(() => expect(screen.getByText('Showing 1-20 of 21')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('Showing 21-21 of 21')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'View details for Amina Raza' }));
    await screen.findByRole('dialog', { name: 'User details' });
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));

    expect(screen.getByPlaceholderText('Search by name or email')).toHaveValue('Amina');
    expect(screen.getByRole('combobox')).toHaveTextContent('Active');
    expect(screen.getByText('Showing 21-21 of 21')).toBeInTheDocument();
  });
});
