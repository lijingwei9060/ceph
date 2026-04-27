import { useState } from 'react';
import { type RgwUser, useRgwUserQuota, useDeleteRgwUserKey, useDeleteRgwUserSubuser, useDeleteRgwUserCapability } from '../api/use-rgw-user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RgwUserKeyDialog, buildKeyList } from './rgw-user-key-dialog';
import { formatDimlessBinary } from '@/lib/format';
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  );
}

function QuotaSection({ title, quota }: { title: string; quota?: { enabled?: boolean; max_size_kb?: number; max_size?: number; max_objects?: number } }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="space-y-1 pl-2">
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Enabled</span>
          <Badge variant={quota?.enabled ? 'default' : 'secondary'}>{quota?.enabled ? 'Yes' : 'No'}</Badge>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Maximum Size</span>
          <span>{quota?.max_size_kb ? formatDimlessBinary(quota.max_size_kb * 1024) : 'Unlimited'}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-muted-foreground">Maximum Objects</span>
          <span>{quota?.max_objects ? quota.max_objects.toLocaleString() : 'Unlimited'}</span>
        </div>
      </div>
    </div>
  );
}

export function RgwUserDetailDialog({
  user,
  open,
  onClose,
}: {
  user: RgwUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<{ user: string; type: string; access_key?: string; secret_key?: string } | null>(null);
  const { data: quotaData } = useRgwUserQuota(open ? user?.user_id ?? null : null);
  const deleteKey = useDeleteRgwUserKey();
  const deleteSubuser = useDeleteRgwUserSubuser();
  const deleteCap = useDeleteRgwUserCapability();

  if (!user) return null;

  const keyList = buildKeyList(user);
  const maxBucketsLabel = user.max_buckets === -1 ? 'Disabled' : user.max_buckets === 0 ? 'Unlimited' : String(user.max_buckets);

  const handleDeleteKey = async (accessKey: string) => {
    try {
      await deleteKey.mutateAsync({ uid: user.user_id, key_type: 's3', access_key: accessKey });
      toast.success('Key deleted');
      onClose();
    } catch {
      toast.error('Failed to delete key');
    }
  };

  const handleDeleteSubuser = async (subuserId: string) => {
    try {
      await deleteSubuser.mutateAsync({ uid: user.user_id, subuser: subuserId });
      toast.success('Subuser deleted');
      onClose();
    } catch {
      toast.error('Failed to delete subuser');
    }
  };

  const handleDeleteCap = async (type: string, perm: string) => {
    try {
      await deleteCap.mutateAsync({ uid: user.user_id, type, perm });
      toast.success('Capability removed');
      onClose();
    } catch {
      toast.error('Failed to remove capability');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User: {user.display_name || user.user_id}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="keys">Keys ({keyList.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-1 mt-4">
              <DetailRow label="User ID" value={<span className="font-mono">{user.user_id}</span>} />
              {user.tenant && <DetailRow label="Tenant" value={<span className="font-mono">{user.tenant}</span>} />}
              <DetailRow label="Display Name" value={user.display_name} />
              {user.email && <DetailRow label="Email" value={user.email} />}
              <DetailRow label="Suspended" value={<Badge variant={user.suspended ? 'destructive' : 'default'}>{user.suspended ? 'Yes' : 'No'}</Badge>} />
              <DetailRow label="System" value={user.system === 'true' ? 'Yes' : 'No'} />
              <DetailRow label="Max Buckets" value={maxBucketsLabel} />

              {user.subusers?.length ? (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Subusers ({user.subusers.length})</h4>
                  <div className="space-y-1">
                    {user.subusers.map((su) => (
                      <div key={su.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <span className="font-mono">{su.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{su.permissions}</Badge>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDeleteSubuser(su.id.split(':')[1] || su.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {user.caps?.length ? (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Capabilities ({user.caps.length})</h4>
                  <div className="space-y-1">
                    {user.caps.map((cap, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <Badge variant="outline">{cap.type}: {cap.perm}</Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDeleteCap(cap.type, cap.perm)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {user.mfa_ids?.length ? (
                <DetailRow label="MFA IDs" value={user.mfa_ids.join(', ')} />
              ) : null}

              <QuotaSection title="User Quota" quota={quotaData?.user_quota ?? user.user_quota} />
              <QuotaSection title="Bucket Quota" quota={quotaData?.bucket_quota ?? user.bucket_quota} />
            </TabsContent>

            <TabsContent value="keys" className="mt-4">
              {!keyList.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No keys</p>
              ) : (
                <div className="space-y-2">
                  {keyList.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{k.type}</Badge>
                        <span className="text-sm font-mono">{k.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedKey(k)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {k.type === 'S3' && k.access_key && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteKey(k.access_key!)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <RgwUserKeyDialog
        open={selectedKey !== null}
        onClose={() => setSelectedKey(null)}
        keyData={selectedKey}
      />
    </>
  );
}
