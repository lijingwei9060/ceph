import ky, { type KyInstance } from 'ky';

const CEPH_API_ACCEPT = 'application/vnd.ceph.api.v1.0+json';

export const apiClient: KyInstance = ky.create({
  prefixUrl: '/api',
  headers: {
    Accept: CEPH_API_ACCEPT,
  },
  hooks: {
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
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
