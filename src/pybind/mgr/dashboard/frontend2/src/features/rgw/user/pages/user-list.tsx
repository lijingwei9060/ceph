import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Users, RefreshCw, Trash2, Plus, Pencil, Eye, MoreHorizontal } from 'lucide-react';
import { useRgwUsers, useDeleteRgwUser, type RgwUser } from '../api/use-rgw-user';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { RgwUserForm } from '../components/rgw-user-form';
import { RgwUserDetailDialog } from '../components/rgw-user-detail';

export function RgwUserListPage() {
  const { t } = useTranslation();
  const { data: users = [], isLoading, refetch } = useRgwUsers();
  const deleteUser = useDeleteRgwUser();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<RgwUser | null>(null);
  const [detailUser, setDetailUser] = useState<RgwUser | null>(null);

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
        <button
          className="font-mono font-medium text-primary hover:underline"
          onClick={() => setDetailUser(row.original)}
        >
          {row.original.user_id}
        </button>
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
      cell: ({ row }) => {
        const v = row.original.max_buckets;
        return v === -1 ? 'Disabled' : v === 0 ? 'Unlimited' : v;
      },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailUser(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditUser(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original.user_id)}
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
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RGW Users</h1>
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
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create RGW User</DialogTitle>
          </DialogHeader>
          <RgwUserForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.user_id}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <RgwUserForm initialData={editUser} onSuccess={() => setEditUser(null)} />
          )}
        </DialogContent>
      </Dialog>

      <RgwUserDetailDialog
        user={detailUser}
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
      />
    </div>
  );
}
