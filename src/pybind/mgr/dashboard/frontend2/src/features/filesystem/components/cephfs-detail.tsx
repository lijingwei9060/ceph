import { useState } from 'react';
import {
  useCephFsTabs,
  useCephFsRootDir,
  type CephFsDirEntry,
} from '../api/use-cephfs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CephFsDirectoryTree, CephFsDirectoryPanel } from './cephfs-directory-tree';

function MdsStateBadge({ state }: { state: string }) {
  if (state === 'up:active' || state === 'up:replay') return <Badge variant="default">{state}</Badge>;
  if (state.startsWith('up:')) return <Badge variant="secondary">{state}</Badge>;
  return <Badge variant="destructive">{state}</Badge>;
}

export function CephFsDetailDialog({
  fsId,
  open,
  onClose,
}: {
  fsId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useCephFsTabs(fsId);
  const { data: rootDir } = useCephFsRootDir(open ? fsId : null);
  const [selectedEntry, setSelectedEntry] = useState<CephFsDirEntry | null>(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File System: {data?.name ?? `#${fsId}`}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : data ? (
          <Tabs defaultValue="ranks">
            <TabsList className="flex-wrap">
              <TabsTrigger value="ranks">MDS Ranks ({data.ranks?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="standbys">Standbys ({data.standbys?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="pools">Pools ({data.pools?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="clients">Clients ({data.clients?.length ?? 0})</TabsTrigger>
              {rootDir && <TabsTrigger value="directories">Directories</TabsTrigger>}
            </TabsList>

            <TabsContent value="ranks" className="space-y-2 mt-4">
              {data.ranks?.length ? (
                <div className="space-y-2">
                  {data.ranks.map((rank, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="space-y-1">
                        <p className="font-medium">Rank {rank.rank}: {rank.name}</p>
                        <p className="text-sm text-muted-foreground">GID: {rank.mds}</p>
                      </div>
                      <MdsStateBadge state={rank.state} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No active MDS ranks</p>
              )}
            </TabsContent>

            <TabsContent value="standbys" className="space-y-2 mt-4">
              {data.standbys?.length ? (
                <div className="space-y-1">
                  {data.standbys.map((s, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded">
                      <span className="font-medium">{s.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No standby MDS daemons</p>
              )}
            </TabsContent>

            <TabsContent value="pools" className="space-y-2 mt-4">
              {data.pools?.length ? (
                <div className="space-y-1">
                  {data.pools.map((pool, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>Pool {pool.pool}</span>
                      <Badge variant="outline">{pool.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No pool information</p>
              )}
            </TabsContent>

            <TabsContent value="clients" className="space-y-2 mt-4">
              {data.clients?.length ? (
                <div className="space-y-1">
                  {data.clients.map((client, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span>{client.hostname}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{client.type}</Badge>
                        <Badge variant="secondary">v{client.version}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No connected clients</p>
              )}
            </TabsContent>

            {rootDir && (
              <TabsContent value="directories" className="mt-4">
                <div className="flex gap-4 min-h-[300px]">
                  <div className="w-1/2 border rounded p-2 overflow-auto max-h-[400px]">
                    <CephFsDirectoryTree
                      fsId={fsId!}
                      rootDir={rootDir}
                      onSelect={setSelectedEntry}
                      selectedPath={selectedEntry?.path ?? null}
                    />
                  </div>
                  <div className="w-1/2 border rounded p-3 overflow-auto max-h-[400px]">
                    <CephFsDirectoryPanel
                      fsId={fsId!}
                      selectedEntry={selectedEntry}
                    />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
