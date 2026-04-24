import ky, { type KyInstance } from 'ky';

const CEPH_API_ACCEPT = 'application/vnd.ceph.api.v1.0+json';

const STORAGE_KEY = 'dashboard_token';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export const apiClient: KyInstance = ky.create({
  prefixUrl: '/api',
  headers: {
    Accept: CEPH_API_ACCEPT,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.hash = '#/login';
          return new Response(null, { status: 401 });
        }
        return response;
      },
    ],
  },
});

export function createClusterClient(baseUrl: string, token: string): KyInstance {
  return ky.create({
    prefixUrl: baseUrl,
    headers: {
      Accept: CEPH_API_ACCEPT,
      Authorization: `Bearer ${token}`,
    },
  });
}
