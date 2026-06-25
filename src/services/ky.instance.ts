import { tokenStorage } from '@/lib/tokenStorage';
import base, { API_BASE_URL } from './ky-base-instance';

interface RefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

const refreshState: {
  isRefreshing: boolean;
  waitingQueue: Array<(newToken: string | null) => void>;
} = {
  isRefreshing: false,
  waitingQueue: [],
};

export const refreshInstance = base.extend({
  baseUrl: API_BASE_URL,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
          request.headers.set('Authorization', `Bearer ${refreshToken}`);
        }
      },
    ],
  },
});

export function refresh() {
  return refreshInstance
    .post('/api/v1/auth/refresh', { context: { skipAuthRefresh: true } })
    .json<RefreshResponse>();
}

async function runRefresh(): Promise<string | null> {
  try {
    const body = await refresh();
    tokenStorage.set(body.data.accessToken, body.data.refreshToken);
    return body.data.accessToken;
  }
  catch {
    return null;
  }
}

async function attemptRefresh(): Promise<string | null> {
  if (refreshState.isRefreshing) {
    return new Promise((resolve) => {
      refreshState.waitingQueue.push(resolve);
    });
  }

  refreshState.isRefreshing = true;
  const newToken = await runRefresh();
  refreshState.isRefreshing = false;
  for (const callback of refreshState.waitingQueue) callback(newToken);
  refreshState.waitingQueue = [];
  return newToken;
}

function expireSession() {
  tokenStorage.clear();
  if (globalThis && location.pathname !== '/auth') {
    location.assign('/auth');
  }
}

export const authInstance = base.extend({
  baseUrl: API_BASE_URL,
  hooks: {
    afterResponse: [
      async ({ options, request, response }) => {
        if (response.status !== 401 || options.context?.skipAuthRefresh) {
          return response;
        }

        const newToken = await attemptRefresh();
        if (!newToken) {
          expireSession();
          throw new Error('Session expired. Please login again.');
        }

        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${newToken}`);

        return authInstance(request, {
          ...options,
          headers,
        });
      },
    ],
    beforeRequest: [
      ({ request }) => {
        const accessToken = tokenStorage.getAccess();
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`);
        }
      },
    ],
  },
});
