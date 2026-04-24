import { useQuery } from '@tanstack/react-query';
import { uiApiClient } from '@/lib/api-client';

export interface Motd {
  message: string;
  md5: string;
  severity: 'info' | 'warning' | 'danger';
  expires: string;
}

export function useMotd() {
  return useQuery<Motd | null>({
    queryKey: ['motd'],
    queryFn: async () => {
      try {
        return await uiApiClient.get('motd').json<Motd>();
      } catch {
        return null;
      }
    },
    refetchInterval: 60_000,
    retry: false,
  });
}
