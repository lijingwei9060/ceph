import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { useCephFsLsDir, type CephFsDirEntry } from '../api/use-cephfs';
import { CephFsQuotaEditor } from './cephfs-quota-table';
import { CephFsSnapshotTable } from './cephfs-snapshot-table';

function DirectoryNode({
  entry,
  fsId,
  depth = 0,
  onSelect,
  selectedPath,
}: {
  entry: CephFsDirEntry;
  fsId: number;
  depth?: number;
  onSelect: (entry: CephFsDirEntry) => void;
  selectedPath: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: children, refetch } = useCephFsLsDir(fsId, expanded ? entry.path : null);
  const isSelected = selectedPath === entry.path;

  const handleToggle = () => {
    if (!expanded) refetch();
    setExpanded(!expanded);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-muted/50 rounded text-sm ${isSelected ? 'bg-muted' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button onClick={handleToggle} className="p-0 h-4 w-4 flex items-center justify-center">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate" onClick={() => onSelect(entry)}>
          {entry.name}
        </span>
      </div>
      {expanded && children?.map((child, i) => (
        <DirectoryNode
          key={`${child.path}-${i}`}
          entry={child}
          fsId={fsId}
          depth={depth + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

export function CephFsDirectoryTree({
  fsId,
  rootDir,
  onSelect,
  selectedPath,
}: {
  fsId: number;
  rootDir: CephFsDirEntry;
  onSelect: (entry: CephFsDirEntry) => void;
  selectedPath: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Directories</span>
      </div>
      <DirectoryNode
        entry={rootDir}
        fsId={fsId}
        onSelect={onSelect}
        selectedPath={selectedPath}
      />
    </div>
  );
}

export function CephFsDirectoryPanel({
  fsId,
  selectedEntry,
}: {
  fsId: number;
  selectedEntry: CephFsDirEntry | null;
}) {
  if (!selectedEntry) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a directory to view details
      </div>
    );
  }

  const isRoot = selectedEntry.path === '/';

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Path</h4>
        <code className="text-xs bg-muted px-2 py-1 rounded">{selectedEntry.path}</code>
      </div>

      <CephFsQuotaEditor
        fsId={fsId}
        path={selectedEntry.path}
        quotas={selectedEntry.quotas}
        isRoot={isRoot}
      />

      <CephFsSnapshotTable
        fsId={fsId}
        path={selectedEntry.path}
        snapshots={selectedEntry.snapshots}
      />
    </div>
  );
}
