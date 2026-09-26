import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditProfileDialog } from '@/components/EditProfileDialog';

const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn() }));

vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferencesQuery: () => ({ data: undefined, isError: true, isPending: false }),
}));
vi.mock('@/queries/myProfile.query', () => ({
  useUpdateProfileMutation: () => ({ isPending: false, mutate: mutateMock }),
}));
vi.mock('@/services/profile.service', () => ({ uploadProfileFile: vi.fn() }));

describe('profile edit WhatsApp behavior', () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  it('removes the consent control and always sends true on profile updates', async () => {
    render(<EditProfileDialog profile={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Profile' }));

    expect(screen.queryByText('Transactional WhatsApp messages')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        expect.objectContaining({ whatsappTransactionalNotificationsEnabled: true }),
        expect.any(Object),
      );
    });
  });
});
