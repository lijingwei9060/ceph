import '@testing-library/jest-dom/vitest';
import '@/i18n';
import { vi } from 'vitest';

// Mock the api-client module to prevent real HTTP calls in tests
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(() => ({
      json: vi.fn(() => Promise.resolve({})),
      text: vi.fn(() => Promise.resolve('')),
    })),
  },
  createClusterClient: vi.fn(),
}));
