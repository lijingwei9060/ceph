import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Shield, RefreshCw, Trash2, Plus, Pencil, Copy } from 'lucide-react';
import { useRoles, useDeleteRole, useCloneRole, type Role } from '../api/use-role';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { RoleForm } from '../components/role-form';

function ScopeCount({ role }: { role: Role }) {
  const count = Object.keys(role.scopes_permissions).length;
  return <span>{count} scope{count !== 1 ? 's' : ''}</span>;
}

export function RoleListPage() {
  const { t } = useTranslation();
  const { data: roles = [], isLoading, refetch } = useRoles();
  const deleteMutation = useDeleteRole();
  const cloneMutation = useCloneRole();
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [cloneRole, setCloneRole] = useState<Role | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.name);
      toast.success(`Role ${deleteConfirm.name} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '-',
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => <ScopeCount role={row.original} />,
    },
    {
      accessorKey: 'system',
      header: 'System',
      cell: ({ row }) => (
        row.original.system
          ? <Badge variant="secondary">System</Badge>
          : <Badge variant="outline">Custom</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const isSystem = row.original.system;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Shield className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setEditRole(row.original)}
                disabled={isSystem}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCloneRole(row.original)}>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={isSystem}
                onClick={() => setDeleteConfirm(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Roles</h1>
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
        data={roles}
        searchKey="name"
        searchPlaceholder="Filter by role name..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete role{' '}
            <strong>{deleteConfirm?.name}</strong>?
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <RoleForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={() => setEditRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editRole?.name}</DialogTitle>
          </DialogHeader>
          {editRole && (
            <RoleForm initialData={editRole} onSuccess={() => setEditRole(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cloneRole} onOpenChange={() => setCloneRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clone Role: {cloneRole?.name}</DialogTitle>
          </DialogHeader>
          {cloneRole && (
            <RoleForm cloneFrom={cloneRole} onSuccess={() => setCloneRole(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
