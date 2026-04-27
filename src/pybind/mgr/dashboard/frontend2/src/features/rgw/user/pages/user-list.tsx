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
      toast.success(`${t('rgw.user.title')} ${deleteConfirm} ${t('common.deleted').toLowerCase()}`);
      setDeleteConfirm(null);
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const columns: ColumnDef<(typeof users)[0]>[] = [
    {
      accessorKey: 'user_id',
      header: t('rgw.user.userId'),
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
      header: t('rgw.user.displayName'),
      cell: ({ row }) => row.original.display_name || '-',
    },
    {
      accessorKey: 'email',
      header: t('rgw.user.email'),
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'suspended',
      header: t('common.status'),
      cell: ({ row }) => (
        row.original.suspended
          ? <Badge variant="secondary">{t('rgw.user.suspended')}</Badge>
          : <Badge variant="default">{t('common.active')}</Badge>
      ),
    },
    {
      accessorKey: 'max_buckets',
      header: t('rgw.user.maxBuckets'),
      cell: ({ row }) => {
        const v = row.original.max_buckets;
        return v === -1 ? t('common.disabled') : v === 0 ? 'Unlimited' : v;
      },
    },
    {
      accessorKey: 'keys',
      header: t('rgw.user.keys'),
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
              {t('common.details')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditUser(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original.user_id)}
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
          <h1 className="text-2xl font-semibold">{t('rgw.user.title')}</h1>
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
        searchKey="user_id"
        searchPlaceholder={`${t('common.filter')}...`}
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rgw.user.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('messages.confirmDelete')} <strong>{deleteConfirm}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? `${t('common.delete')}...` : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('rgw.user.create')}</DialogTitle>
          </DialogHeader>
          <RgwUserForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('rgw.user.edit')}: {editUser?.user_id}</DialogTitle>
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
