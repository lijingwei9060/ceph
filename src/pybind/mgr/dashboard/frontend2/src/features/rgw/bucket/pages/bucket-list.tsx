import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Archive, RefreshCw, Trash2 } from 'lucide-react';
import { useRgwBuckets, useDeleteRgwBucket } from '../api/use-rgw-bucket';
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
import { formatDimlessBinary } from '@/lib/format';
import { toast } from 'sonner';

export function RgwBucketListPage() {
  const { t } = useTranslation();
  const { data: buckets = [], isLoading, refetch } = useRgwBuckets(true);
  const deleteBucket = useDeleteRgwBucket();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBucket.mutateAsync(deleteConfirm);
      toast.success(`Bucket ${deleteConfirm} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete bucket');
    }
  };

  const columns: ColumnDef<(typeof buckets)[0]>[] = [
    {
      accessorKey: 'bucket',
      header: 'Bucket',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.bid ?? row.original.bucket}</span>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.owner}</span>
      ),
    },
    {
      accessorKey: 'placement_rule',
      header: 'Placement',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.original.placement_rule}</Badge>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => {
        const size = row.original.size;
        return size !== undefined && size > 0 ? formatDimlessBinary(size) : '-';
      },
    },
    {
      accessorKey: 'num_objects',
      header: 'Objects',
      cell: ({ row }) => row.original.num_objects ?? '-',
    },
    {
      accessorKey: 'versioning',
      header: 'Versioning',
      cell: ({ row }) => {
        const status = row.original.versioning?.Status;
        if (!status) return '-';
        return <Badge variant={status === 'Enabled' ? 'default' : 'secondary'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'creation_time',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.creation_time ? new Date(row.original.creation_time).toLocaleDateString() : '-'}
        </span>
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
          onClick={() => setDeleteConfirm(row.original.bid ?? row.original.bucket)}
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
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">RGW Buckets</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={buckets}
        searchKey="bucket"
        searchPlaceholder="Filter by bucket name..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete bucket <strong>{deleteConfirm}</strong>?
            This will permanently remove all objects.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBucket.isPending}
            >
              {deleteBucket.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
