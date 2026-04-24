import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Users, RefreshCw, Trash2 } from 'lucide-react';
import { useRgwUsers, useDeleteRgwUser } from '../api/use-rgw-user';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function RgwUserListPage() {
  const { t } = useTranslation();
  const { data: users = [], isLoading, refetch } = useRgwUsers();
  const deleteUser = useDeleteRgwUser();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser.mutateAsync(deleteConfirm);
      toast.success(`User ${deleteConfirm} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const columns: ColumnDef<(typeof users)[0]>[] = [
    {
      accessorKey: 'user_id',
      header: 'User ID',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.user_id}</span>
      ),
    },
    {
      accessorKey: 'display_name',
      header: 'Display Name',
      cell: ({ row }) => row.original.display_name || '-',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'suspended',
      header: 'Status',
      cell: ({ row }) => (
        row.original.suspended
          ? <Badge variant="secondary">Suspended</Badge>
          : <Badge variant="default">Active</Badge>
      ),
    },
    {
      accessorKey: 'max_buckets',
      header: 'Max Buckets',
      cell: ({ row }) => row.original.max_buckets ?? '-',
    },
    {
      accessorKey: 'keys',
      header: 'Keys',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.keys?.length ?? 0}</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => setDeleteConfirm(row.original.user_id)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RGW Users</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="user_id"
        searchPlaceholder="Filter by user ID..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete RGW User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete user <strong>{deleteConfirm}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
