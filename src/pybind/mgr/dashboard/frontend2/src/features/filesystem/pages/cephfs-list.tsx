import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Files, RefreshCw } from 'lucide-react';
import { useCephFsList } from '../api/use-cephfs';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CephFsDetailDialog } from '../components/cephfs-detail';

export function CephFsListPage() {
  const { t } = useTranslation();
  const { data: filesystems = [], isLoading, refetch } = useCephFsList();
  const [detailFsId, setDetailFsId] = useState<number | null>(null);

  const columns: ColumnDef<(typeof filesystems)[0]>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => setDetailFsId(row.original.id)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'metadata_pool_name',
      header: 'Metadata Pool',
      cell: ({ row }) => row.original.metadata_pool_name || row.original.metadata_pool,
    },
    {
      id: 'data_pools',
      header: 'Data Pools',
      cell: ({ row }) => {
        const pools = row.original.data_pool_names;
        if (!pools?.length) return '-';
        return pools.length;
      },
    },
    {
      accessorKey: 'max_mds',
      header: 'Max MDS',
      cell: ({ row }) => row.original.max_mds ?? '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Files className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">File Systems</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filesystems}
        searchKey="name"
        searchPlaceholder="Filter by name..."
        isLoading={isLoading}
      />

      <CephFsDetailDialog
        fsId={detailFsId}
        open={detailFsId !== null}
        onClose={() => setDetailFsId(null)}
      />
    </div>
  );
}
