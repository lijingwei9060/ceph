import { useRgwDaemon } from '../api/use-rgw-daemon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  );
}

export function RgwDaemonDetailDialog({
  svcId,
  open,
  onClose,
}: {
  svcId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useRgwDaemon(open ? svcId : null);

  const metadata = data?.rgw_metadata;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RGW Daemon: {svcId}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : metadata ? (
          <div>
            <DetailRow label="ID" value={<span className="font-mono">{metadata.id}</span>} />
            <DetailRow label="Ceph Version" value={metadata.ceph_version} />
            <DetailRow label="Realm" value={metadata.realm_name} />
            <DetailRow label="Zone Group" value={metadata.zonegroup_name} />
            <DetailRow label="Zone" value={metadata.zone_name} />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No metadata available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
