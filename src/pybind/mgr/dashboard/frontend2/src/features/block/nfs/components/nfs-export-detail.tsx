import type { NfsExport } from '../api/use-nfs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  );
}

export function NfsExportDetailDialog({
  exportData,
  open,
  onClose,
}: {
  exportData: NfsExport | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!exportData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            NFS Export #{exportData.export_id}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="clients">
              Clients ({exportData.clients?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-1 mt-4">
            <DetailRow label="Cluster" value={exportData.cluster_id} />
            <DetailRow label="Path" value={<span className="font-mono">{exportData.path}</span>} />
            <DetailRow label="Pseudo Path" value={<span className="font-mono">{exportData.pseudo}</span>} />
            <DetailRow
              label="Access Type"
              value={<Badge variant={exportData.access_type === 'RW' ? 'default' : 'outline'}>{exportData.access_type}</Badge>}
            />
            <DetailRow
              label="Squash"
              value={<Badge variant="outline">{exportData.squash}</Badge>}
            />
            <DetailRow
              label="FSAL"
              value={<Badge variant="outline">{exportData.fsal?.name}</Badge>}
            />
            {exportData.fsal?.fs_name && (
              <DetailRow label="Filesystem" value={exportData.fsal.fs_name} />
            )}
            {exportData.fsal?.user_id && (
              <DetailRow label="User ID" value={<span className="font-mono text-xs">{exportData.fsal.user_id}</span>} />
            )}
            <DetailRow
              label="Protocols"
              value={exportData.protocols?.map((p) => (
                <Badge key={p} variant="secondary" className="mr-1">NFSv{p}</Badge>
              ))}
            />
            <DetailRow
              label="Transports"
              value={exportData.transports?.map((t) => (
                <Badge key={t} variant="secondary" className="mr-1">{t}</Badge>
              ))}
            />
            <DetailRow
              label="Security Label"
              value={exportData.security_label ? 'Enabled' : 'Disabled'}
            />
            {exportData.fsal?.sec_label_xattr && (
              <DetailRow label="Security Xattr" value={<span className="font-mono text-xs">{exportData.fsal.sec_label_xattr}</span>} />
            )}
          </TabsContent>

          <TabsContent value="clients" className="mt-4">
            {!exportData.clients?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No client restrictions — all clients can access
              </p>
            ) : (
              <div className="space-y-2">
                {exportData.clients.map((client, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {client.addresses.map((addr, j) => (
                        <Badge key={j} variant="outline" className="font-mono text-xs">
                          {addr}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Access: {client.access_type || 'inherit'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Squash: {client.squash || 'inherit'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
