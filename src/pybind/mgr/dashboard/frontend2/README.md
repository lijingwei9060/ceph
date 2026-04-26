# Ceph Dashboard Frontend 2

React-based dashboard for Ceph storage cluster management.

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router 7 (Hash Router)
- **Internationalization**: react-i18next (13 languages)
- **Testing**: Vitest + Playwright

## Development

### Prerequisites

- Node.js 18+
- pnpm 10+

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build for production
pnpm build
```

### Project Structure

```
src/
├── components/         # Shared UI components
│   ├── layouts/        # Page layouts (Workbench, Login)
│   └── ui/             # shadcn/ui components
├── features/           # Feature modules
│   ├── auth/           # Authentication
│   ├── cluster/        # Cluster management (hosts, OSD, monitors, etc.)
│   ├── block/          # Block storage (RBD, iSCSI, NFS)
│   ├── filesystem/     # CephFS
│   ├── rgw/            # Object gateway
│   ├── monitoring/     # Alerts, rules, silences, Grafana
│   ├── settings/       # Dashboard settings
│   └── user-management/# Users and roles
├── hooks/              # Shared hooks
├── i18n/               # Internationalization
├── lib/                # Utilities
├── routes/             # Route configuration
├── stores/             # Zustand stores
└── types/              # TypeScript types
```

### Feature Module Structure

Each feature follows this structure:

```
feature/
├── api/                # API hooks (TanStack Query)
│   ├── use-feature.ts
│   └── use-feature.test.tsx
├── components/         # Feature-specific components
└── pages/              # Page components
```

### API Integration

API calls use TanStack Query for caching and state management:

```typescript
// Example: useQuery
export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: async () => apiClient.get('hosts').json(),
  });
}

// Example: useMutation
export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (host) => apiClient.post('hosts', { json: host }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hosts'] }),
  });
}
```

### Adding a New Page

1. Create feature module: `src/features/my-feature/`
2. Create API hooks: `src/features/my-feature/api/use-my-feature.ts`
3. Create page component: `src/features/my-feature/pages/my-page.tsx`
4. Add route in `src/routes/index.tsx` (use lazy loading)
5. Add navigation in `src/routes/nav-config.ts`
6. Add translations in `src/i18n/locales/*.json`

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

### Supported Languages

- English (en-US) - default
- German (de)
- Spanish (es)
- French (fr)
- Italian (it)
- Japanese (ja)
- Korean (ko)
- Polish (pl)
- Portuguese Brazil (pt-BR)
- Russian (ru)
- Turkish (tr)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)

## Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

Build output in `dist/`:
- `index.html` - Entry point
- `assets/` - JS, CSS, and other assets

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

## Code Style

- ESLint for linting
- Prettier for formatting
- lint-staged for pre-commit hooks

```bash
# Format code
pnpm format

# Check formatting
pnpm format:check

# Lint
pnpm lint
```

## License

See the main Ceph repository for license information.
