import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSummary } from '@/features/health/api/use-health';
import { useHealthFull } from '@/features/health/api/use-health';
import { getHealthColor, getHealthLabel } from '@/lib/health';
import { formatDimlessBinary, formatDimless } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function DashboardOverview() {
  const { t } = useTranslation();
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: healthFull, isLoading: healthLoading } = useHealthFull();

  if (summaryLoading || healthLoading || !summary) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const healthStatus = summary.health_status;
  const healthColor = getHealthColor(healthStatus);
  const healthLabel = getHealthLabel(healthStatus);
  const version = summary.version;

  // Capacity from health/full df
  const dfStats = healthFull?.df?.stats;
  const capacityTotal = dfStats?.total_bytes ?? 0;
  const capacityUsed = dfStats?.total_used_raw_bytes ?? 0;
  const capacityAvail = dfStats?.total_avail_bytes ?? 0;
  const usagePercent = capacityTotal > 0 ? (capacityUsed / capacityTotal) * 100 : 0;

  // Client IOPS from health/full client_perf
  const clientPerf = healthFull?.client_perf;
  const readOps = clientPerf?.read_op_per_sec ?? 0;
  const writeOps = clientPerf?.write_op_per_sec ?? 0;
  const totalIOPS = readOps + writeOps;

  // PG status from health/full pg_info
  const pgStatuses = healthFull?.pg_info?.statuses ?? {};
  const pgData = Object.entries(pgStatuses).map(([name, value]) => {
    const cleanName = name.replace(/\s*\(.*\)/, '').trim();
    let color = '#9ca3af';
    if (cleanName === 'clean' || cleanName === 'active+clean') color = '#22c55e';
    else if (cleanName.includes('degraded') || cleanName.includes('recovering')) color = '#eab308';
    else if (cleanName.includes('error') || cleanName.includes('down')) color = '#ef4444';
    else if (cleanName.includes('working') || cleanName.includes('scrub')) color = '#3b82f6';
    return { name: cleanName, value: value as number, color };
  });
  if (pgData.length === 0) {
    pgData.push({ name: 'No data', value: 1, color: '#9ca3af' });
  }

  // Object stats from pg_info
  const objectStats = healthFull?.pg_info?.object_stats;
  const objHealthy = (objectStats?.num_objects ?? 0) - (objectStats?.num_objects_degraded ?? 0) - (objectStats?.num_objects_misplaced ?? 0);
  const objectData = [
    { name: 'Healthy', value: Math.max(objHealthy, 0), color: '#22c55e' },
    { name: 'Misplaced', value: objectStats?.num_objects_misplaced ?? 0, color: '#eab308' },
    { name: 'Degraded', value: objectStats?.num_objects_degraded ?? 0, color: '#ef4444' },
  ];

  // OSD summary
  const osds = healthFull?.osd_map?.osds ?? [];
  const osdUp = osds.filter((o) => o.up === 1).length;
  const osdIn = osds.filter((o) => o.in === 1).length;
  const osdTotal = osds.length;

  // Mon quorum
  const inQuorum = healthFull?.mon_status?.quorum?.length ?? 0;
  const totalMons = healthFull?.mon_status?.monmap?.mons?.length ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieTooltipFormatter = (value: any, name: any) => [formatDimless(Number(value) || 0), String(name)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('nav.dashboard')}</h1>
          {version && (
            <p className="text-sm text-muted-foreground">{version}</p>
          )}
        </div>
        <Badge className={cn('text-sm', healthColor)} variant="outline">
          {healthStatus?.replace('HEALTH_', '') || 'UNKNOWN'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.clusterStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', healthColor)}>
              {t(`dashboard.${healthLabel}`, healthLabel)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Monitors: {inQuorum}/{totalMons} in quorum
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.capacity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.used')}</span>
                <span>{capacityUsed > 0 ? formatDimlessBinary(capacityUsed) : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.total')}</span>
                <span>{capacityTotal > 0 ? formatDimlessBinary(capacityTotal) : '-'}</span>
              </div>
              {capacityTotal > 0 && (
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {usagePercent.toFixed(1)}% used
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.clientIOPS')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalIOPS > 0 ? formatDimless(totalIOPS) + ' op/s' : '-'}
            </div>
            {clientPerf && (
              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                <div>Read: {formatDimless(readOps)} op/s ({formatDimlessBinary(clientPerf.read_bytes_sec ?? 0)}/s)</div>
                <div>Write: {formatDimless(writeOps)} op/s ({formatDimlessBinary(clientPerf.write_bytes_sec ?? 0)}/s)</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OSDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{osdTotal}</div>
            <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
              <div>Up: {osdUp}</div>
              <div>In: {osdIn}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.pgStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pgData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pgData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={pieTooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.objects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={objectData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {objectData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={pieTooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
