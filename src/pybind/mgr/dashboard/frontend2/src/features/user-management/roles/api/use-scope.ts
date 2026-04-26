import { useQuery } from '@tanstack/react-query';
import { uiApiClient } from '@/lib/api-client';

export function useScopes() {
  return useQuery<string[]>({
    queryKey: ['scopes'],
    queryFn: async () => uiApiClient.get('scope').json<string[]>(),
  });
}
