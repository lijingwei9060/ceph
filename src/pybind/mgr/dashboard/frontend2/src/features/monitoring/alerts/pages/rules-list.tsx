import { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { usePrometheusRules } from '../../api/use-prometheus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PrometheusRule {
  name: string;
  query: string;
  duration: number;
  labels: {
    severity?: string;
    [key: string]: string | undefined;
  };
  annotations: {
    summary?: string;
    description?: string;
    [key: string]: string | undefined;
  };
  alerts: Array<{
    labels: Record<string, string>;
    state: string;
  }>;
  health: string;
  type: string;
}

interface PrometheusRuleGroup {
  name: string;
  file: string;
  rules: PrometheusRule[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

const healthColors: Record<string, string> = {
  ok: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  unknown: 'bg-gray-400 text-white',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant="outline">-</Badge>;
  const colorClass = severityColors[severity] || 'bg-gray-400 text-white';
  return <Badge className={colorClass}>{severity}</Badge>;
}

function HealthBadge({ health }: { health: string }) {
  const colorClass = healthColors[health] || 'bg-gray-400 text-white';
  return <Badge className={colorClass}>{health}</Badge>;
}

function RuleDetails({ rule }: { rule: PrometheusRule }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium text-muted-foreground">表达式:</span>
        <code className="ml-2 bg-muted px-1 py-0.5 rounded text-xs">{rule.query}</code>
      </div>

      {rule.duration > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">持续时间:</span>
          <span className="ml-2">{formatDuration(rule.duration)}</span>
        </div>
      )}

      {Object.keys(rule.labels).length > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">标签:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(rule.labels).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}={value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {rule.annotations.summary && (
        <div>
          <span className="font-medium text-muted-foreground">摘要:</span>
          <span className="ml-2">{rule.annotations.summary}</span>
        </div>
      )}

      {rule.annotations.description && (
        <div>
          <span className="font-medium text-muted-foreground">描述:</span>
          <span className="ml-2 text-muted-foreground">{rule.annotations.description}</span>
        </div>
      )}

      {rule.alerts && rule.alerts.length > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">活跃告警:</span>
          <span className="ml-2">{rule.alerts.length}</span>
        </div>
      )}
    </div>
  );
}

function RuleGroupCard({ group }: { group: PrometheusRuleGroup }) {
  const [expanded, setExpanded] = useState(false);

  const alertingRules = group.rules.filter((r) => r.type === 'alerting');
  const activeAlertsCount = alertingRules.reduce((sum, r) => sum + (r.alerts?.length || 0), 0);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base">{group.name}</CardTitle>
            <Badge variant="outline" className="ml-2">
              {alertingRules.length} 规则
            </Badge>
            {activeAlertsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {activeAlertsCount} 活跃
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{group.file}</span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">名称</TableHead>
                <TableHead className="w-[100px]">严重性</TableHead>
                <TableHead className="w-[100px]">持续时间</TableHead>
                <TableHead className="w-[80px]">健康状态</TableHead>
                <TableHead className="w-[80px]">活跃告警</TableHead>
                <TableHead>摘要</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertingRules.map((rule, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={rule.labels.severity} />
                  </TableCell>
                  <TableCell>
                    {rule.duration > 0 ? formatDuration(rule.duration) : '-'}
                  </TableCell>
                  <TableCell>
                    <HealthBadge health={rule.health} />
                  </TableCell>
                  <TableCell>
                    {rule.alerts?.length > 0 && (
                      <Badge variant="destructive">{rule.alerts.length}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rule.annotations.summary || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {alertingRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    暂无告警规则
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

export function RulesListPage() {
  const { data, isLoading, refetch, isRefetching } = usePrometheusRules('alerting');
  const groups = data?.groups || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">告警规则</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1', isRefetching && 'animate-spin')} />
          刷新
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        共 {groups.length} 个规则组，{groups.reduce((sum, g) => sum + g.rules.filter(r => r.type === 'alerting').length, 0)} 条规则
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无告警规则</div>
      ) : (
        <div className="space-y-2">
          {groups.map((group, index) => (
            <RuleGroupCard key={index} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
