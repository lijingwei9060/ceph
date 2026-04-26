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
      toast.success(`${t('userManagement.users.title')} ${deleteConfirm.username} ${t('common.deleted').toLowerCase()}`);
      setDeleteConfirm(null);
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const handleToggleEnabled = async (user: DashboardUser) => {
    try {
      await updateMutation.mutateAsync({
        username: user.username,
        enabled: !user.enabled,
      });
      toast.success(`${t('userManagement.users.title')} ${user.username} ${user.enabled ? t('common.disabled').toLowerCase() : t('common.enabled').toLowerCase()}`);
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const columns: ColumnDef<DashboardUser>[] = [
    {
      accessorKey: 'username',
      header: t('userManagement.users.username'),
      cell: ({ row }) => <span className="font-medium">{row.original.username}</span>,
    },
    {
      accessorKey: 'name',
      header: t('userManagement.users.name'),
      cell: ({ row }) => row.original.name || '-',
    },
    {
      accessorKey: 'email',
      header: t('userManagement.users.email'),
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'roles',
      header: t('userManagement.users.roles'),
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
      header: t('userManagement.users.enabled'),
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
          {row.original.enabled ? t('common.yes') : t('common.no')}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastUpdate',
      header: t('userManagement.users.lastUpdate'),
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
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleEnabled(row.original)}>
              {row.original.enabled ? t('common.disabled') : t('common.enabled')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
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
          <h1 className="text-2xl font-semibold">{t('userManagement.users.title')}</h1>
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
        data={users}
        searchKey="username"
        searchPlaceholder={`${t('common.filter')}...`}
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userManagement.users.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('messages.confirmDelete')}{' '}
            <strong>{deleteConfirm?.username}</strong>?
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
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userManagement.users.create')}</DialogTitle>
          </DialogHeader>
          <UserForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userManagement.users.edit')}: {editUser?.username}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm initialData={editUser} onSuccess={() => setEditUser(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
