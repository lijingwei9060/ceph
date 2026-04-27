import '@testing-library/jest-dom/vitest';
import '@/i18n';
import { vi } from 'vitest';

// Mock the api-client module to prevent real HTTP calls in tests
const mockJson = vi.fn(() => Promise.resolve({}));
const mockText = vi.fn(() => Promise.resolve(''));

function createMockMethod() {
  const fn = vi.fn(() => ({
    json: mockJson,
    text: mockText,
  }));
  return fn;
}

const mockGet = createMockMethod();
const mockPost = createMockMethod();
const mockPut = createMockMethod();
const mockDelete = createMockMethod();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
  uiApiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
  cephAcceptHeader: (major: number, minor: number) =>
    `application/vnd.ceph.api.v${major}.${minor}+json`,
  createClusterClient: vi.fn(),
}));

export { mockGet, mockPost, mockPut, mockDelete, mockJson, mockText };
