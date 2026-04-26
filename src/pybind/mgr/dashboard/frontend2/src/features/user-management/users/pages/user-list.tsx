import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Users, RefreshCw, Trash2, Plus, Pencil } from 'lucide-react';
import { useDashboardUsers, useDeleteDashboardUser, useUpdateDashboardUser, type DashboardUser } from '../api/use-dashboard-user';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { UserForm } from '../components/user-form';

function formatDate(ts: number) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleDateString();
}

export function UserListPage() {
  const { t } = useTranslation();
  const { data: users = [], isLoading, refetch } = useDashboardUsers();
  const deleteMutation = useDeleteDashboardUser();
  const updateMutation = useUpdateDashboardUser();
  const [deleteConfirm, setDeleteConfirm] = useState<DashboardUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<DashboardUser | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.username);
      toast.success(`User ${deleteConfirm.username} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleEnabled = async (user: DashboardUser) => {
    try {
      await updateMutation.mutateAsync({
        username: user.username,
        enabled: !user.enabled,
      });
      toast.success(`User ${user.username} ${user.enabled ? 'disabled' : 'enabled'}`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const columns: ColumnDef<DashboardUser>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => <span className="font-medium">{row.original.username}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name || '-',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (!roles?.length) return '-';
        return roles.map((role) => (
          <Badge key={role} variant="outline" className="mr-1">{role}</Badge>
        ));
      },
    },
    {
      accessorKey: 'enabled',
      header: 'Enabled',
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
          {row.original.enabled ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastUpdate',
      header: 'Last Update',
      cell: ({ row }) => formatDate(row.original.lastUpdate),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Users className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditUser(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleEnabled(row.original)}>
              {row.original.enabled ? 'Disable' : 'Enable'}
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
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Users</h1>
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
        searchKey="username"
        searchPlaceholder="Filter by username..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete user{' '}
            <strong>{deleteConfirm?.username}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <UserForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm initialData={editUser} onSuccess={() => setEditUser(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
