import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ExternalLink, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { useAlertmanagerAlerts } from '../../api/use-prometheus';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AlertmanagerAlert {
  labels: {
    alertname: string;
    instance?: string;
    job?: string;
    severity?: string;
    [key: string]: string | undefined;
  };
  annotations: {
    summary?: string;
    description?: string;
    [key: string]: string | undefined;
  };
  status: {
    state: 'unprocessed' | 'active' | 'suppressed';
    silencedBy: string[] | null;
    inhibitedBy: string[] | null;
  };
  fingerprint: string;
  startsAt: string;
  endsAt: string;
  generatorURL: string;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

const stateColors: Record<string, string> = {
  active: 'bg-blue-500 text-white',
  unprocessed: 'bg-yellow-500 text-white',
  suppressed: 'bg-gray-500 text-white',
};

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant="outline">-</Badge>;
  const colorClass = severityColors[severity] || 'bg-gray-400 text-white';
  return <Badge className={colorClass}>{severity}</Badge>;
}

function StateBadge({ state }: { state: string }) {
  const colorClass = stateColors[state] || 'bg-gray-400 text-white';
  return <Badge className={colorClass}>{state}</Badge>;
}

export function ActiveAlertsPage() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const { data: alerts = [], isLoading, refetch, isRefetching } = useAlertmanagerAlerts();

  const filteredAlerts = alerts.filter((alert) => {
    const severity = alert.labels.severity || 'none';
    const state = alert.status.state;
    const severityMatch = severityFilter === 'all' || severity === severityFilter;
    const stateMatch = stateFilter === 'all' || state === stateFilter;
    return severityMatch && stateMatch;
  });

  const columns: ColumnDef<AlertmanagerAlert>[] = [
    {
      accessorKey: 'labels.alertname',
      header: '名称',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.labels.alertname || '-'}</span>
      ),
    },
    {
      accessorKey: 'annotations.summary',
      header: '摘要',
      cell: ({ row }) => {
        const summary = row.original.annotations.summary || row.original.annotations.description;
        return <span className="text-muted-foreground">{summary || '-'}</span>;
      },
    },
    {
      accessorKey: 'labels.severity',
      header: '严重性',
      cell: ({ row }) => <SeverityBadge severity={row.original.labels.severity} />,
    },
    {
      accessorKey: 'status.state',
      header: '状态',
      cell: ({ row }) => <StateBadge state={row.original.status.state} />,
    },
    {
      accessorKey: 'startsAt',
      header: '开始时间',
      cell: ({ row }) => {
        const startsAt = row.getValue('startsAt') as string;
        if (!startsAt) return '-';
        try {
          return formatDistanceToNow(new Date(startsAt), { addSuffix: true, locale: zhCN });
        } catch {
          return '-';
        }
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const alert = row.original;
        return (
          <div className="flex items-center gap-2">
            {alert.generatorURL && (
              <a
                href={alert.generatorURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      },
    },
  ];

  const handleCreateSilence = (alert: AlertmanagerAlert) => {
    navigate(`/monitoring/silences/create/${alert.fingerprint}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">活跃告警</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">严重性:</span>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态:</span>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unprocessed">Unprocessed</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          共 {filteredAlerts.length} 条告警
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAlerts}
        isLoading={isLoading}
        onRowClick={(row) => handleCreateSilence(row.original)}
        rowClassName="cursor-pointer hover:bg-muted/50"
      />
    </div>
  );
}
