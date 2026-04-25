import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { FolderOpen, RefreshCw, Trash2, Plus, AlertCircle } from 'lucide-react';
import { useNfsStatus, useNfsExports, useDeleteNfsExport } from '../api/use-nfs';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { NfsExportForm } from '../components/nfs-export-form';

export function NfsListPage() {
  const { t } = useTranslation();
  const { data: status } = useNfsStatus();
  const { data: exports = [], isLoading, refetch } = useNfsExports();
  const deleteExport = useDeleteNfsExport();
  const [deleteConfirm, setDeleteConfirm] = useState<{ clusterId: string; exportId: number } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteExport.mutateAsync(deleteConfirm);
      toast.success('NFS export deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete NFS export');
    }
  };

  const columns: ColumnDef<(typeof exports)[0]>[] = [
    {
      accessorKey: 'export_id',
      header: 'Export ID',
      cell: ({ row }) => <span className="font-medium">{row.original.export_id}</span>,
    },
    {
      accessorKey: 'path',
      header: 'Path',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.path}</span>,
    },
    {
      accessorKey: 'cluster_id',
      header: 'Cluster',
    },
    {
      accessorKey: 'pseudo',
      header: 'Pseudo Path',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.pseudo}</span>,
    },
    {
      accessorKey: 'access_type',
      header: 'Access',
      cell: ({ row }) => (
        <Badge variant={row.original.access_type === 'RW' ? 'default' : 'outline'}>
          {row.original.access_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'fsal.name',
      header: 'FSAL',
      cell: ({ row }) => <Badge variant="outline">{row.original.fsal?.name ?? '-'}</Badge>,
    },
    {
      accessorKey: 'protocols',
      header: 'Protocols',
      cell: ({ row }) => row.original.protocols?.join(', ') || '-',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <FolderOpen className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm({
                clusterId: row.original.cluster_id,
                exportId: row.original.export_id,
              })}
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
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">NFS</h1>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">NFS is not available</p>
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
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">NFS</h1>
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
        data={exports}
        searchKey="path"
        searchPlaceholder="Filter by path..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete NFS Export</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete NFS export{' '}
            <strong>{deleteConfirm?.exportId}</strong> from cluster{' '}
            <strong>{deleteConfirm?.clusterId}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteExport.isPending}>
              {deleteExport.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create NFS Export</DialogTitle>
          </DialogHeader>
          <NfsExportForm onSuccess={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
