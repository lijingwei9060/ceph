import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Trash2, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { type RbdTrashItem, useRbdTrash, useRestoreRbd, usePurgeRbd } from '../api/use-rbd';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function RbdTrashPage() {
  const { data: trashItems = [], isLoading, refetch } = useRbdTrash();
  const restoreRbd = useRestoreRbd();
  const purgeRbd = usePurgeRbd();
  const [restoreConfirm, setRestoreConfirm] = useState<RbdTrashItem | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState<RbdTrashItem | null>(null);

  const columns: ColumnDef<RbdTrashItem>[] = [
    {
      accessorKey: 'original_name',
      header: 'Original Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.original_name || row.original.name}</span>
      ),
    },
    {
      accessorKey: 'pool_name',
      header: 'Pool',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.pool_name}</Badge>
      ),
    },
    {
      accessorKey: 'deletion_time',
      header: 'Deleted At',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.deletion_time).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'deferment_end_time',
      header: 'Expires At',
      cell: ({ row }) => {
        const expired = new Date(row.original.deferment_end_time) < new Date();
        return (
          <Badge variant={expired ? 'destructive' : 'secondary'}>
            {new Date(row.original.deferment_end_time).toLocaleString()}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRestoreConfirm(row.original)}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Restore
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setPurgeConfirm(row.original)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Purge
          </Button>
        </div>
      ),
    },
  ];

  const handleRestore = async () => {
    if (!restoreConfirm) return;
    try {
      const imageIdSpec = `${restoreConfirm.pool_name}/${restoreConfirm.name}`;
      await restoreRbd.mutateAsync({
        imageIdSpec,
        newImageName: restoreConfirm.original_name || restoreConfirm.name,
      });
      toast.success(`RBD ${restoreConfirm.original_name || restoreConfirm.name} restored`);
      setRestoreConfirm(null);
    } catch {
      toast.error('Failed to restore RBD');
    }
  };

  const handlePurge = async () => {
    if (!purgeConfirm) return;
    try {
      const imageIdSpec = `${purgeConfirm.pool_name}/${purgeConfirm.name}`;
      await purgeRbd.mutateAsync({ imageIdSpec });
      toast.success(`RBD ${purgeConfirm.original_name || purgeConfirm.name} permanently deleted`);
      setPurgeConfirm(null);
    } catch {
      toast.error('Failed to purge RBD');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RBD Trash</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable columns={columns} data={trashItems} isLoading={isLoading} />

      <Dialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore RBD Image</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Restore <strong>{restoreConfirm?.original_name || restoreConfirm?.name}</strong> from
            trash? It will be moved back to the RBD images list.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoreRbd.isPending}>
              {restoreRbd.isPending ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!purgeConfirm} onOpenChange={() => setPurgeConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete RBD
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{purgeConfirm?.original_name || purgeConfirm?.name}</strong>.
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePurge} disabled={purgeRbd.isPending}>
              {purgeRbd.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
