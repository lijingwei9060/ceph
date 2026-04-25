import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Settings, RefreshCw, RotateCcw } from 'lucide-react';
import { useSettings, useUpdateSetting, useResetSetting, type DashboardSetting } from '../api/use-settings';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES: Record<string, string[]> = {
  'Grafana': ['GRAFANA_API_URL', 'GRAFANA_FRONTEND_API_URL', 'GRAFANA_API_USERNAME', 'GRAFANA_API_PASSWORD', 'GRAFANA_API_SSL_VERIFY', 'GRAFANA_UPDATE_DASHBOARDS'],
  'Prometheus': ['PROMETHEUS_API_HOST', 'PROMETHEUS_API_SSL_VERIFY', 'ALERTMANAGER_API_HOST', 'ALERTMANAGER_API_SSL_VERIFY'],
  'RGW': ['RGW_API_ACCESS_KEY', 'RGW_API_SECRET_KEY', 'RGW_API_ADMIN_RESOURCE', 'RGW_API_SSL_VERIFY'],
  'Password Policy': ['PWD_POLICY_ENABLED', 'PWD_POLICY_CHECK_LENGTH_ENABLED', 'PWD_POLICY_CHECK_OLDPWD_ENABLED', 'PWD_POLICY_CHECK_USERNAME_ENABLED', 'PWD_POLICY_CHECK_EXCLUSION_LIST_ENABLED', 'PWD_POLICY_CHECK_COMPLEXITY_ENABLED', 'PWD_POLICY_CHECK_SEQUENTIAL_CHARS_ENABLED', 'PWD_POLICY_CHECK_REPETITIVE_CHARS_ENABLED', 'PWD_POLICY_MIN_LENGTH', 'PWD_POLICY_MIN_COMPLEXITY', 'PWD_POLICY_EXCLUSION_LIST', 'USER_PWD_EXPIRATION_SPAN', 'USER_PWD_EXPIRATION_WARNING_1', 'USER_PWD_EXPIRATION_WARNING_2'],
  'iSCSI': ['ISCSI_API_SSL_VERIFICATION'],
  'NFS': ['GANESHA_CLUSTERS_RADOS_POOL_NAMESPACE'],
  'Security': ['ACCOUNT_LOCKOUT_ATTEMPTS', 'AUDIT_API_ENABLED', 'AUDIT_API_LOG_PAYLOAD'],
  'General': ['ENABLE_BROWSABLE_API', 'REST_REQUESTS_TIMEOUT', 'ISSUE_TRACKER_API_KEY'],
};

function getCategory(name: string): string {
  for (const [cat, keys] of Object.entries(CATEGORIES)) {
    if (keys.includes(name)) return cat;
  }
  return 'Other';
}

function isSecret(name: string): boolean {
  return name.includes('PASSWORD') || name.includes('SECRET') || name.includes('KEY');
}

function SettingEditor({
  setting,
  onUpdate,
}: {
  setting: DashboardSetting;
  onUpdate: (name: string, value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(setting.value));

  if (setting.type === 'bool') {
    return (
      <Checkbox
        checked={!!setting.value}
        onCheckedChange={(checked) => onUpdate(setting.name, !!checked)}
      />
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          type={isSecret(setting.name) ? 'password' : 'text'}
          className="font-mono text-sm h-8"
        />
        <Button
          size="sm"
          className="h-8"
          onClick={() => {
            onUpdate(setting.name, editValue);
            setEditing(false);
          }}
        >
          Save
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">
        {isSecret(setting.name) ? '••••••••' : String(setting.value)}
      </span>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}

export function SettingsListPage() {
  const { data: settings = [], isLoading, refetch } = useSettings();
  const updateSetting = useUpdateSetting();
  const resetSetting = useResetSetting();
  const [resetConfirm, setResetConfirm] = useState<string | null>(null);

  const handleUpdate = async (name: string, value: unknown) => {
    try {
      await updateSetting.mutateAsync({ name, value });
      toast.success(`Setting ${name} updated`);
    } catch {
      toast.error(`Failed to update ${name}`);
    }
  };

  const handleReset = async () => {
    if (!resetConfirm) return;
    try {
      await resetSetting.mutateAsync(resetConfirm);
      toast.success(`Setting ${resetConfirm} reset to default`);
      setResetConfirm(null);
    } catch {
      toast.error(`Failed to reset ${resetConfirm}`);
    }
  };

  const columns: ColumnDef<DashboardSetting>[] = [
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">{getCategory(row.original.name)}</Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Setting',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.name}</span>
      ),
    },
    {
      id: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <SettingEditor setting={row.original} onUpdate={handleUpdate} />
      ),
    },
    {
      accessorKey: 'default',
      header: 'Default',
      cell: ({ row }) => (
        <Badge variant={row.original.default ? 'default' : 'secondary'}>
          {row.original.default ? 'Yes' : 'Custom'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setResetConfirm(row.original.name)}
          disabled={row.original.default}
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={settings}
        searchKey="name"
        searchPlaceholder="Filter settings..."
        isLoading={isLoading}
        pageSize={20}
      />

      <Dialog open={!!resetConfirm} onOpenChange={() => setResetConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Setting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Reset <strong className="font-mono">{resetConfirm}</strong> to its default value?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetSetting.isPending}>
              {resetSetting.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
