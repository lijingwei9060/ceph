import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Database, RefreshCw, Trash2, Plus } from 'lucide-react';
import { usePools, useDeletePool, type Pool } from '../api/use-pool';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PoolCreateForm } from '../components/pool-create-form';

function PoolTypeBadge({ type }: { type: string }) {
  if (type === 'replicated') return <Badge variant="default">Replicated</Badge>;
  if (type === 'erasure') return <Badge variant="secondary">Erasure Coded</Badge>;
  return <Badge variant="outline">{type}</Badge>;
}

export function PoolListPage() {
  const { t } = useTranslation();
  const { data: pools = [], isLoading, refetch } = usePools(true);
  const deletePool = useDeletePool();
  const [deleteConfirm, setDeleteConfirm] = useState<Pool | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const columns: ColumnDef<Pool>[] = [
    {
      accessorKey: 'pool',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium">{row.original.pool}</span>,
    },
    {
      accessorKey: 'pool_name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.pool_name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <PoolTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => row.original.size ?? '-',
    },
    {
      accessorKey: 'crush_rule',
      header: 'CRUSH Rule',
      cell: ({ row }) => row.original.crush_rule ?? '-',
    },
    {
      accessorKey: 'pg_num',
      header: 'PGs',
      cell: ({ row }) => row.original.pg_num,
    },
    {
      accessorKey: 'pg_autoscale_mode',
      header: 'Autoscale',
      cell: ({ row }) => (
        <Badge variant={row.original.pg_autoscale_mode === 'on' ? 'default' : 'outline'}>
          {row.original.pg_autoscale_mode ?? 'unknown'}
        </Badge>
      ),
    },
    {
      accessorKey: 'application_metadata',
      header: 'Applications',
      cell: ({ row }) => {
        const apps = row.original.application_metadata;
        if (!apps?.length) return '-';
        return apps.map((app) => (
          <Badge key={app} variant="outline" className="mr-1">{app}</Badge>
        ));
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Database className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePool.mutateAsync(deleteConfirm.pool_name);
      toast.success(`Pool ${deleteConfirm.pool_name} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete pool');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Pools</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pools}
        searchKey="pool_name"
        searchPlaceholder="Filter by pool name..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pool</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete pool{' '}
            <strong>{deleteConfirm?.pool_name}</strong>? All data in this pool will be lost.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePool.isPending}
            >
              {deletePool.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Pool</DialogTitle>
          </DialogHeader>
          <PoolCreateForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
