import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Bell, CheckCircle, XCircle } from 'lucide-react';
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
      accessorKey: 'service_id',
      header: 'ID',
      cell: ({ row }) => row.original.service_id ?? '-',
    },
    {
      accessorKey: 'hostname',
      header: 'Host',
      cell: ({ row }) => row.original.hostname ?? '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const ok = row.original.status === 'running' || row.original.status === 'active';
        return (
          <Badge variant={ok ? 'default' : 'secondary'} className="gap-1">
            {ok ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => row.original.version ?? '-',
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
