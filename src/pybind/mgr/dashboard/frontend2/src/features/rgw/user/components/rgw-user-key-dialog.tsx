import type { RgwUser } from '../api/use-rgw-user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function RgwUserKeyDialog({
  open,
  onClose,
  keyData,
}: {
  open: boolean;
  onClose: () => void;
  keyData: { user: string; type: string; access_key?: string; secret_key?: string } | null;
}) {
  if (!keyData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {keyData.type === 'Swift' ? 'Swift Key' : 'S3 Key'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">User</span>
            <span className="text-sm font-mono">{keyData.user}</span>
          </div>
          {keyData.access_key && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Access Key</span>
              <div className="p-2 bg-muted rounded font-mono text-xs break-all select-all">
                {keyData.access_key}
              </div>
            </div>
          )}
          {keyData.secret_key && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Secret Key</span>
              <div className="p-2 bg-muted rounded font-mono text-xs break-all select-all">
                {keyData.secret_key}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function buildKeyList(user: RgwUser) {
  const keys: Array<{ user: string; type: string; access_key?: string; secret_key?: string }> = [];
  for (const k of user.keys ?? []) {
    keys.push({ user: k.user, type: 'S3', access_key: k.access_key, secret_key: k.secret_key });
  }
  for (const k of user.swift_keys ?? []) {
    keys.push({ user: k.user, type: 'Swift', secret_key: k.secret_key });
  }
  return keys;
}
