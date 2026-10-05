import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUserDetailsDialog from '@/components/admin/AdminUserDetailsDialog';

const userService = vi.hoisted(() => ({
  getAdminUserById: vi.fn(),
  createAdminUser: vi.fn(),
  getAdminUserAuditHistory: vi.fn(),
  listAdminUsers: vi.fn(),
  updateAdminUserProfile: vi.fn(),
  updateAdminUserStatus: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/services/user.service', () => userService);

const errorToast = vi.hoisted(() => vi.fn());

vi.mock('@/lib/errorToast', () => ({ showErrorToast: errorToast }));

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

const auditHistoryResponse = {
  data: [{
    id: 'audit-id',
    actor: {
      id: 'admin-id',
      email: 'admin@example.com',
      firstName: 'Noor',
      lastName: 'Khan',
    },
    changedFields: ['firstName', 'address'],
    eventType: 'PROFILE_EDITED',
    reason: null,
    resultingStatus: null,
    createdAt: '2026-09-12T14:30:00.000Z',
  }],
  message: 'Audit history loaded',
  pagination: { currentPage: 1, lastPage: 2, nextPage: 2, perPage: 10, prevPage: null, total: 11 },
  statusCode: 200,
};

const statusAuditHistoryResponse = {
  ...auditHistoryResponse,
  data: [{
    id: 'status-audit-id',
    actor: {
      id: 'admin-id',
      email: 'admin@example.com',
      firstName: 'Noor',
      lastName: 'Khan',
    },
    changedFields: ['status'],
    eventType: 'STATUS_CHANGED',
    reason: 'Policy violation',
    resultingStatus: 'INACTIVE',
    createdAt: '2026-10-03T14:30:00.000Z',
  }],
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
    userService.getAdminUserAuditHistory.mockReset().mockResolvedValue(auditHistoryResponse);
    userService.updateAdminUserProfile.mockReset().mockResolvedValue(detailResponse);
    userService.updateAdminUserStatus.mockReset();
    errorToast.mockReset();
  });

  it('shows editable profile fields, read-only account details, and a profile image', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    expect(await within(dialog).findByAltText('Amina Raza profile')).toHaveAttribute('src', 'https://images.example.com/amina.jpg');
    expect(within(dialog).getByLabelText('First name')).toHaveValue('Amina');
    expect(within(dialog).getByLabelText('Last name')).toHaveValue('Raza');
    expect(within(dialog).getByText('amina@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('+923001234567')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Address')).toHaveValue('15 Garden Road, Lahore');
    expect(within(dialog).getByText('Jun 17, 1994')).toBeInTheDocument();
    expect(within(dialog).getByText('Aug 3, 2026')).toBeInTheDocument();
    expect(within(dialog).getByText('Active')).toBeInTheDocument();
    expect(within(dialog).getByText('Consented')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('textbox')).toHaveLength(3);
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

  it('prefills editable profile fields and keeps email and phone read-only', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    expect(await within(dialog).findByLabelText('First name')).toHaveValue('Amina');
    expect(within(dialog).getByLabelText('Last name')).toHaveValue('Raza');
    expect(within(dialog).getByLabelText('Address')).toHaveValue('15 Garden Road, Lahore');
    expect(within(dialog).getByText('amina@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('+923001234567')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('textbox')).toHaveLength(3);
  });

  it('shows validation when no profile field changed', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    await within(dialog).findByLabelText('First name');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Change at least one profile field before saving.');
    expect(userService.updateAdminUserProfile).not.toHaveBeenCalled();
  });

  it('shows field validation and submits only the changed profile fields', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    await within(dialog).findByLabelText('First name');
    fireEvent.change(within(dialog).getByLabelText('First name'), { target: { value: '  ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }));
    expect(await within(dialog).findByText('First name is required.')).toBeInTheDocument();
    expect(userService.updateAdminUserProfile).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('First name'), { target: { value: 'Amina Noor' } });
    fireEvent.change(within(dialog).getByLabelText('Address'), { target: { value: '22 Canal Road, Lahore' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(userService.updateAdminUserProfile).toHaveBeenCalledWith('user-id', {
      address: '22 Canal Road, Lahore',
      firstName: 'Amina Noor',
    }));
    expect(userService.updateAdminUserProfile.mock.calls[0][1]).not.toHaveProperty('email');
    expect(userService.updateAdminUserProfile.mock.calls[0][1]).not.toHaveProperty('phone');
  });

  it('renders profile audit details and requests the next audit page', async () => {
    userService.getAdminUserAuditHistory
      .mockResolvedValueOnce(auditHistoryResponse)
      .mockResolvedValueOnce({
        ...auditHistoryResponse,
        data: [{ ...auditHistoryResponse.data[0], id: 'audit-id-page-2', changedFields: ['lastName'] }],
        pagination: { ...auditHistoryResponse.pagination, currentPage: 2, nextPage: null, prevPage: 1 },
      });
    renderDialog();

    const dialog = await screen.findByRole('dialog', { name: 'User details' });
    const history = await within(dialog).findByRole('region', { name: 'Profile and status history' });
    expect(await within(history).findByText(/Edited by Noor Khan/)).toHaveTextContent(/Sep 12, 2026/);
    expect(within(history).getByText('Changed fields: First name, Address')).toBeInTheDocument();
    expect(within(history).queryByText(/old value|new value/i)).not.toBeInTheDocument();
    expect(within(history).getByText('Page 1 of 2')).toBeInTheDocument();

    fireEvent.click(within(history).getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(userService.getAdminUserAuditHistory).toHaveBeenCalledWith('user-id', { page: 2, size: 10 }));
    expect(await within(history).findByText('Page 2 of 2')).toBeInTheDocument();
    expect(within(history).getByText('Changed fields: Last name')).toBeInTheDocument();
  });

  it('requires a reason before suspending and refreshes the status and history after success', async () => {
    const inactiveDetailResponse = {
      ...detailResponse,
      data: { ...detailResponse.data, status: 'INACTIVE' },
    };
    userService.getAdminUserById.mockResolvedValue(inactiveDetailResponse).mockResolvedValueOnce(detailResponse);
    userService.getAdminUserAuditHistory.mockResolvedValue(statusAuditHistoryResponse).mockResolvedValueOnce(auditHistoryResponse);
    const statusResponse = { data: { status: 'INACTIVE' }, message: 'User status updated', statusCode: 200 };
    userService.updateAdminUserStatus.mockResolvedValue(statusResponse);

    renderDialog();

    const details = await screen.findByRole('dialog', { name: 'User details' });
    expect(await within(details).findByRole('button', { name: 'Suspend user' })).toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Reactivate user' })).not.toBeInTheDocument();
    fireEvent.click(within(details).getByRole('button', { name: 'Suspend user' }));

    const confirmation = await screen.findByRole('dialog', { name: 'Suspend user' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm suspension' }));
    expect(await within(confirmation).findByText('Reason is required.')).toBeInTheDocument();
    fireEvent.change(within(confirmation).getByLabelText('Reason'), { target: { value: ' '.repeat(3) } });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm suspension' }));
    expect(await within(confirmation).findByText('Reason is required.')).toBeInTheDocument();
    expect(userService.updateAdminUserStatus).not.toHaveBeenCalled();

    fireEvent.change(within(confirmation).getByLabelText('Reason'), { target: { value: '  Policy violation  ' } });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm suspension' }));

    await waitFor(() => expect(userService.updateAdminUserStatus).toHaveBeenCalledWith('user-id', {
      reason: 'Policy violation',
      status: 'INACTIVE',
    }));
    expect(await within(details).findByText('Inactive', { exact: true })).toBeInTheDocument();
    const history = await within(details).findByRole('region', { name: 'Profile and status history' });
    expect(within(history).getByText(/Status changed by Noor Khan/)).toHaveTextContent(/Oct 3, 2026/);
    expect(await within(history).findByText('Reason: Policy violation')).toBeInTheDocument();
    expect(within(history).getByText('Resulting status: Inactive')).toBeInTheDocument();
    expect(userService.getAdminUserById).toHaveBeenCalledTimes(2);
    expect(userService.getAdminUserAuditHistory).toHaveBeenCalledTimes(2);
  });

  it('reactivates inactive users with a reason and shows the updated status event', async () => {
    const inactiveDetailResponse = {
      ...detailResponse,
      data: { ...detailResponse.data, status: 'INACTIVE' },
    };
    const activeDetailResponse = {
      ...detailResponse,
      data: { ...detailResponse.data, status: 'ACTIVE' },
    };
    const reactivationHistoryResponse = {
      ...statusAuditHistoryResponse,
      data: [{
        ...statusAuditHistoryResponse.data[0],
        id: 'reactivation-audit-id',
        reason: 'Appeal resolved',
        resultingStatus: 'ACTIVE',
      }],
    };
    userService.getAdminUserById.mockResolvedValue(activeDetailResponse).mockResolvedValueOnce(inactiveDetailResponse);
    userService.getAdminUserAuditHistory.mockResolvedValue(reactivationHistoryResponse).mockResolvedValueOnce(auditHistoryResponse);
    userService.updateAdminUserStatus.mockResolvedValue({ data: { status: 'ACTIVE' }, message: 'User status updated', statusCode: 200 });

    renderDialog();

    const details = await screen.findByRole('dialog', { name: 'User details' });
    expect(await within(details).findByRole('button', { name: 'Reactivate user' })).toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Suspend user' })).not.toBeInTheDocument();
    fireEvent.click(within(details).getByRole('button', { name: 'Reactivate user' }));

    const confirmation = await screen.findByRole('dialog', { name: 'Reactivate user' });
    fireEvent.change(within(confirmation).getByLabelText('Reason'), { target: { value: 'Appeal resolved' } });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm reactivation' }));

    await waitFor(() => expect(userService.updateAdminUserStatus).toHaveBeenCalledWith('user-id', {
      reason: 'Appeal resolved',
      status: 'ACTIVE',
    }));
    expect(await within(details).findByText('Active', { exact: true })).toBeInTheDocument();
    const history = await within(details).findByRole('region', { name: 'Profile and status history' });
    expect(within(history).getByText(/Status changed by Noor Khan/)).toHaveTextContent(/Oct 3, 2026/);
    expect(await within(history).findByText('Reason: Appeal resolved')).toBeInTheDocument();
    expect(within(history).getByText('Resulting status: Active')).toBeInTheDocument();
  });

  it('keeps unsaved profile edits when the details refresh after a status change', async () => {
    const inactiveDetailResponse = {
      ...detailResponse,
      data: { ...detailResponse.data, status: 'INACTIVE' },
    };
    userService.getAdminUserById.mockResolvedValue(inactiveDetailResponse).mockResolvedValueOnce(detailResponse);
    userService.updateAdminUserStatus.mockResolvedValue({ data: { status: 'INACTIVE' }, message: 'User status updated', statusCode: 200 });
    renderDialog();

    const details = await screen.findByRole('dialog', { name: 'User details' });
    fireEvent.change(await within(details).findByLabelText('First name'), { target: { value: 'Amina Noor' } });
    fireEvent.click(within(details).getByRole('button', { name: 'Suspend user' }));
    const confirmation = await screen.findByRole('dialog', { name: 'Suspend user' });
    fireEvent.change(within(confirmation).getByLabelText('Reason'), { target: { value: 'Policy violation' } });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm suspension' }));

    expect(await within(details).findByText('Inactive', { exact: true })).toBeInTheDocument();
    expect(within(details).getByLabelText('First name')).toHaveValue('Amina Noor');
    expect(within(details).getByLabelText('Last name')).toHaveValue('Raza');
  });

  it('discards unsaved profile edits when the dialog is reopened or another user is selected', async () => {
    const otherDetailResponse = {
      ...detailResponse,
      data: { ...detailResponse.data, firstName: 'Bilal', lastName: 'Ahmed' },
    };
    userService.getAdminUserById.mockImplementation(async (userId: string) =>
      userId === 'other-user-id' ? otherDetailResponse : detailResponse);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const renderWith = (userId: string | null) => (
      <QueryClientProvider client={queryClient}>
        <AdminUserDetailsDialog userId={userId} onClose={vi.fn()} open={userId !== null} />
      </QueryClientProvider>
    );
    const { rerender } = render(renderWith('user-id'));

    fireEvent.change(await screen.findByLabelText('First name'), { target: { value: 'Amina Noor' } });
    rerender(renderWith(null));
    rerender(renderWith('user-id'));
    await waitFor(() => expect(screen.getByLabelText('First name')).toHaveValue('Amina'));

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Amina Noor' } });
    rerender(renderWith(null));
    rerender(renderWith('other-user-id'));
    await waitFor(() => expect(screen.getByLabelText('First name')).toHaveValue('Bilal'));
    expect(screen.getByLabelText('Last name')).toHaveValue('Ahmed');
  });

  it('keeps the displayed status and history unchanged and shows an error when a transition fails', async () => {
    const failure = new Error('Request failed');
    userService.updateAdminUserStatus.mockRejectedValue(failure);
    renderDialog();

    const details = await screen.findByRole('dialog', { name: 'User details' });
    fireEvent.click(await within(details).findByRole('button', { name: 'Suspend user' }));
    const confirmation = await screen.findByRole('dialog', { name: 'Suspend user' });
    fireEvent.change(within(confirmation).getByLabelText('Reason'), { target: { value: 'Policy violation' } });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm suspension' }));

    await waitFor(() => expect(errorToast).toHaveBeenCalledWith(failure, 'Failed to suspend user.'));
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
    expect(within(details).getByText('Active', { exact: true })).toBeInTheDocument();
    expect(userService.getAdminUserById).toHaveBeenCalledTimes(1);
    expect(userService.getAdminUserAuditHistory).toHaveBeenCalledTimes(1);
    const history = within(details).getByRole('region', { name: 'Profile and status history' });
    expect(within(history).getByText('Changed fields: First name, Address')).toBeInTheDocument();
    expect(within(history).queryByText('Reason: Policy violation')).not.toBeInTheDocument();
    expect(confirmation).not.toBeInTheDocument();
  });
});
