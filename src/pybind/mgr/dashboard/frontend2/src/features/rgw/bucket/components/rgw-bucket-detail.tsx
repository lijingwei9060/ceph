import { useRgwBucket } from '../api/use-rgw-bucket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDimlessBinary } from '@/lib/format';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  );
}

function QuotaSection({ quota }: { quota?: { enabled?: boolean; max_size_kb?: number; max_objects?: number } }) {
  if (!quota) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Bucket Quota</h4>
      <div className="space-y-1 pl-2">
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Enabled</span>
          <Badge variant={quota.enabled ? 'default' : 'secondary'}>{quota.enabled ? 'Yes' : 'No'}</Badge>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Maximum Size</span>
          <span>{quota.max_size_kb ? formatDimlessBinary(quota.max_size_kb * 1024) : 'Unlimited'}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Maximum Objects</span>
          <span>{quota.max_objects ? quota.max_objects.toLocaleString() : 'Unlimited'}</span>
        </div>
      </div>
    </div>
  );
}

export function RgwBucketDetailDialog({
  bucketName,
  open,
  onClose,
}: {
  bucketName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: bucket, isLoading } = useRgwBucket(open ? bucketName : null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bucket: {bucketName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : bucket ? (
          <div>
            <DetailRow label="Name" value={<span className="font-mono">{bucket.bid ?? bucket.bucket}</span>} />
            {bucket.id && <DetailRow label="ID" value={<span className="font-mono text-xs">{bucket.id}</span>} />}
            <DetailRow label="Owner" value={<span className="font-mono">{bucket.owner}</span>} />
            {bucket.index_type && <DetailRow label="Index Type" value={bucket.index_type} />}
            <DetailRow label="Placement Rule" value={<Badge variant="outline">{bucket.placement_rule}</Badge>} />
            {bucket.marker && <DetailRow label="Marker" value={<span className="font-mono text-xs">{bucket.marker}</span>} />}
            {bucket.ver && <DetailRow label="Version" value={bucket.ver} />}
            {bucket.zonegroup && <DetailRow label="Zone Group" value={bucket.zonegroup} />}
            {bucket.zone && <DetailRow label="Zone" value={bucket.zone} />}
            <DetailRow
              label="Versioning"
              value={bucket.versioning?.Status ? <Badge variant={bucket.versioning.Status === 'Enabled' ? 'default' : 'secondary'}>{bucket.versioning.Status}</Badge> : '-'}
            />
            {bucket.encryption && Object.keys(bucket.encryption).length > 0 && (
              <DetailRow label="Encryption" value={<Badge variant="outline">Enabled</Badge>} />
            )}

            {/* Locking */}
            {bucket.lock_enabled && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Object Locking</h4>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">Mode</span>
                    <Badge variant="outline">{bucket.lock_mode ?? '-'}</Badge>
                  </div>
                  {bucket.lock_retention_period_days != null && (
                    <div className="flex justify-between py-1 text-sm">
                      <span className="text-muted-foreground">Retention Days</span>
                      <span>{bucket.lock_retention_period_days}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <QuotaSection quota={bucket.bucket_quota} />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No data</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
