import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { useBoostPayFastHandoff } from '@/hooks/useBoostPayFastHandoff';

const { mutateAsyncMock, showErrorToastMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  showErrorToastMock: vi.fn(),
}));

vi.mock('@/queries/clientBoost.query', () => ({
  useStartPayFastBoostCheckoutMutation: () => ({ mutateAsync: mutateAsyncMock }),
}));
vi.mock('@/lib/errorToast', () => ({ showErrorToast: showErrorToastMock }));

describe('useBoostPayFastHandoff', () => {
  it('resets the busy state when the start-failure handler throws', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('start failed'));
    showErrorToastMock.mockImplementation(() => {
      throw new Error('toast failed');
    });
    const { result } = renderHook(() => useBoostPayFastHandoff('Could not start.'));

    await act(async () => {
      await expect(
        result.current.startHandoff({ listingId: 'listing-1', purchaseId: 'purchase-1' }),
      ).rejects.toThrow('toast failed');
    });

    expect(result.current.starting).toBe(false);
  });
});
