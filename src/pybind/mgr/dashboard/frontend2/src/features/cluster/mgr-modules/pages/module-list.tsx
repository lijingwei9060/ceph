import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { Box, Power } from 'lucide-react';
import { useMgrModules, useEnableModule, useDisableModule } from '../api/use-mgr-modules';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function ModuleListPage() {
  const { t } = useTranslation();
  const { data: modules = [], isLoading } = useMgrModules();
  const enableModule = useEnableModule();
  const disableModule = useDisableModule();

  const columns: ColumnDef<(typeof modules)[0]>[] = [
    {
      accessorKey: 'name',
      header: 'Module',
      cell: ({ row }) => (
        <span className="font-medium font-mono">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
          {row.original.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'always_on',
      header: 'Always On',
      cell: ({ row }) => (row.original.always_on ? 'Yes' : 'No'),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.description ?? '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const mod = row.original;
        if (mod.always_on) return <span className="text-xs text-muted-foreground">System module</span>;
        return (
          <button
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={async () => {
              try {
                if (mod.enabled) {
                  await disableModule.mutateAsync(mod.name);
                  toast.success(`Module ${mod.name} disabled`);
                } else {
                  await enableModule.mutateAsync(mod.name);
                  toast.success(`Module ${mod.name} enabled`);
                }
              } catch {
                toast.error(`Failed to ${mod.enabled ? 'disable' : 'enable'} module`);
              }
            }}
          >
            <Power className="h-3 w-3" />
            {mod.enabled ? 'Disable' : 'Enable'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Box className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t('nav.mgrModules')}</h1>
      </div>

      <DataTable columns={columns} data={modules} isLoading={isLoading} />
    </div>
  );
}
