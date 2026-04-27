import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Shield, RefreshCw, Trash2, Plus, Pencil, Copy } from 'lucide-react';
import { useRoles, useDeleteRole, type Role } from '../api/use-role';
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
import { RoleForm } from '../components/role-form';

function ScopeCount({ role, t }: { role: Role; t: (key: string) => string }) {
  const count = Object.keys(role.scopes_permissions).length;
  return <span>{count} {t('userManagement.roles.permissions').toLowerCase()}{count !== 1 ? '' : ''}</span>;
}

export function RoleListPage() {
  const { t } = useTranslation();
  const { data: roles = [], isLoading, refetch } = useRoles();
  const deleteMutation = useDeleteRole();
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [cloneRole, setCloneRole] = useState<Role | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.name);
      toast.success(`${t('userManagement.roles.title')} ${deleteConfirm.name} ${t('common.deleted').toLowerCase()}`);
      setDeleteConfirm(null);
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: t('userManagement.roles.name'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: t('userManagement.roles.description'),
      cell: ({ row }) => row.original.description || '-',
    },
    {
      id: 'permissions',
      header: t('userManagement.roles.permissions'),
      cell: ({ row }) => <ScopeCount role={row.original} t={t} />,
    },
    {
      accessorKey: 'system',
      header: t('userManagement.roles.system'),
      cell: ({ row }) => (
        row.original.system
          ? <Badge variant="secondary">{t('userManagement.roles.system')}</Badge>
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
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCloneRole(row.original)}>
                <Copy className="mr-2 h-4 w-4" />
                {t('userManagement.roles.clone')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={isSystem}
                onClick={() => setDeleteConfirm(row.original)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
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
          <h1 className="text-2xl font-semibold">{t('userManagement.roles.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.refresh')}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('common.create')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        searchKey="name"
        searchPlaceholder={`${t('common.filter')}...`}
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userManagement.roles.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('messages.confirmDelete')}{' '}
            <strong>{deleteConfirm?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? `${t('common.delete')}...` : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userManagement.roles.create')}</DialogTitle>
          </DialogHeader>
          <RoleForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={() => setEditRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userManagement.roles.edit')}: {editRole?.name}</DialogTitle>
          </DialogHeader>
          {editRole && (
            <RoleForm initialData={editRole} onSuccess={() => setEditRole(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cloneRole} onOpenChange={() => setCloneRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userManagement.roles.clone')}: {cloneRole?.name}</DialogTitle>
          </DialogHeader>
          {cloneRole && (
            <RoleForm cloneFrom={cloneRole} onSuccess={() => setCloneRole(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
