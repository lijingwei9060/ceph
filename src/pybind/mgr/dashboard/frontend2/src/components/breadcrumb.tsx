import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';

interface BreadcrumbConfig {
  text: string;
  path?: string;
}

const ROUTE_BREADCRUMBS: Record<string, BreadcrumbConfig[]> = {
  '/dashboard': [{ text: 'Dashboard' }],
  '/hosts': [{ text: 'Cluster', path: '/cluster' }, { text: 'Hosts' }],
  '/inventory': [{ text: 'Cluster', path: '/cluster' }, { text: 'Physical Disks' }],
  '/monitors': [{ text: 'Cluster', path: '/cluster' }, { text: 'Monitors' }],
  '/services': [{ text: 'Cluster', path: '/cluster' }, { text: 'Services' }],
  '/osd': [{ text: 'Cluster', path: '/cluster' }, { text: 'OSD' }],
  '/configuration': [{ text: 'Cluster', path: '/cluster' }, { text: 'Configuration' }],
  '/crush-map': [{ text: 'Cluster', path: '/cluster' }, { text: 'CRUSH Map' }],
  '/mgr-modules': [{ text: 'Cluster', path: '/cluster' }, { text: 'Manager Modules' }],
  '/logs': [{ text: 'Cluster', path: '/cluster' }, { text: 'Logs' }],
  '/monitoring': [{ text: 'Cluster', path: '/cluster' }, { text: 'Monitoring' }],
  '/pools': [{ text: 'Pools' }],
  '/block/rbd': [{ text: 'Block', path: '/block' }, { text: 'Images' }],
  '/block/mirroring': [{ text: 'Block', path: '/block' }, { text: 'Mirroring' }],
  '/block/iscsi': [{ text: 'Block', path: '/block' }, { text: 'iSCSI' }],
  '/block': [{ text: 'Block' }],
  '/nfs': [{ text: 'NFS' }],
  '/cephfs': [{ text: 'File Systems' }],
  '/cephfs/snapshots': [{ text: 'File Systems', path: '/cephfs' }, { text: 'Snapshots' }],
  '/cephfs/directory': [{ text: 'File Systems', path: '/cephfs' }, { text: 'Directory' }],
  '/rgw/daemon': [{ text: 'Object Gateway', path: '/rgw' }, { text: 'Daemons' }],
  '/rgw/user': [{ text: 'Object Gateway', path: '/rgw' }, { text: 'Users' }],
  '/rgw/bucket': [{ text: 'Object Gateway', path: '/rgw' }, { text: 'Buckets' }],
  '/rgw': [{ text: 'Object Gateway' }],
  '/settings': [{ text: 'Settings' }],
};

export function Breadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation();
  const path = location.pathname;

  const crumbs = ROUTE_BREADCRUMBS[path] || [
    { text: path.split('/').filter(Boolean).join(' / ') },
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <BreadcrumbSeparator>
                <Slash className="h-3 w-3" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {crumb.path && index < crumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{t(`nav.${crumb.text.toLowerCase().replace(/\s/g, '')}`, crumb.text)}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>
                  {t(`nav.${crumb.text.toLowerCase().replace(/\s/g, '')}`, crumb.text)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
