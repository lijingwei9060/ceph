import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Server, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Host } from '@/types';
import { useHosts, useDeleteHost } from '@/features/host/api/use-hosts';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { HostForm } from '../components/host-form';
import { toast } from 'sonner';

export function HostListPage() {
  const { t } = useTranslation();
  const { data: hosts = [], isLoading } = useHosts();
  const deleteHost = useDeleteHost();
  const [editHost, setEditHost] = useState<Host | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Host | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const columns: ColumnDef<Host>[] = [
    {
      accessorKey: 'hostname',
      header: 'Hostname',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.hostname}</span>
      ),
    },
    {
      accessorKey: 'addr',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.addr || '-'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'maintenance'
                ? 'secondary'
                : status === 'offline'
                ? 'destructive'
                : 'default'
            }
          >
            {status || 'online'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'labels',
      header: 'Labels',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.labels?.map((label) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}
            </Badge>
          )) || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'services',
      header: 'Services',
      cell: ({ row }) => {
        const instances = row.original.service_instances;
        if (!instances?.length) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {instances.map((s) => (
              <Badge key={s.type} variant="secondary" className="text-xs">
                {s.type}({s.count})
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'ceph_version',
      header: 'Version',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.ceph_version || '-'}
        </span>
      ),
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
            <DropdownMenuItem onClick={() => setEditHost(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Labels
            </DropdownMenuItem>
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
      await deleteHost.mutateAsync(deleteConfirm.hostname);
      toast.success(`Host ${deleteConfirm.hostname} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete host');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.hosts')}</h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Host
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={hosts}
        searchKey="hostname"
        searchPlaceholder="Filter hosts..."
        isLoading={isLoading}
      />

      <Dialog open={!!editHost} onOpenChange={() => setEditHost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Host: {editHost?.hostname}</DialogTitle>
          </DialogHeader>
          {editHost && (
            <HostForm
              initialData={editHost}
              onSuccess={() => setEditHost(null)}
              onCancel={() => setEditHost(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Host</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete host{' '}
            <strong>{deleteConfirm?.hostname}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteHost.isPending}
            >
              {deleteHost.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Host</DialogTitle>
          </DialogHeader>
          <HostForm onSuccess={() => setShowAddDialog(false)} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
