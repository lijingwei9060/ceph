import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, RefreshCw, Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  timestamp: string;
  priority: string;
  channel: string;
  message: string;
}

interface LogsResponse {
  entries: LogEntry[];
  next_page?: string;
}

export function LogsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [priority, setPriority] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<LogsResponse>({
    queryKey: ['logs'],
    queryFn: async () => {
      const data = await apiClient.get('logs').json<LogsResponse>();
      return data;
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const entries = data?.entries ?? [];
  const filtered = entries.filter((entry) => {
    const matchesFilter = filter
      ? entry.message.toLowerCase().includes(filter.toLowerCase())
      : true;
    const matchesPriority =
      priority === 'all' || entry.priority === priority;
    return matchesFilter && matchesPriority;
  });

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.logs')}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {dataUpdatedAt > 0 && (
            <span>Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-muted' : ''}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 font-mono text-xs space-y-1">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">
                {t('common.loading')}
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('common.noData')}
              </p>
            ) : (
              filtered.map((entry, i) => (
                <div key={i} className="flex gap-3 hover:bg-muted/50 py-1">
                  <span className="text-muted-foreground shrink-0">
                    {entry.timestamp}
                  </span>
                  <Badge
                    variant={
                      entry.priority === 'error'
                        ? 'destructive'
                        : entry.priority === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="shrink-0 text-xs"
                  >
                    {entry.priority}
                  </Badge>
                  <span className="text-foreground break-all">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
