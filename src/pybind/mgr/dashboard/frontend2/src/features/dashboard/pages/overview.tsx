import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSummary } from '@/features/health/api/use-health';
import { useHealthFull } from '@/features/health/api/use-health';
import { useFeatureToggles } from '@/features/health/api/use-health';
import { getHealthColor, getHealthLabel } from '@/lib/health';
import { formatDimlessBinary, formatDimless } from '@/lib/format';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  linkTo?: string;
  className?: string;
}

function InfoCard({ title, children, linkTo, className }: InfoCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn('min-w-[180px]', className)}
      onClick={() => linkTo && navigate(linkTo)}
      role={linkTo ? 'button' : undefined}
      tabIndex={linkTo ? 0 : undefined}
      onKeyDown={(e) => {
        if (linkTo && (e.key === 'Enter' || e.key === ' ')) {
          navigate(linkTo);
        }
      }}
      style={linkTo ? { cursor: 'pointer' } : undefined}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
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
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-3">
        {children}
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { t } = useTranslation();
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: healthFull, isLoading: healthLoading } = useHealthFull();
  const { data: featureToggles } = useFeatureToggles();

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

  // Hosts
  const hostsCount = healthFull?.hosts;

  // Monitors
  const monStatus = healthFull?.mon_status;
  const totalMons = monStatus?.monmap?.mons?.length ?? 0;
  const inQuorum = monStatus?.quorum?.length ?? 0;

  // Managers
  const mgrMap = healthFull?.mgr_map;
  const activeMgr = mgrMap?.active_name ?? '-';
  const standbyMgrs = mgrMap?.standbys?.length ?? 0;

  // OSDs
  const osds = healthFull?.osd_map?.osds ?? [];
  const osdUp = osds.filter((o) => o.up === 1).length;
  const osdIn = osds.filter((o) => o.in === 1).length;
  const osdTotal = osds.length;

  // RGW
  const rgwCount = healthFull?.rgw;

  // MDS (Metadata Servers)
  const fsMap = healthFull?.fs_map as { filesystems?: Array<{ up?: number; total?: number; name?: string }> } | undefined;
  const mdsUp = fsMap?.filesystems?.reduce((sum, fs) => sum + (fs.up ?? 0), 0) ?? 0;
  const mdsTotal = fsMap?.filesystems?.reduce((sum, fs) => sum + (fs.total ?? 0), 0) ?? 0;

  // iSCSI
  const iscsiDaemons = healthFull?.iscsi_daemons;
  const iscsiUp = iscsiDaemons?.up ?? 0;
  const iscsiDown = iscsiDaemons?.down ?? 0;
  const iscsiTotal = iscsiUp + iscsiDown;

  // Capacity
  const dfStats = healthFull?.df?.stats;
  const capacityTotal = dfStats?.total_bytes ?? 0;

  // Objects
  const objectStats = healthFull?.pg_info?.object_stats;
  const totalObjects = objectStats?.num_objects ?? 0;

  // PG Status
  const pgStatuses = healthFull?.pg_info?.statuses ?? {};
  const totalPGs = Object.values(pgStatuses).reduce((sum, count) => sum + (count as number), 0);

  // Pools
  const poolsCount = healthFull?.pools?.length ?? 0;

  // Determine if we should show each section based on data availability
  const showStatusSection =
    healthStatus ||
    hostsCount != null ||
    monStatus ||
    osdTotal > 0 ||
    mgrMap ||
    (rgwCount != null && featureToggles?.rgw) ||
    (mdsTotal > 0 && featureToggles?.cephfs) ||
    (iscsiTotal > 0 && featureToggles?.iscsi);

  const showCapacitySection = capacityTotal > 0 || totalObjects > 0 || totalPGs > 0 || poolsCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('nav.dashboard')}</h1>
          {version && (
            <p className="text-sm text-muted-foreground">{version}</p>
          )}
        </div>
        <Badge className={cn('text-sm px-3', healthColor)} variant="outline">
          {healthStatus?.replace('HEALTH_', '') || 'UNKNOWN'}
        </Badge>
      </div>

      {/* Status Section */}
      {showStatusSection && (
        <InfoGroup title={t('dashboard.clusterStatus')}>
          {/* Cluster Status */}
          {healthStatus && (
            <InfoCard title={t('dashboard.healthStatus')}>
              <Badge variant="outline" className={cn('text-xs', healthColor)}>
                {t(`dashboard.${healthLabel}`, healthLabel)}
              </Badge>
            </InfoCard>
          )}

          {/* Hosts */}
          {hostsCount != null && (
            <InfoCard title={t('nav.hosts')} linkTo="/hosts">
              {hostsCount} total
            </InfoCard>
          )}

          {/* Monitors */}
          {monStatus && (
            <InfoCard title={t('nav.monitors')} linkTo="/monitors">
              {inQuorum}/{totalMons} {t('dashboard.healthy').toLowerCase()}
            </InfoCard>
          )}

          {/* OSDs */}
          {osdTotal > 0 && (
            <InfoCard title={t('nav.osd')} linkTo="/osd">
              {osdUp}/{osdTotal} up, {osdIn}/{osdTotal} in
            </InfoCard>
          )}

          {/* Managers */}
          {mgrMap && (
            <InfoCard title={t('dashboard.managers')}>
              {activeMgr} {t('dashboard.active').toLowerCase()}
              {standbyMgrs > 0 && `, ${standbyMgrs} ${t('common.inactive').toLowerCase()}`}
            </InfoCard>
          )}

          {/* Object Gateways */}
          {rgwCount != null && featureToggles?.rgw && (
            <InfoCard title={t('nav.objectGateways')} linkTo="/rgw/daemon">
              {rgwCount} total
            </InfoCard>
          )}

          {/* Metadata Servers */}
          {mdsTotal > 0 && featureToggles?.cephfs && (
            <InfoCard title={t('nav.metadataServers')}>
              {mdsUp}/{mdsTotal} up
            </InfoCard>
          )}

          {/* iSCSI Gateways */}
          {iscsiTotal > 0 && featureToggles?.iscsi && (
            <InfoCard title={t('nav.iscsiGateways')} linkTo="/block/iscsi">
              {iscsiTotal} total
              <br />
              <span className="text-xs text-muted-foreground">
                {iscsiUp} up,{' '}
                <span className={iscsiDown > 0 ? 'text-destructive' : ''}>
                  {iscsiDown} down
                </span>
              </span>
            </InfoCard>
          )}
        </InfoGroup>
      )}

      {/* Capacity Section */}
      {showCapacitySection && (
        <InfoGroup title={t('dashboard.capacity')}>
          {/* Raw Capacity */}
          {capacityTotal > 0 && (
            <InfoCard title={t('dashboard.rawCapacity')} linkTo="/pools">
              {formatDimlessBinary(capacityTotal)}
            </InfoCard>
          )}

          {/* Objects */}
          {totalObjects > 0 && (
            <InfoCard title={t('dashboard.objects')}>
              {formatDimlessBinary(totalObjects)}
            </InfoCard>
          )}

          {/* PGs */}
          {totalPGs > 0 && (
            <InfoCard title={t('dashboard.pgStatus')}>
              {formatDimless(totalPGs)} PGs
            </InfoCard>
          )}

          {/* Pools count */}
          {poolsCount > 0 && (
            <InfoCard title={t('nav.pools')} linkTo="/pools">
              {poolsCount}
            </InfoCard>
          )}
        </InfoGroup>
      )}
    </div>
  );
}
