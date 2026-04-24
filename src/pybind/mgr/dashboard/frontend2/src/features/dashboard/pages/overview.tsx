import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSummary } from '@/features/health/api/use-health';
import { getHealthColor, getHealthLabel } from '@/lib/health';
import { formatDimlessBinary, formatDimless } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


export function DashboardOverview() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useSummary();

  if (isLoading || !summary) {
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

  const capacityUsed = 0;
  const capacityTotal = 0;

  const pgStatusData = [
    { name: 'Clean', value: 0, color: '#22c55e' },
    { name: 'Working', value: 0, color: '#3b82f6' },
    { name: 'Warning', value: 0, color: '#eab308' },
    { name: 'Unknown', value: 0, color: '#9ca3af' },
  ];

  const objectStatusData = [
    { name: 'Healthy', value: 0, color: '#22c55e' },
    { name: 'Misplaced', value: 0, color: '#eab308' },
    { name: 'Degraded', value: 0, color: '#ef4444' },
  ];

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.clusterStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', healthColor)}>
              {t(`dashboard.${healthLabel}`, healthLabel)}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.clientIOPS')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              -
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
                  data={pgStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pgStatusData.map((entry, index) => (
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
                  data={objectStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {objectStatusData.map((entry, index) => (
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
