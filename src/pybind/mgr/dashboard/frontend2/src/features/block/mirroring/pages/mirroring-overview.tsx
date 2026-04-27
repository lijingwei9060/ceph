import { Shield, RefreshCw } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { useMirroringSummary } from '../api/use-mirroring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

const HEALTH_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  0: { label: 'OK', variant: 'default' },
  1: { label: 'Unknown', variant: 'secondary' },
  2: { label: 'Warning', variant: 'secondary' },
  3: { label: 'Error', variant: 'destructive' },
  4: { label: 'Disabled', variant: 'secondary' },
  5: { label: 'Info', variant: 'default' },
};

interface PoolRow {
  pool_name: string;
  mirror_mode: string;
  peer_count: number;
  image_error: number;
  image_syncing: number;
  image_ready: number;
}

export function MirroringOverviewPage() {
  const { data: summary, isLoading, refetch } = useMirroringSummary();

  const pools: PoolRow[] = (summary?.content_data?.pools ?? []).map((p) => ({
    pool_name: p.pool_name,
    mirror_mode: p.mirror_mode,
    peer_count: p.peer_uuids?.length ?? 0,
    image_error: p.image_error?.length ?? 0,
    image_syncing: p.image_syncing?.length ?? 0,
    image_ready: p.image_ready?.length ?? 0,
  }));

  const health = HEALTH_MAP[summary?.status ?? 1] ?? HEALTH_MAP[1];

  const columns: ColumnDef<PoolRow>[] = [
    {
      accessorKey: 'pool_name',
      header: 'Pool',
      cell: ({ row }) => <span className="font-medium">{row.original.pool_name}</span>,
    },
    {
      accessorKey: 'mirror_mode',
      header: 'Mode',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.mirror_mode}</Badge>
      ),
    },
    {
      accessorKey: 'peer_count',
      header: 'Peers',
      cell: ({ row }) => row.original.peer_count,
    },
    {
      accessorKey: 'image_ready',
      header: 'Ready',
      cell: ({ row }) => row.original.image_ready,
    },
    {
      accessorKey: 'image_syncing',
      header: 'Syncing',
      cell: ({ row }) => row.original.image_syncing,
    },
    {
      accessorKey: 'image_error',
      header: 'Errors',
      cell: ({ row }) => (
        <span className={row.original.image_error > 0 ? 'text-destructive font-medium' : ''}>
          {row.original.image_error}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RBD Mirroring</h1>
          {summary?.site_name && (
            <Badge variant="outline" className="ml-2">
              Site: {summary.site_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={health.variant}>Health: {health.label}</Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pools.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Syncing Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.content_data?.image_syncing?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary?.content_data?.image_error?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mirroring Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pools}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
