export const API_VERSION = 'v1.0';

export const API_ACCEPT_HEADER = `application/vnd.ceph.api.${API_VERSION}+json`;

export function parseApiVersion(acceptHeader: string): string | null {
  const match = acceptHeader.match(/application\/vnd\.ceph\.api\.(v[\d.]+)\+json/);
  return match ? match[1] : null;
}

export function buildApiUrl(path: string): string {
  return `/api/${path.replace(/^\//, '')}`;
}
