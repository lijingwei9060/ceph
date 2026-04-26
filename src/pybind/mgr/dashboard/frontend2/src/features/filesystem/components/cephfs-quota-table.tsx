import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { useSetCephFsQuota, type CephFsQuotas } from '../api/use-cephfs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDimlessBinary } from '@/lib/format';

export function CephFsQuotaEditor({
  fsId,
  path,
  quotas,
  isRoot,
}: {
  fsId: number;
  path: string;
  quotas?: CephFsQuotas;
  isRoot: boolean;
}) {
  const setQuota = useSetCephFsQuota();
  const [editing, setEditing] = useState<'max_bytes' | 'max_files' | null>(null);
  const [editValue, setEditValue] = useState('');

  if (isRoot) return null;

  const handleSet = async (field: 'max_bytes' | 'max_files') => {
    const numVal = field === 'max_bytes' ? parseSize(editValue) : parseInt(editValue, 10);
    if (isNaN(numVal)) {
      toast.error('Invalid value');
      return;
    }
    try {
      await setQuota.mutateAsync({
        fsId,
        path,
        [field === 'max_bytes' ? 'maxBytes' : 'maxFiles']: numVal,
        [field === 'max_bytes' ? 'maxFiles' : 'maxBytes']: field === 'max_bytes' ? (quotas?.max_files ?? 0) : (quotas?.max_bytes ?? 0),
      });
      toast.success('Quota updated');
      setEditing(null);
    } catch {
      toast.error('Failed to update quota');
    }
  };

  const handleUnset = async (field: 'max_bytes' | 'max_files') => {
    try {
      await setQuota.mutateAsync({
        fsId,
        path,
        [field === 'max_bytes' ? 'maxBytes' : 'maxFiles']: 0,
        [field === 'max_bytes' ? 'maxFiles' : 'maxBytes']: field === 'max_bytes' ? (quotas?.max_files ?? 0) : (quotas?.max_bytes ?? 0),
      });
      toast.success('Quota removed');
    } catch {
      toast.error('Failed to remove quota');
    }
  };

  const quotaRows = [
    { field: 'max_bytes' as const, label: 'Max Size', value: quotas?.max_bytes },
    { field: 'max_files' as const, label: 'Max Files', value: quotas?.max_files },
  ];

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Quotas</h4>
      <div className="space-y-1">
        {quotaRows.map(({ field, label, value }) => (
          <div key={field} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">{label}</span>
            {editing === field ? (
              <div className="flex items-center gap-1">
                <Input
                  className="h-7 w-32 text-xs"
                  placeholder={field === 'max_bytes' ? 'e.g. 10G' : 'e.g. 1000'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSet(field)}
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSet(field)}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs">
                  {value ? (field === 'max_bytes' ? formatDimlessBinary(value) : value.toLocaleString()) : '—'}
                </span>
                {value ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleUnset(field)}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => { setEditing(field); setEditValue(''); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSize(input: string): number {
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?)B?$/i);
  if (!match) return parseInt(input, 10);
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4, P: 1024 ** 5, E: 1024 ** 6 };
  return Math.floor(num * (multipliers[unit] ?? 1));
}
