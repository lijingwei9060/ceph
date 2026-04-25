import ky, { type KyInstance } from 'ky';

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

function createAuthHook() {
  return [
    (request: Request) => {
      const token = getToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
    },
  ];
}

function createUnauthorizedHook() {
  return [
    (_request: Request, _options: RequestInit, response: Response) => {
      if (response.status === 401) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.hash = '#/login';
        return new Response(null, { status: 401 });
      }
      return response;
    },
  ];
}

/** Build Ceph API versioned Accept header */
export function cephAcceptHeader(major: number, minor: number): string {
  return `application/vnd.ceph.api.v${major}.${minor}+json`;
}

// APIRouter endpoints: /api/...
// All RESTController endpoints require a versioned Accept header.
// Default version is v1.0 (APIVersion.DEFAULT). Without this, the backend
// returns 415 because it cannot parse the version from plain application/json.
export const apiClient: KyInstance = ky.create({
  prefixUrl: '/api',
  headers: {
    Accept: 'application/vnd.ceph.api.v1.0+json',
  },
  hooks: {
    beforeRequest: createAuthHook(),
    afterResponse: createUnauthorizedHook(),
  },
});

// Versioned API clients for endpoints that require specific API versions
// These are used by passing { headers: { Accept: cephAcceptHeader(x, y) } } to individual calls

// UIRouter endpoints: /ui-api/...
export const uiApiClient: KyInstance = ky.create({
  prefixUrl: '/ui-api',
  headers: {
    Accept: 'application/json',
  },
  hooks: {
    beforeRequest: createAuthHook(),
    afterResponse: createUnauthorizedHook(),
  },
});

export function createClusterClient(baseUrl: string, token: string): KyInstance {
  return ky.create({
    prefixUrl: baseUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}
