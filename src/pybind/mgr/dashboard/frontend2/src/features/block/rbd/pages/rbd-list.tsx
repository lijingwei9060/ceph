import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HardDrive, Plus, Trash2, Copy, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { type RbdImage, useRbdImages, useDeleteRbd, useMoveRbdToTrash } from '../api/use-rbd';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDimlessBinary } from '@/lib/format';
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
import { RbdForm } from '../components/rbd-form';

export function RbdListPage() {
  const { t } = useTranslation();
  const { data: images = [], isLoading, refetch } = useRbdImages();
  const deleteRbd = useDeleteRbd();
  const moveToTrash = useMoveRbdToTrash();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editImage, setEditImage] = useState<RbdImage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ image: RbdImage; permanent: boolean } | null>(null);

  const columns: ColumnDef<RbdImage>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'pool_name',
      header: 'Pool',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.pool_name}</Badge>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => formatDimlessBinary(row.original.size),
    },
    {
      accessorKey: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.features?.slice(0, 3).map((f) => (
            <Badge key={f} variant="secondary" className="text-xs">
              {f}
            </Badge>
          ))}
          {row.original.features && row.original.features.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.original.features.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'num_snaps',
      header: 'Snapshots',
      cell: ({ row }) => row.original.num_snaps ?? 0,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (!status || status === 'up') return <Badge variant="default">up</Badge>;
        return <Badge variant="secondary">{status}</Badge>;
      },
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
            <DropdownMenuItem onClick={() => setEditImage(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Clone
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm({ image: row.original, permanent: false })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Move to Trash
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm({ image: row.original, permanent: true })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { image, permanent } = deleteConfirm;
    try {
      if (permanent) {
        await deleteRbd.mutateAsync({ poolName: image.pool_name, imageName: image.name });
        toast.success(`RBD ${image.name} deleted permanently`);
      } else {
        await moveToTrash.mutateAsync({ poolName: image.pool_name, imageName: image.name });
        toast.success(`RBD ${image.name} moved to trash`);
      }
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete RBD image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.block/rbd')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create RBD
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={images}
        searchKey="name"
        searchPlaceholder="Filter RBD images..."
        isLoading={isLoading}
      />

      <Dialog open={!!editImage} onOpenChange={() => setEditImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit RBD: {editImage?.name}</DialogTitle>
          </DialogHeader>
          {editImage && (
            <RbdForm
              initialData={editImage}
              onSuccess={() => setEditImage(null)}
              onCancel={() => setEditImage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.permanent ? 'Delete RBD Permanently' : 'Move RBD to Trash'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm?.permanent
              ? `Are you sure you want to permanently delete RBD "${deleteConfirm?.image.name}"? This cannot be undone.`
              : `Are you sure you want to move RBD "${deleteConfirm?.image.name}" to trash?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRbd.isPending || moveToTrash.isPending}
            >
              {deleteRbd.isPending || moveToTrash.isPending
                ? 'Deleting...'
                : deleteConfirm?.permanent
                ? 'Delete'
                : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create RBD Image</DialogTitle>
          </DialogHeader>
          <RbdForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
