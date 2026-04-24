import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Server, Trash2, MoreHorizontal } from 'lucide-react';
import { useIscsiOverview, useIscsiTargets, useDeleteIscsiTarget } from '../api/use-iscsi';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function IscsiOverviewPage() {
  const { data: overview } = useIscsiOverview();
  const { data: targets = [], isLoading: targetsLoading } = useIscsiTargets();
  const deleteTarget = useDeleteIscsiTarget();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTarget.mutateAsync(deleteConfirm);
      toast.success('Target deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete target');
    }
  };

  const columns: ColumnDef<(typeof targets)[0]>[] = [
    {
      accessorKey: 'target_iqn',
      header: 'IQN',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.target_iqn}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const ok = row.original.status === 'up';
        return (
          <Badge variant={ok ? 'default' : 'secondary'}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'portals',
      header: 'Portals',
      cell: ({ row }) => row.original.portals?.length ?? 0,
    },
    {
      accessorKey: 'disks',
      header: 'Disks',
      cell: ({ row }) => row.original.disks ?? 0,
    },
    {
      accessorKey: 'clients',
      header: 'Clients',
      cell: ({ row }) => row.original.clients ?? 0,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original.target_iqn)}
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
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">iSCSI Gateways</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.targets ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Portals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.portals ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Disks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.disks ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.clients ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={targets}
        searchKey="target_iqn"
        searchPlaceholder="Filter by IQN..."
        isLoading={targetsLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete iSCSI Target</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete target{' '}
            <strong>{deleteConfirm}</strong>? This may disconnect active clients.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTarget.isPending}
            >
              {deleteTarget.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
