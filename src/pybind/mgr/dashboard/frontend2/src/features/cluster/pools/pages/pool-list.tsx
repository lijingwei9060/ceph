import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Database, RefreshCw, Trash2, Plus, Pencil } from 'lucide-react';
import { usePools, useDeletePool, type Pool } from '../api/use-pool';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDimlessBinary } from '@/lib/format';
import { toast } from 'sonner';
import { PoolForm } from '../components/pool-form';
import { useErasureCodeProfiles as useEcProfiles } from '../api/use-ec-profile';

function PoolTypeBadge({ type }: { type: string }) {
  if (type === 'replicated') return <Badge variant="default">Replicated</Badge>;
  if (type === 'erasure') return <Badge variant="secondary">Erasure Coded</Badge>;
  return <Badge variant="outline">{type}</Badge>;
}

function DataProtectionCell({ pool, ecProfiles }: { pool: Pool; ecProfiles?: Array<{ name: string; k: number; m: number }> }) {
  if (pool.type === 'replicated') {
    return <Badge variant="outline" className="text-xs">replica: x{pool.size ?? '-'}</Badge>;
  }
  if (pool.type === 'erasure' && pool.erasure_code_profile) {
    const profile = ecProfiles?.find((p) => p.name === pool.erasure_code_profile);
    if (profile) {
      return <Badge variant="outline" className="text-xs">EC: {profile.k}+{profile.m}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">EC: {pool.erasure_code_profile}</Badge>;
  }
  return '-';
}

function UsageBar({ pool }: { pool: Pool }) {
  const bytesUsed = pool.stats?.bytes_used?.latest ?? 0;
  const percentUsed = pool.stats?.percent_used?.latest;
  if (!bytesUsed && !percentUsed) return <span className="text-xs text-muted-foreground">-</span>;

  const percent = percentUsed != null ? percentUsed * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDimlessBinary(bytesUsed)}</span>
        {percentUsed != null && <span>{percent.toFixed(1)}%</span>}
      </div>
    </div>
  );
}

export function PoolListPage() {
  const { data: pools = [], isLoading, refetch } = usePools(true);
  const { data: ecProfiles } = useEcProfiles();
  const deletePool = useDeletePool();
  const [deleteConfirm, setDeleteConfirm] = useState<Pool | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editPool, setEditPool] = useState<Pool | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredPools = typeFilter === 'all' ? pools : pools.filter((p) => p.type === typeFilter);

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
      id: 'data_protection',
      header: 'Data Protection',
      cell: ({ row }) => <DataProtectionCell pool={row.original} ecProfiles={ecProfiles} />,
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
      cell: ({ row }) => (
        <span>
          {row.original.pg_num}
          {row.original.pg_num_target != null && row.original.pg_num !== row.original.pg_num_target && (
            <span className="text-muted-foreground text-xs ml-1">→ {row.original.pg_num_target}</span>
          )}
        </span>
      ),
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
      id: 'usage',
      header: 'Usage',
      cell: ({ row }) => <UsageBar pool={row.original} />,
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
            <DropdownMenuItem onClick={() => setEditPool(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Pools</h1>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="replicated">Replicated</SelectItem>
              <SelectItem value="erasure">Erasure Coded</SelectItem>
            </SelectContent>
          </Select>
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
        data={filteredPools}
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
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePool.isPending}>
              {deletePool.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Pool</DialogTitle>
          </DialogHeader>
          <PoolForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPool} onOpenChange={() => setEditPool(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pool: {editPool?.pool_name}</DialogTitle>
          </DialogHeader>
          {editPool && (
            <PoolForm initialData={editPool} onSuccess={() => setEditPool(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
