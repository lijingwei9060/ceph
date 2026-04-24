import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Server, Trash2, MoreHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { useIscsiStatus, useIscsiOverview, useIscsiTargets, useDeleteIscsiTarget } from '../api/use-iscsi';
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
import { useTranslation } from 'react-i18next';

export function IscsiOverviewPage() {
  const { t } = useTranslation();
  const { data: status } = useIscsiStatus();
  const { data: overview } = useIscsiOverview();
  const { data: targets = [], isLoading: targetsLoading, refetch } = useIscsiTargets();
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
      accessorKey: 'acl_enabled',
      header: 'ACL',
      cell: ({ row }) => (
        <Badge variant={row.original.acl_enabled ? 'default' : 'outline'}>
          {row.original.acl_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'portals',
      header: 'Portals',
      cell: ({ row }) => row.original.portals?.length ?? 0,
    },
    {
      accessorKey: 'disks',
      header: 'Disks',
      cell: ({ row }) => row.original.disks?.length ?? 0,
    },
    {
      accessorKey: 'clients',
      header: 'Clients',
      cell: ({ row }) => row.original.clients?.length ?? 0,
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

  if (status && !status.available) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">iSCSI Gateways</h1>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">iSCSI is not available</p>
              {status.message && (
                <p className="text-sm text-muted-foreground">{status.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">iSCSI Gateways</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Disks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targets.reduce((sum, t) => sum + (t.disks?.length ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targets.reduce((sum, t) => sum + (t.clients?.length ?? 0), 0)}
            </div>
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
