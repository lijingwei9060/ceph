import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Server, Plus, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import type { Host } from '@/types';
import { useHosts, useDeleteHost, useHostDevices, useHostDaemons } from '@/features/host/api/use-hosts';
import { useHostInventory } from '@/features/cluster/inventory/api/use-inventory';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { HostForm } from '../components/host-form';
import { toast } from 'sonner';

/* ── Host detail panel (expanded row) ── */

function HostDetailPanel({ hostname }: { hostname: string }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('devices');

  return (
    <div className="border rounded-md p-3 bg-muted/30">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          <TabsTrigger value="devices">{t('hosts.devices')}</TabsTrigger>
          <TabsTrigger value="physical-disks">{t('hosts.physicalDisks')}</TabsTrigger>
          <TabsTrigger value="daemons">{t('hosts.daemons')}</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DevicesTab hostname={hostname} />
        </TabsContent>
        <TabsContent value="physical-disks">
          <PhysicalDisksTab hostname={hostname} />
        </TabsContent>
        <TabsContent value="daemons">
          <DaemonsTab hostname={hostname} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DevicesTab({ hostname }: { hostname: string }) {
  const { t } = useTranslation();
  const { data: devices = [], isLoading } = useHostDevices(hostname);

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
  if (devices.length === 0) return <div className="text-sm text-muted-foreground">{t('common.noData')}</div>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-1 pr-4 font-medium">ID</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.state')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.daemons')}</th>
          <th className="pb-1 font-medium">{t('hosts.location')}</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((dev) => (
          <tr key={dev.devid} className="border-b last:border-0">
            <td className="py-1 pr-4 font-mono text-xs">{dev.devid}</td>
            <td className="py-1 pr-4">
              <Badge
                variant={dev.state === 'good' ? 'default' : dev.state === 'bad' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {dev.state ?? 'unknown'}
              </Badge>
            </td>
            <td className="py-1 pr-4 text-xs">{dev.daemons?.join(', ') || '-'}</td>
            <td className="py-1 text-xs">{dev.location?.map((l) => l.dev).join(', ') || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhysicalDisksTab({ hostname }: { hostname: string }) {
  const { t } = useTranslation();
  const { data: inventory, isLoading } = useHostInventory(hostname);

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
  const devices = inventory?.devices ?? [];
  if (devices.length === 0) return <div className="text-sm text-muted-foreground">{t('common.noData')}</div>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-1 pr-4 font-medium">{t('hosts.path')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.available')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.type')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.size')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.model')}</th>
          <th className="pb-1 font-medium">OSD</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((dev) => (
          <tr key={dev.path} className="border-b last:border-0">
            <td className="py-1 pr-4 font-mono text-xs">{dev.path}</td>
            <td className="py-1 pr-4">
              <Badge variant={dev.available ? 'default' : 'secondary'} className="text-xs">
                {dev.available ? t('common.yes') : t('common.no')}
              </Badge>
            </td>
            <td className="py-1 pr-4 text-xs">{dev.human_readable_type || '-'}</td>
            <td className="py-1 pr-4 text-xs">{dev.sys_api?.human_readable_size || '-'}</td>
            <td className="py-1 pr-4 text-xs">{dev.sys_api?.model || '-'}</td>
            <td className="py-1 text-xs">{dev.osd_ids?.join(', ') || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DaemonsTab({ hostname }: { hostname: string }) {
  const { t } = useTranslation();
  const { data: daemons = [], isLoading } = useHostDaemons(hostname);

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
  if (daemons.length === 0) return <div className="text-sm text-muted-foreground">{t('common.noData')}</div>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-1 pr-4 font-medium">{t('hosts.daemonType')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.daemonId')}</th>
          <th className="pb-1 pr-4 font-medium">{t('hosts.status')}</th>
          <th className="pb-1 font-medium">{t('hosts.version')}</th>
        </tr>
      </thead>
      <tbody>
        {daemons.map((daemon, i) => (
          <tr key={`${daemon.daemon_type}-${daemon.daemon_id}-${i}`} className="border-b last:border-0">
            <td className="py-1 pr-4 text-xs">{daemon.daemon_type}</td>
            <td className="py-1 pr-4 font-mono text-xs">{daemon.daemon_id}</td>
            <td className="py-1 pr-4">
              <Badge variant={daemon.status === 1 ? 'default' : 'destructive'} className="text-xs">
                {daemon.status_desc || (daemon.status === 1 ? t('common.active') : t('common.inactive'))}
              </Badge>
            </td>
            <td className="py-1 text-xs">{daemon.version || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Main host list page ── */

export function HostListPage() {
  const { t } = useTranslation();
  const { data: hosts = [], isLoading } = useHosts();
  const deleteHost = useDeleteHost();
  const [editHost, setEditHost] = useState<Host | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Host | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);

  const columns: ColumnDef<Host>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setExpandedHost(expandedHost === row.original.hostname ? null : row.original.hostname)}
        >
          {expandedHost === row.original.hostname ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 40,
    },
    {
      accessorKey: 'hostname',
      header: t('hosts.hostname'),
      cell: ({ row }) => (
        <span
          className="font-medium cursor-pointer hover:underline"
          onClick={() => setExpandedHost(expandedHost === row.original.hostname ? null : row.original.hostname)}
        >
          {row.original.hostname}
        </span>
      ),
    },
    {
      accessorKey: 'addr',
      header: t('hosts.addresses'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.addr || '-'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('hosts.status'),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'maintenance'
                ? 'secondary'
                : status === 'offline'
                ? 'destructive'
                : 'default'
            }
          >
            {status || 'online'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'labels',
      header: t('hosts.labels'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.labels?.map((label) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}
            </Badge>
          )) || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'services',
      header: t('hosts.services'),
      cell: ({ row }) => {
        const instances = row.original.service_instances;
        if (!instances?.length) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {instances.map((s) => (
              <Badge key={s.type} variant="secondary" className="text-xs">
                {s.type}({s.count})
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'ceph_version',
      header: t('hosts.version', 'Version'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.ceph_version || '-'}
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
            <DropdownMenuItem onClick={() => setEditHost(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('hosts.editLabels', 'Edit Labels')}
            </DropdownMenuItem>
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteHost.mutateAsync(deleteConfirm.hostname);
      toast.success(t('hosts.deleted', `Host ${deleteConfirm.hostname} deleted`));
      setDeleteConfirm(null);
    } catch {
      toast.error(t('hosts.deleteFailed', 'Failed to delete host'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">{t('nav.hosts')}</h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('hosts.addHost', 'Add Host')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={hosts}
        searchKey="hostname"
        searchPlaceholder={t('hosts.filterHosts', 'Filter hosts...')}
        isLoading={isLoading}
      />

      {/* Expanded host detail */}
      {expandedHost && (
        <HostDetailPanel hostname={expandedHost} />
      )}

      <Dialog open={!!editHost} onOpenChange={() => setEditHost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hosts.editHost', 'Edit Host')}: {editHost?.hostname}</DialogTitle>
          </DialogHeader>
          {editHost && (
            <HostForm
              initialData={editHost}
              onSuccess={() => setEditHost(null)}
              onCancel={() => setEditHost(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hosts.deleteHost', 'Delete Host')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('hosts.deleteConfirm', 'Are you sure you want to delete host')}{' '}
            <strong>{deleteConfirm?.hostname}</strong>? {t('hosts.cannotUndo', 'This action cannot be undone.')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteHost.isPending}
            >
              {deleteHost.isPending ? t('common.loading') : t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hosts.addHost', 'Add Host')}</DialogTitle>
          </DialogHeader>
          <HostForm onSuccess={() => setShowAddDialog(false)} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
