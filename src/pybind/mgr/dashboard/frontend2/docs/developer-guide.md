# Developer Guide

## Architecture Overview

The Ceph Dashboard Frontend 2 is a React-based single-page application (SPA) that uses a hash router for navigation. This allows it to be served from any static file server without requiring server-side routing.

### Key Design Decisions

1. **Hash Router**: Uses `createHashRouter` from react-router to handle client-side routing with `#` URLs
2. **Feature-based Organization**: Code is organized by feature rather than by file type
3. **Lazy Loading**: All page components are lazily loaded for optimal bundle size
4. **API Layer**: TanStack Query handles all API state, caching, and invalidation

## Directory Structure

```
src/
├── components/           # Shared/reusable components
│   ├── layouts/          # Page layout components
│   │   ├── workbench-layout.tsx  # Main authenticated layout
│   │   └── login-layout.tsx       # Login page layout
│   └── ui/               # shadcn/ui primitive components
│
├── features/             # Feature modules (see below)
│
├── hooks/                # Global/shared custom hooks
│   ├── use-auth.ts       # Authentication state
│   └── use-permission.ts # Permission checking
│
├── i18n/                 # Internationalization
│   ├── index.ts          # i18next configuration
│   └── locales/          # Translation files
│
├── lib/                  # Utilities and helpers
│   ├── api-client.ts     # HTTP client (Ky)
│   ├── crud.ts           # Generic CRUD hooks
│   └── utils.ts          # Utility functions
│
├── routes/               # Route configuration
│   ├── index.tsx         # Route definitions
│   ├── nav-config.ts     # Navigation menu config
│   └── auth-guard.tsx    # Authentication protection
│
├── stores/               # Zustand global stores
│   └── auth-store.ts     # Authentication state
│
└── types/                # TypeScript type definitions
    ├── permissions.ts    # Permission scopes
    └── health.ts         # Health check types
```

## Feature Module Structure

Each feature is self-contained with its own API, components, and pages:

```
features/my-feature/
├── api/
│   ├── use-my-feature.ts       # API hooks
│   └── use-my-feature.test.tsx # API hook tests
├── components/
│   └── my-form.tsx             # Feature-specific components
└── pages/
    └── my-list.tsx             # Page components
```

### API Hooks Pattern

Use TanStack Query for all API operations:

```typescript
// use-my-feature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Type definitions
export interface MyItem {
  id: string;
  name: string;
}

// GET list
export function useMyItems() {
  return useQuery<MyItem[]>({
    queryKey: ['my-items'],
    queryFn: async () => apiClient.get('my-items').json(),
  });
}

// GET single
export function useMyItem(id: string) {
  return useQuery<MyItem>({
    queryKey: ['my-items', id],
    queryFn: async () => apiClient.get(`my-items/${id}`).json(),
    enabled: !!id,
  });
}

// CREATE
export function useCreateMyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<MyItem>) =>
      apiClient.post('my-items', { json: item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
    },
  });
}

// UPDATE
export function useUpdateMyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...item }: Partial<MyItem> & { id: string }) =>
      apiClient.put(`my-items/${id}`, { json: item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
    },
  });
}

// DELETE
export function useDeleteMyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`my-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
    },
  });
}
```

## Adding a New Feature

### Step 1: Create Feature Directory

```bash
mkdir -p src/features/my-feature/{api,components,pages}
```

### Step 2: Create API Hooks

Create `src/features/my-feature/api/use-my-feature.ts` with your API hooks.

### Step 3: Create Page Component

Create `src/features/my-feature/pages/my-page.tsx`:

```typescript
import { useMyItems } from '../api/use-my-feature';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

export function MyListPage() {
  const { data, isLoading } = useMyItems();

  const columns: ColumnDef<MyItem>[] = [
    { accessorKey: 'name', header: 'Name' },
    // ...
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Items</h1>
      <DataTable columns={columns} data={data || []} isLoading={isLoading} />
    </div>
  );
}
```

### Step 4: Add Route

Update `src/routes/index.tsx`:

```typescript
// Add lazy import at the top
const MyListPage = lazy(() =>
  import('@/features/my-feature/pages/my-page').then(m => ({ default: m.MyListPage }))
);

// Add route in the children array
{ path: 'my-feature', element: <LazyPage component={MyListPage} /> },
```

### Step 5: Add Navigation

Update `src/routes/nav-config.ts`:

```typescript
{
  key: 'my-feature',
  label: 'My Feature',
  path: '/my-feature',
  icon: 'SomeIcon',
  permission: 'myPermission',
},
```

### Step 6: Add Translations

Update all locale files in `src/i18n/locales/`:

```json
{
  "nav": {
    "myFeature": "My Feature"
  },
  "myFeature": {
    "title": "My Items",
    "name": "Name"
  }
}
```

## Authentication

The app uses token-based authentication stored in localStorage:

```typescript
// Check authentication
const { isAuthenticated, username } = useAuth();

// Login
await login(username, password);

// Logout
logout();
```

## Permissions

Permissions are checked using the `usePermission` hook:

```typescript
const { hasPermission } = usePermission();

if (hasPermission('osd')) {
  // User can access OSD features
}
```

## State Management

### Global State (Zustand)

Use Zustand for client-only state:

```typescript
// stores/my-store.ts
import { create } from 'zustand';

interface MyState {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

### Server State (TanStack Query)

Use TanStack Query for server data:

```typescript
// Automatic caching, background refetching, invalidation
const { data, isLoading, error, refetch } = useMyItems();
```

## Testing

### Unit Tests

Test API hooks with mocked apiClient:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyItems } from './use-my-feature';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useMyItems', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches items', async () => {
    (apiClient.get as any).mockReturnValue({ json: () => Promise.resolve([{ id: '1' }]) });

    const { result } = renderHook(() => useMyItems(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
```

### E2E Tests

Write E2E tests for critical user flows:

```typescript
import { test, expect } from '@playwright/test';

test('should create item', async ({ page }) => {
  await page.goto('/#/my-feature');

  await page.getByRole('button', { name: /create/i }).click();
  await page.getByLabel(/name/i).fill('Test Item');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.getByText('Test Item')).toBeVisible();
});
```

## Styling

### Tailwind CSS

Use Tailwind utility classes:

```typescript
<div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
  <span className="text-sm text-muted-foreground">Label</span>
</div>
```

### shadcn/ui Components

Add components as needed:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
```

## Internationalization

Use the `useTranslation` hook:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('myFeature.title')}</h1>;
}
```

## Best Practices

1. **Lazy load pages**: All pages should be lazily loaded
2. **Use TypeScript**: Maintain type safety throughout
3. **Test API hooks**: Write tests for all API hooks
4. **Follow naming conventions**:
   - Components: PascalCase (`MyComponent.tsx`)
   - Hooks: camelCase with `use` prefix (`use-my-feature.ts`)
   - Files: kebab-case (`my-page.tsx`)
5. **Keep components small**: Extract reusable components
6. **Use path aliases**: Import with `@/` prefix
