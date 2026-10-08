import base from '@/services/ky-base-instance';

describe('shared Ky error handling', () => {
  it('shows a friendly message for network failures', async () => {
    const client = base.extend({
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
      retry: 0,
    });

    await expect(client.get('https://example.com/resource')).rejects.toMatchObject({
      message: 'Request failed. Please check your internet connection.',
      name: 'NetworkError',
    });
  });
});
