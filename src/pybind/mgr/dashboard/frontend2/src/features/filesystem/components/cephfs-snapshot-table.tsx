import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateCephFsSnapshot, useDeleteCephFsSnapshot, type CephFsSnapshot } from '../api/use-cephfs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function CephFsSnapshotTable({
  fsId,
  path,
  snapshots,
}: {
  fsId: number;
  path: string;
  snapshots?: CephFsSnapshot[];
}) {
  const createSnapshot = useCreateCephFsSnapshot();
  const deleteSnapshot = useDeleteCephFsSnapshot();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim() || new Date().toISOString().replace(/[:.]/g, '-');
    try {
      await createSnapshot.mutateAsync({ fsId, path, name });
      toast.success(`Snapshot "${name}" created`);
      setNewName('');
      setShowCreate(false);
    } catch {
      toast.error('Failed to create snapshot');
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteSnapshot.mutateAsync({ fsId, path, name });
      toast.success(`Snapshot "${name}" deleted`);
    } catch {
      toast.error('Failed to delete snapshot');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Snapshots ({snapshots?.length ?? 0})</h4>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" /> Create
        </Button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded">
          <Input
            className="h-7 text-xs flex-1"
            placeholder="Snapshot name (auto-generated if empty)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createSnapshot.isPending}>
            Create
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
        </div>
      )}

      {!snapshots?.length ? (
        <p className="text-xs text-muted-foreground text-center py-2">No snapshots</p>
      ) : (
        <div className="space-y-1">
          {snapshots.map((snap, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div>
                <span className="font-medium text-xs">{snap.name}</span>
                {snap.created && (
                  <span className="text-muted-foreground text-xs ml-2">{snap.created}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleDelete(snap.name)}
                disabled={deleteSnapshot.isPending}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
