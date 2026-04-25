import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Bell, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useServices } from '../api/use-service';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

export function ServiceListPage() {
  const { t } = useTranslation();
  const { data: services = [], isLoading } = useServices();

  const columns: ColumnDef<(typeof services)[0]>[] = [
    {
      accessorKey: 'service_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.service_type}</Badge>
      ),
    },
    {
      accessorKey: 'service_name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.service_name}</span>
      ),
    },
    {
      accessorKey: 'placement',
      header: 'Placement',
      cell: ({ row }) => {
        const p = row.original.placement;
        if (!p) return '-';
        if (p.hosts?.length) return p.hosts.join(', ');
        if (p.count != null) return `${p.count} daemons`;
        if (p.label) return `label: ${p.label}`;
        return '-';
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const allRunning = s.running >= s.size && s.size > 0;
        const partial = s.running > 0 && s.running < s.size;
        return (
          <Badge variant={allRunning ? 'default' : partial ? 'secondary' : 'destructive'} className="gap-1">
            {allRunning ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : partial ? (
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {s.running}/{s.size} running
          </Badge>
        );
      },
    },
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {row.original.status.container_image_name || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t('nav.services')}</h1>
      </div>

      <DataTable columns={columns} data={services} isLoading={isLoading} />
    </div>
  );
}
