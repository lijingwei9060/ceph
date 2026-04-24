import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Search } from 'lucide-react';
import { useClusterConfig, useSetConfig } from '../api/use-config';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type ColumnDef } from '@tanstack/react-table';
import type { ConfigOption } from '../api/use-config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { toast } from 'sonner';

const configEditSchema = z.object({
  value: z.string(),
});

type ConfigEditForm = z.infer<typeof configEditSchema>;

function getConfigDisplayValue(opt: ConfigOption): string {
  if (!opt.value || opt.value.length === 0) return '-';
  if (opt.value.length === 1) return opt.value[0].value;
  return opt.value.map((v) => `${v.section}: ${v.value}`).join(', ');
}

function getConfigEditValue(opt: ConfigOption): string {
  if (!opt.value || opt.value.length === 0) return opt.default ?? '';
  if (opt.value.length === 1) return opt.value[0].value;
  return opt.value[0].value;
}

export function ConfigListPage() {
  const { t } = useTranslation();
  const { data: configs = [], isLoading } = useClusterConfig();
  const [search, setSearch] = useState('');
  const [editConfig, setEditConfig] = useState<ConfigOption | null>(null);

  const filteredConfigs = configs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.desc?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<ConfigOption>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.level === 'advanced' ? 'secondary' : 'default'
          }
        >
          {row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: 'desc',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-md">
          {row.original.desc || '-'}
        </span>
      ),
    },
    {
      id: 'default',
      header: 'Default',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.default ?? '-'}
        </span>
      ),
    },
    {
      id: 'value',
      header: 'Current Value',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{getConfigDisplayValue(row.original)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditConfig(row.original)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t('nav.configuration')}</h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search configurations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredConfigs} isLoading={isLoading} pageSize={20} />

      <Dialog open={!!editConfig} onOpenChange={() => setEditConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">{editConfig?.name}</DialogTitle>
          </DialogHeader>
          {editConfig && (
            <ConfigEditFormInner
              config={editConfig}
              onSuccess={() => setEditConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigEditFormInner({
  config,
  onSuccess,
}: {
  config: ConfigOption;
  onSuccess: () => void;
}) {
  const setConfig = useSetConfig();
  const form = useForm<ConfigEditForm>({
    resolver: zodResolver(configEditSchema),
    defaultValues: { value: getConfigEditValue(config) },
  });

  const onSubmit = async (data: ConfigEditForm) => {
    try {
      await setConfig.mutateAsync({ [config.name]: data.value });
      toast.success(`Configuration ${config.name} updated`);
      onSuccess();
    } catch {
      toast.error('Failed to update configuration');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input {...field} className="font-mono" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="text-xs text-muted-foreground">
          <p>Default: {config.default ?? 'none'}</p>
          <p>Type: {config.type}</p>
          {config.can_update_at_runtime && (
            <p className="text-green-600">Can update at runtime</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={setConfig.isPending}>
            {setConfig.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
