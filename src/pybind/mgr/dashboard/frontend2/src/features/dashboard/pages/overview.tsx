import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSummary, useHealthFull, useFeatureToggles } from '@/features/health/api/use-health';
import { getHealthColor, getHealthLabel } from '@/lib/health';
import { formatDimlessBinary, formatDimless } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/* ── Refresh interval options ── */

const INTERVAL_OPTIONS = [
  { label: '5 s', value: 5_000 },
  { label: '10 s', value: 10_000 },
  { label: '15 s', value: 15_000 },
  { label: '30 s', value: 30_000 },
  { label: '1 min', value: 60_000 },
  { label: '3 min', value: 180_000 },
  { label: '5 min', value: 300_000 },
] as const;

/* ── PG category logic (ported from Angular pg-category.service) ── */

const PG_WORKING_STATES = new Set([
  'activating', 'backfill_wait', 'backfilling', 'creating', 'deep',
  'degraded', 'forced_backfill', 'forced_recovery', 'peering', 'peered',
  'recovering', 'recovery_wait', 'repair', 'scrubbing', 'snaptrim', 'snaptrim_wait',
]);

const PG_WARNING_STATES = new Set([
  'backfill_toofull', 'backfill_unfound', 'down', 'incomplete', 'inconsistent',
  'recovery_toofull', 'recovery_unfound', 'remapped', 'snaptrim_error', 'stale', 'undersized',
]);

const PG_CLEAN_STATES = new Set(['active', 'clean']);

function categorizePgStates(statuses: Record<string, number>): {
  clean: number; working: number; warning: number; unknown: number; total: number;
} {
  const result = { clean: 0, working: 0, warning: 0, unknown: 0, total: 0 };

  for (const [pgStatesText, pgAmount] of Object.entries(statuses)) {
    const states = [...new Set(pgStatesText.replace(/[^a-z_]+/g, ' ').trim().split(' '))];
    if (states.length === 0 || states[0] === '') {
      result.unknown += pgAmount;
      continue;
    }

    const hasWarning = states.some((s) => PG_WARNING_STATES.has(s));
    if (hasWarning) {
      result.warning += pgAmount;
      continue;
    }

    const workingCount = states.filter((s) => PG_WORKING_STATES.has(s)).length;
    const cleanCount = states.filter((s) => PG_CLEAN_STATES.has(s)).length;

    if (states.length > cleanCount + workingCount) {
      result.unknown += pgAmount;
    } else if (workingCount > 0) {
      result.working += pgAmount;
    } else {
      result.clean += pgAmount;
    }
    result.total += pgAmount;
  }

  return result;
}

function calcPercentage(dividend: number, divisor: number): number {
  if (!Number.isFinite(dividend) || !Number.isFinite(divisor) || divisor === 0) return 0;
  return Math.ceil((dividend / divisor) * 100 * 100) / 100;
}

/* ── Small reusable components ── */

interface InfoCardProps {
  title: string;
  titleLink?: string;
  children: React.ReactNode;
  className?: string;
  height?: string;
}

function InfoCard({ title, titleLink, children, className, height }: InfoCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={cn('w-[220px] flex flex-col', className)} style={height ? { height } : undefined}>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium">
          {titleLink ? (
            <button
              type="button"
              className="text-primary hover:underline p-0 bg-transparent border-0 cursor-pointer font-medium text-sm"
              onClick={() => navigate(titleLink)}
            >
              {title}
            </button>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm flex-1 flex items-center">
        {children}
      </CardContent>
    </Card>
  );
}

interface InfoGroupProps {
  title: string;
  children: React.ReactNode;
}

function InfoGroup({ title, children }: InfoGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-3">
        {children}
      </div>
    </div>
  );
}

/* ── Refresh selector ── */

function RefreshSelector({ value, onChange }: { value: number; onChange: (ms: number) => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="refresh-interval" className="text-sm text-muted-foreground">
        {t('dashboard.refresh', 'Refresh')}
      </label>
      <select
        id="refresh-interval"
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {INTERVAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Donut chart wrapper with click-to-filter ── */

const CHART_COLORS = {
  cyan: '#06b6d4',
  purple: '#a855f7',
  blue: '#3b82f6',
  gray: '#9ca3af',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  orange: '#f97316',
};

interface DonutCardProps {
  title: string;
  titleLink?: string;
  centerLabel: string;
  data: Array<{ name: string; value: number; color: string }>;
}

function DonutCard({ title, titleLink, centerLabel, data }: DonutCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (value: any, name: any) => [String(value) + '%', String(name)];

  const handleClick = useCallback((_: unknown, index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const displayedData = data.map((item, i) => ({
    ...item,
    value: activeIndex != null && i !== activeIndex ? 0 : item.value,
  }));

  const displayedCenterLabel = activeIndex != null
    ? `${data[activeIndex].name.split(':')[0]}\n${data[activeIndex].value}%`
    : centerLabel;

  return (
    <InfoCard title={title} titleLink={titleLink} className="w-[260px]" height="160px">
      <div className="flex items-center gap-2">
        <div className="w-[120px] h-[120px] shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayedData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                dataKey="value"
                stroke="none"
                onClick={(_, index) => handleClick(_, index)}
                style={{ cursor: 'pointer' }}
              >
                {displayedData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    opacity={activeIndex != null && index !== activeIndex ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] text-center leading-tight whitespace-pre-line">
              {displayedCenterLabel}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-1 text-xs">
          {data.map((item, i) => (
            <button
              key={item.name}
              type="button"
              className={cn(
                'flex items-center gap-1.5 w-full text-left hover:bg-muted/50 rounded px-0.5',
                activeIndex === i && 'bg-muted/50 font-medium',
              )}
              onClick={() => handleClick(null, i)}
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </InfoCard>
  );
}

/* ── Main Dashboard component ── */

export function DashboardOverview() {
  const { t } = useTranslation();
  const [refreshInterval, setRefreshInterval] = useState(5_000);
  const { data: featureToggles } = useFeatureToggles();

  // Auto-refreshing queries with configurable interval
  const { data: summary, isLoading: summaryLoading } = useSummary(refreshInterval);
  const { data: healthFull, isLoading: healthLoading } = useHealthFull(refreshInterval);

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

  // ── Status data ──
  const hostsCount = healthFull?.hosts;

  const monStatus = healthFull?.mon_status;
  const totalMons = monStatus?.monmap?.mons?.length ?? 0;
  const inQuorum = monStatus?.quorum?.length ?? 0;

  const osds = healthFull?.osd_map?.osds ?? [];
  const osdUp = osds.filter((o) => o.up === 1).length;
  const osdIn = osds.filter((o) => o.in === 1).length;
  const osdTotal = osds.length;
  const osdDown = osdTotal - osdUp;
  const osdOut = osdTotal - osdIn;
  const nearFullCount = osds.filter((o) => Array.isArray((o as Record<string, unknown>).state) && ((o as Record<string, unknown>).state as string[]).includes('nearfull')).length;
  const fullCount = osds.filter((o) => Array.isArray((o as Record<string, unknown>).state) && ((o as Record<string, unknown>).state as string[]).includes('full')).length;

  const mgrMap = healthFull?.mgr_map;
  const standbyMgrs = mgrMap?.standbys?.length ?? 0;

  const rgwCount = healthFull?.rgw;

  // MDS summary
  const fsMap = healthFull?.fs_map as {
    standbys?: Array<{ name: string }>;
    filesystems?: Array<{
      mdsmap?: {
        info?: Record<string, { name: string; state: string }>;
      };
    }>;
  } | undefined;
  let mdsActive = 0;
  let mdsStandbyReplay = 0;
  const mdsStandbys = fsMap?.standbys?.length ?? 0;
  let mdsNoFilesystems = false;

  if (fsMap?.standbys && !fsMap?.filesystems) {
    mdsNoFilesystems = false;
  } else if (fsMap?.filesystems && fsMap.filesystems.length === 0) {
    mdsNoFilesystems = true;
  } else if (fsMap?.filesystems) {
    for (const fs of fsMap.filesystems) {
      const info = fs.mdsmap?.info;
      if (info) {
        for (const mds of Object.values(info)) {
          if (mds.state === 'up:standby-replay') {
            mdsStandbyReplay += 1;
          } else {
            mdsActive += 1;
          }
        }
      }
    }
  }

  const iscsiDaemons = healthFull?.iscsi_daemons;
  const iscsiUp = iscsiDaemons?.up ?? 0;
  const iscsiDown = iscsiDaemons?.down ?? 0;
  const iscsiTotal = iscsiUp + iscsiDown;

  // ── Capacity data ──
  const dfStats = healthFull?.df?.stats;
  const capacityTotal = dfStats?.total_bytes ?? 0;
  const capacityUsed = dfStats?.total_used_raw_bytes ?? 0;
  const capacityAvail = capacityTotal - capacityUsed;
  const usedPercent = calcPercentage(capacityUsed, capacityTotal);

  const objectStats = healthFull?.pg_info?.object_stats;
  const objectCopies = objectStats?.num_object_copies ?? 0;
  const objHealthy = objectCopies
    - (objectStats?.num_objects_misplaced ?? 0)
    - (objectStats?.num_objects_degraded ?? 0)
    - (objectStats?.num_objects_unfound ?? 0);
  const objTotal = objectStats?.num_objects ?? 0;

  const pgStatuses = healthFull?.pg_info?.statuses ?? {};
  const pgCategory = categorizePgStates(pgStatuses);

  const poolsCount = healthFull?.pools?.length ?? 0;
  const pgsPerOsd = healthFull?.pg_info?.pgs_per_osd;

  // ── Performance data ──
  const clientPerf = healthFull?.client_perf;
  const readOps = clientPerf?.read_op_per_sec ?? 0;
  const writeOps = clientPerf?.write_op_per_sec ?? 0;
  const totalIOPS = readOps + writeOps;
  const readBytes = clientPerf?.read_bytes_sec ?? 0;
  const writeBytes = clientPerf?.write_bytes_sec ?? 0;
  const totalThroughput = readBytes + writeBytes;
  const recoveryBytes = clientPerf?.recovering_bytes_per_sec ?? 0;

  const scrubStatus = healthFull?.scrub_status;

  // ── Section visibility ──
  const showStatusSection =
    healthStatus ||
    hostsCount != null ||
    monStatus ||
    osdTotal > 0 ||
    mgrMap ||
    (rgwCount != null && featureToggles?.rgw) ||
    (fsMap && featureToggles?.cephfs) ||
    (iscsiDaemons != null && featureToggles?.iscsi);

  const showCapacitySection = dfStats || objTotal > 0 || pgCategory.total > 0 || poolsCount > 0 || pgsPerOsd != null;

  const showPerformanceSection = clientPerf || scrubStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('nav.dashboard')}</h1>
          {version && (
            <p className="text-sm text-muted-foreground">{version}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <RefreshSelector value={refreshInterval} onChange={setRefreshInterval} />
          <Badge className={cn('text-sm px-3', healthColor)} variant="outline">
            {healthStatus?.replace('HEALTH_', '') || 'UNKNOWN'}
          </Badge>
        </div>
      </div>

      {/* ── Status Section ── */}
      {showStatusSection && (
        <InfoGroup title={t('dashboard.clusterStatus')}>
          {/* Cluster Status */}
          {healthStatus && (
            <InfoCard title={t('dashboard.healthStatus')}>
              <div className={cn('font-bold text-lg', healthColor)}>
                {t(`dashboard.${healthLabel}`, healthLabel)}
              </div>
            </InfoCard>
          )}

          {/* Hosts */}
          {hostsCount != null && (
            <InfoCard title={t('nav.hosts')} titleLink="/hosts">
              <span className="font-bold">{hostsCount}</span> total
            </InfoCard>
          )}

          {/* Monitors */}
          {monStatus && (
            <InfoCard title={t('nav.monitors')} titleLink="/monitors">
              <span className="font-bold">{totalMons}</span> ({t('dashboard.healthy').toLowerCase()} {inQuorum})
            </InfoCard>
          )}

          {/* OSDs */}
          {osdTotal > 0 && (
            <InfoCard title={t('nav.osd')} titleLink="/osd">
              <span className="font-bold">{osdTotal}</span> total
              <br />
              {osdUp} up, {osdIn} in
              {(osdDown > 0 || osdOut > 0) && (
                <>
                  <br />
                  <span className="text-destructive">
                    {osdDown > 0 ? `${osdDown} down` : ''}
                    {osdDown > 0 && osdOut > 0 ? ', ' : ''}
                    {osdOut > 0 ? `${osdOut} out` : ''}
                  </span>
                </>
              )}
              {nearFullCount > 0 && (
                <>
                  <br />
                  <span className="text-destructive">{nearFullCount} near full</span>
                </>
              )}
              {fullCount > 0 && (
                <>
                  <br />
                  <span className="text-destructive">{fullCount} full</span>
                </>
              )}
            </InfoCard>
          )}

          {/* Managers */}
          {mgrMap && (
            <InfoCard title={t('dashboard.managers')}>
              <span>1 {t('dashboard.active').toLowerCase()}</span>
              <br />
              <span>{standbyMgrs} {t('dashboard.standby').toLowerCase()}</span>
            </InfoCard>
          )}

          {/* Object Gateways */}
          {rgwCount != null && featureToggles?.rgw && (
            <InfoCard title={t('nav.objectGateways')} titleLink="/rgw/daemon">
              <span className="font-bold">{rgwCount}</span> total
            </InfoCard>
          )}

          {/* Metadata Servers */}
          {fsMap && featureToggles?.cephfs && (
            <InfoCard title={t('nav.metadataServers')}>
              {fsMap.standbys && !fsMap.filesystems ? (
                <span>{mdsStandbys} {t('dashboard.healthy').toLowerCase()}</span>
              ) : mdsNoFilesystems ? (
                <span>{t('dashboard.noFilesystems', 'no filesystems')}</span>
              ) : (
                <>
                  <span>{mdsActive} {t('dashboard.active').toLowerCase()}</span>
                  <br />
                  <span>{mdsStandbys + mdsStandbyReplay} {t('dashboard.standby').toLowerCase()}</span>
                </>
              )}
            </InfoCard>
          )}

          {/* iSCSI Gateways */}
          {iscsiDaemons != null && featureToggles?.iscsi && (
            <InfoCard title={t('nav.iscsiGateways')} titleLink="/block/iscsi">
              <span className="font-bold">{iscsiTotal}</span> total
              <br />
              {iscsiUp} up,{' '}
              <span className={iscsiDown > 0 ? 'text-destructive' : ''}>
                {iscsiDown} down
              </span>
            </InfoCard>
          )}
        </InfoGroup>
      )}

      {/* ── Capacity Section ── */}
      {showCapacitySection && (
        <InfoGroup title={t('dashboard.capacity')}>
          {/* Raw Capacity - donut */}
          {dfStats && (
            <DonutCard
              title={t('dashboard.rawCapacity')}
              titleLink="/pools"
              centerLabel={`${usedPercent}%\nof ${formatDimlessBinary(capacityTotal)}`}
              data={[
                { name: `${t('common.used')}: ${formatDimlessBinary(capacityUsed)}`, value: usedPercent, color: usedPercent >= 85 ? CHART_COLORS.red : usedPercent >= 70 ? CHART_COLORS.yellow : CHART_COLORS.blue },
                { name: `${t('common.available')}: ${formatDimlessBinary(capacityAvail)}`, value: calcPercentage(capacityAvail, capacityTotal), color: CHART_COLORS.gray },
              ]}
            />
          )}

          {/* Objects - donut */}
          {objectStats && objTotal > 0 && (
            <DonutCard
              title={t('dashboard.objects')}
              centerLabel={`${formatDimless(objTotal)}\n${t('dashboard.objects').toLowerCase()}`}
              data={[
                { name: `${t('dashboard.healthy')}: ${calcPercentage(objHealthy, objectCopies)}%`, value: calcPercentage(objHealthy, objectCopies), color: CHART_COLORS.green },
                { name: `${t('dashboard.misplaced')}: ${calcPercentage(objectStats.num_objects_misplaced ?? 0, objectCopies)}%`, value: calcPercentage(objectStats.num_objects_misplaced ?? 0, objectCopies), color: CHART_COLORS.yellow },
                { name: `${t('dashboard.degraded')}: ${calcPercentage(objectStats.num_objects_degraded ?? 0, objectCopies)}%`, value: calcPercentage(objectStats.num_objects_degraded ?? 0, objectCopies), color: CHART_COLORS.red },
                { name: `${t('dashboard.unfound')}: ${calcPercentage(objectStats.num_objects_unfound ?? 0, objectCopies)}%`, value: calcPercentage(objectStats.num_objects_unfound ?? 0, objectCopies), color: CHART_COLORS.orange },
              ]}
            />
          )}

          {/* PG Status - donut */}
          {pgCategory.total > 0 && (
            <DonutCard
              title={t('dashboard.pgStatus')}
              centerLabel={`${pgCategory.total}\nPGs`}
              data={[
                { name: `${t('dashboard.clean')}: ${formatDimless(pgCategory.clean)}`, value: calcPercentage(pgCategory.clean, pgCategory.total), color: CHART_COLORS.green },
                { name: `${t('dashboard.working')}: ${formatDimless(pgCategory.working)}`, value: calcPercentage(pgCategory.working, pgCategory.total), color: CHART_COLORS.blue },
                { name: `${t('dashboard.warning')}: ${formatDimless(pgCategory.warning)}`, value: calcPercentage(pgCategory.warning, pgCategory.total), color: CHART_COLORS.yellow },
                { name: `${t('dashboard.unknown')}: ${formatDimless(pgCategory.unknown)}`, value: calcPercentage(pgCategory.unknown, pgCategory.total), color: CHART_COLORS.gray },
              ]}
            />
          )}

          {/* Pools */}
          {poolsCount > 0 && (
            <InfoCard title={t('nav.pools')} titleLink="/pools" className="w-[260px]" height="160px">
              <span className="font-bold text-lg">{poolsCount}</span>
            </InfoCard>
          )}

          {/* PGs per OSD */}
          {pgsPerOsd != null && (
            <InfoCard title={t('dashboard.pgsPerOsd', 'PGs per OSD')} className="w-[260px]" height="160px">
              <span className="font-bold text-lg">{formatDimless(pgsPerOsd)}</span>
            </InfoCard>
          )}
        </InfoGroup>
      )}

      {/* ── Performance Section ── */}
      {showPerformanceSection && (
        <InfoGroup title={t('dashboard.performance')}>
          {/* Client Read/Write - donut */}
          {clientPerf && totalIOPS > 0 && (
            <DonutCard
              title={t('dashboard.clientReadWrite', 'Client Read/Write')}
              centerLabel={`${formatDimless(totalIOPS)}\nIOPS`}
              data={[
                { name: `${t('dashboard.read')}: ${formatDimless(readOps)} /s`, value: calcPercentage(readOps, totalIOPS), color: CHART_COLORS.cyan },
                { name: `${t('dashboard.write')}: ${formatDimless(writeOps)} /s`, value: calcPercentage(writeOps, totalIOPS), color: CHART_COLORS.purple },
              ]}
            />
          )}

          {/* Client Throughput - donut */}
          {clientPerf && totalThroughput > 0 && (
            <DonutCard
              title={t('dashboard.clientThroughput')}
              centerLabel={`${formatDimlessBinary(totalThroughput).replace(' ', '\n')}/s`}
              data={[
                { name: `${t('dashboard.read')}: ${formatDimlessBinary(readBytes)}/s`, value: calcPercentage(readBytes, totalThroughput), color: CHART_COLORS.cyan },
                { name: `${t('dashboard.write')}: ${formatDimlessBinary(writeBytes)}/s`, value: calcPercentage(writeBytes, totalThroughput), color: CHART_COLORS.purple },
              ]}
            />
          )}

          {/* Recovery Throughput */}
          {clientPerf && (
            <InfoCard title={t('dashboard.recoveryThroughput')} className="w-[260px]" height="160px">
              <span className="font-bold text-lg">{formatDimlessBinary(recoveryBytes)}/s</span>
            </InfoCard>
          )}

          {/* Scrubbing */}
          {scrubStatus != null && (
            <InfoCard title={t('dashboard.scrubbing')} className="w-[260px]" height="160px">
              <span className="font-bold text-lg">{String(scrubStatus)}</span>
            </InfoCard>
          )}
        </InfoGroup>
      )}
    </div>
  );
}
