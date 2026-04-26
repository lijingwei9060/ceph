import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Archive, RefreshCw, Trash2, Plus, Eye, MoreHorizontal } from 'lucide-react';
import { useRgwBuckets, useDeleteRgwBucket, useCreateRgwBucket } from '../api/use-rgw-bucket';
import { useRgwUserIds } from '../../user/api/use-rgw-user';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { formatDimlessBinary } from '@/lib/format';
import { toast } from 'sonner';
import { RgwBucketDetailDialog } from '../components/rgw-bucket-detail';

const bucketCreateSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  uid: z.string().min(1, 'Owner is required'),
});

type BucketCreateData = z.infer<typeof bucketCreateSchema>;

export function RgwBucketListPage() {
  const { t } = useTranslation();
  const { data: buckets = [], isLoading, refetch } = useRgwBuckets(true);
  const { data: userIds } = useRgwUserIds();
  const deleteBucket = useDeleteRgwBucket();
  const createBucket = useCreateRgwBucket();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detailBucket, setDetailBucket] = useState<string | null>(null);

  const form = useForm<BucketCreateData>({
    resolver: zodResolver(bucketCreateSchema),
    defaultValues: { bucket: '', uid: '' },
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBucket.mutateAsync(deleteConfirm);
      toast.success(`${t('rgw.bucket.title')} ${deleteConfirm} ${t('common.deleted').toLowerCase()}`);
      setDeleteConfirm(null);
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const handleCreate = async (data: BucketCreateData) => {
    try {
      await createBucket.mutateAsync({ bucket: data.bucket, uid: data.uid });
      toast.success(`${t('rgw.bucket.title')} ${data.bucket} ${t('common.created').toLowerCase()}`);
      setShowCreate(false);
      form.reset();
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const columns: ColumnDef<(typeof buckets)[0]>[] = [
    {
      accessorKey: 'bucket',
      header: 'Bucket',
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => setDetailBucket(row.original.bid ?? row.original.bucket)}
        >
          {row.original.bid ?? row.original.bucket}
        </button>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailBucket(row.original.bid ?? row.original.bucket)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirm(row.original.bid ?? row.original.bucket)}
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
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('rgw.bucket.title')}</h1>
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
        data={buckets}
        searchKey="bucket"
        searchPlaceholder={`${t('common.filter')}...`}
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rgw.bucket.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('messages.confirmDelete')} <strong>{deleteConfirm}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBucket.isPending}>
              {deleteBucket.isPending ? `${t('common.delete')}...` : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rgw.bucket.create')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="bucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bucket Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="my-bucket" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userIds?.map((uid) => (
                          <SelectItem key={uid} value={uid}>{uid}</SelectItem>
                        ))}
                        {!userIds?.length && (
                          <SelectItem value="_manual">Enter manually below</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {(!userIds?.length || field.value === '_manual') && (
                      <Input className="mt-1" placeholder="Type user ID" value={field.value === '_manual' ? '' : field.value} onChange={field.onChange} />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); form.reset(); }}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={createBucket.isPending}>
                  {createBucket.isPending ? `${t('common.create')}...` : t('common.create')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <RgwBucketDetailDialog
        bucketName={detailBucket}
        open={detailBucket !== null}
        onClose={() => setDetailBucket(null)}
      />
    </div>
  );
}
