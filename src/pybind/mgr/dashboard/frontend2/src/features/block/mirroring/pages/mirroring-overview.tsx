import { Shield } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  useMirroringStats,
  useMirroringPools,
} from '../api/use-mirroring';
import type { MirroringPool } from '../api/use-mirroring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

export function MirroringOverviewPage() {
  const { data: stats } = useMirroringStats();
  const { data: pools = [], isLoading: poolsLoading } = useMirroringPools();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">RBD Mirroring</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daemons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.daemons ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pools ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Provisioned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.provisioned_images ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_images ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mirroring Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={poolColumns}
            data={pools}
            isLoading={poolsLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const poolColumns: ColumnDef<MirroringPool>[] = [
  {
    accessorKey: 'name',
    header: 'Pool',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.mode}</Badge>
    ),
  },
  {
    accessorKey: 'peers',
    header: 'Peers',
    cell: ({ row }) => row.original.peers ?? 0,
  },
  {
    accessorKey: 'images',
    header: 'Images',
    cell: ({ row }) => row.original.images ?? 0,
  },
];
