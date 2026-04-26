import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Cloud, RefreshCw } from 'lucide-react';
import { useRgwDaemons } from '../api/use-rgw-daemon';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RgwDaemonDetailDialog } from '../components/rgw-daemon-detail';

export function RgwDaemonListPage() {
  const { data: daemons = [], isLoading, refetch } = useRgwDaemons();
  const [detailSvcId, setDetailSvcId] = useState<string | null>(null);

  const columns: ColumnDef<(typeof daemons)[0]>[] = [
    {
      accessorKey: 'id',
      header: 'Daemon ID',
      cell: ({ row }) => (
        <button
          className="font-medium font-mono text-primary hover:underline"
          onClick={() => setDetailSvcId(row.original.id)}
        >
          {row.original.id}
        </button>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => row.original.version ?? '-',
    },
    {
      accessorKey: 'server_hostname',
      header: 'Host',
      cell: ({ row }) => row.original.server_hostname ?? '-',
    },
    {
      accessorKey: 'zonegroup_name',
      header: 'Zone Group',
      cell: ({ row }) => row.original.zonegroup_name ?? '-',
    },
    {
      accessorKey: 'zone_name',
      header: 'Zone',
      cell: ({ row }) => row.original.zone_name ?? '-',
    },
    {
      accessorKey: 'default',
      header: 'Default',
      cell: ({ row }) => (
        row.original.default
          ? <Badge variant="default">Yes</Badge>
          : <Badge variant="secondary">No</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RGW Daemons</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={daemons}
        searchKey="id"
        searchPlaceholder="Filter by daemon ID..."
        isLoading={isLoading}
      />

      <RgwDaemonDetailDialog
        svcId={detailSvcId}
        open={detailSvcId !== null}
        onClose={() => setDetailSvcId(null)}
      />
    </div>
  );
}
