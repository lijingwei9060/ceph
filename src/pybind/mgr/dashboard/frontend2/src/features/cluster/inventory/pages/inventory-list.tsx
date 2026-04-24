import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { HardDrive, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useHostInventories, type HostInventory, type InventoryDevice } from '../api/use-inventory';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function DeviceTypeBadge({ type }: { type?: string }) {
  const t = type?.toLowerCase();
  if (t === 'ssd' || t === 'nvme') return <Badge variant="default">{type}</Badge>;
  if (t === 'hdd') return <Badge variant="secondary">{type}</Badge>;
  return <Badge variant="outline">{type ?? 'unknown'}</Badge>;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${(bytes / 1e6).toFixed(0)} MB`;
}

export function InventoryListPage() {
  const { t } = useTranslation();
  const { data: inventories = [], isLoading, refetch } = useHostInventories();
  const [hostFilter, setHostFilter] = useState<string>('all');

  const hostNames = [...new Set(inventories.map((h) => h.name))];

  // Flatten all devices from all hosts, tagging each with hostname
  const allDevices = inventories.flatMap((inv) =>
    (inv.devices ?? []).map((dev) => ({
      ...dev,
      hostname: inv.name,
    }))
  );

  const filteredDevices = hostFilter === 'all'
    ? allDevices
    : allDevices.filter((d) => d.hostname === hostFilter);

  const columns: ColumnDef<InventoryDevice & { hostname: string }>[] = [
    {
      accessorKey: 'hostname',
      header: 'Host',
      cell: ({ row }) => <span className="font-medium">{row.original.hostname}</span>,
    },
    {
      accessorKey: 'path',
      header: 'Device Path',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.path}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => <DeviceTypeBadge type={row.original.human_readable_type} />,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => row.original.sys_api?.vendor || '-',
    },
    {
      id: 'model',
      header: 'Model',
      cell: ({ row }) => row.original.sys_api?.model || '-',
    },
    {
      id: 'size',
      header: 'Size',
      cell: ({ row }) => formatSize(row.original.sys_api?.size),
    },
    {
      accessorKey: 'available',
      header: 'Available',
      cell: ({ row }) => (
        <Badge variant={row.original.available ? 'default' : 'secondary'}>
          {row.original.available ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'osd_ids',
      header: 'OSDs',
      cell: ({ row }) => {
        const ids = row.original.osd_ids;
        if (!ids?.length) return '-';
        return ids.map((id) => <Badge key={id} variant="outline" className="mr-1">OSD.{id}</Badge>);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Physical Disks</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={hostFilter} onValueChange={setHostFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by host" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hosts</SelectItem>
            {hostNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredDevices.length} device(s)
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filteredDevices}
        searchKey="path"
        searchPlaceholder="Filter by device path..."
        isLoading={isLoading}
      />
    </div>
  );
}
