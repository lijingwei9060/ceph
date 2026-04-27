import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { HardDrive, RefreshCw, Trash2, MoreHorizontal, Wrench } from 'lucide-react';
import type { Osd } from '@/types';
import {
  useOsds,
  useOsdMarkOut,
  useOsdMarkIn,
  useOsdMarkDown,
  useOsdScrub,
  useOsdDelete,
} from '../api/use-osd';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(1)} KB`;
}

function OsdStatusBadge({ osd }: { osd: Osd }) {
  const states = osd.state || [];
  const isUp = !!osd.up;
  const isIn = !!osd.in;

  if (!isUp && !isIn) {
    return <Badge variant="destructive">Down & Out</Badge>;
  }
  if (!isUp) {
    return <Badge variant="secondary">Down</Badge>;
  }
  if (!isIn) {
    return <Badge variant="secondary">Out</Badge>;
  }
  if (states.includes('nearfull')) {
    return <Badge variant="secondary">Nearfull</Badge>;
  }
  if (states.includes('full')) {
    return <Badge variant="destructive">Full</Badge>;
  }
  return <Badge variant="default">Up & In</Badge>;
}

export function OsdListPage() {
  const { t } = useTranslation();
  const { data: osds = [], isLoading, refetch } = useOsds();
  const markOut = useOsdMarkOut();
  const markIn = useOsdMarkIn();
  const markDown = useOsdMarkDown();
  const scrub = useOsdScrub();
  const deleteOsd = useOsdDelete();

  const [deleteConfirm, setDeleteConfirm] = useState<Osd | null>(null);
  const [scrubConfirm, setScrubConfirm] = useState<{ osd: Osd; deep: boolean } | null>(null);

  const columns: ColumnDef<Osd>[] = [
    {
      accessorKey: 'osd',
      header: 'OSD ID',
      cell: ({ row }) => <span className="font-medium">{row.original.osd}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <OsdStatusBadge osd={row.original} />,
    },
    {
      id: 'host',
      header: 'Host',
      cell: ({ row }) => row.original.host?.name || '-',
    },
    {
      id: 'device_class',
      header: 'Class',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.tree?.device_class || 'unknown'}</Badge>
      ),
    },
    {
      id: 'crush_weight',
      header: 'CRUSH Weight',
      cell: ({ row }) => row.original.tree?.crush_weight?.toFixed(3) ?? '-',
    },
    {
      id: 'stat_bytes_used',
      header: 'Used',
      cell: ({ row }) => {
        const used = row.original.stats?.stat_bytes_used;
        if (!used) return '-';
        return formatBytes(used);
      },
    },
    {
      id: 'stat_bytes_avail',
      header: 'Available',
      cell: ({ row }) => {
        const total = row.original.stats?.stat_bytes;
        const used = row.original.stats?.stat_bytes_used;
        if (!total) return '-';
        const avail = total - (used ?? 0);
        return formatBytes(avail);
      },
    },
    {
      id: 'utilization',
      header: 'Usage %',
      cell: ({ row }) => {
        const total = row.original.stats?.stat_bytes ?? 0;
        const used = row.original.stats?.stat_bytes_used ?? 0;
        if (!total) return '-';
        const pct = (used / total) * 100;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-muted">
              <div
                className={cn(
                  'h-2 rounded-full',
                  pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs">{pct.toFixed(0)}%</span>
          </div>
        );
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
            <DropdownMenuItem
              onClick={() => {
                if (row.original.in) {
                  markOut.mutate(row.original.osd);
                } else {
                  markIn.mutate(row.original.osd);
                }
              }}
            >
              {row.original.in ? 'Mark Out' : 'Mark In'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => markDown.mutate(row.original.osd)}
              disabled={!row.original.up}
            >
              Mark Down
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setScrubConfirm({ osd: row.original, deep: false })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Scrub
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setScrubConfirm({ osd: row.original, deep: true })}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Deep Scrub
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteOsd.mutateAsync({ svcId: deleteConfirm.osd, force: false });
      toast.success(`OSD ${deleteConfirm.osd} deleted`);
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete OSD');
    }
  };

  const handleScrub = async () => {
    if (!scrubConfirm) return;
    try {
      await scrub.mutateAsync({ svcId: scrubConfirm.osd.osd, deep: scrubConfirm.deep });
      toast.success(
        `Scrub ${scrubConfirm.deep ? 'deep ' : ''}initiated for OSD ${scrubConfirm.osd.osd}`
      );
      setScrubConfirm(null);
    } catch {
      toast.error('Failed to initiate scrub');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.osd')}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={osds}
        searchKey="osd"
        searchPlaceholder="Filter by OSD ID..."
        isLoading={isLoading}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OSD</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete OSD{' '}
            <strong>{deleteConfirm?.osd}</strong>? This operation is irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteOsd.isPending}
            >
              {deleteOsd.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scrubConfirm} onOpenChange={() => setScrubConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scrubConfirm?.deep ? 'Deep ' : ''}Scrub OSD {scrubConfirm?.osd.osd}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {scrubConfirm?.deep
              ? 'This will perform a deep scrub which may impact performance.'
              : 'This will perform a lightweight scrub.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScrubConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={handleScrub} disabled={scrub.isPending}>
              {scrub.isPending ? 'Starting...' : 'Start Scrub'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
