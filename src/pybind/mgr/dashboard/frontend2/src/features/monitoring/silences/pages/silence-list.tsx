import { useState } from 'react';
import { useNavigate } from 'react-router';
import { VolumeX, RefreshCw, Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import {
  usePrometheusSilences,
  useDeleteSilence,
} from '../../api/use-prometheus';
import type { AlertmanagerSilence } from '../../api/use-prometheus';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const stateColors: Record<string, string> = {
  active: 'bg-green-500 text-white',
  pending: 'bg-yellow-500 text-white',
  expired: 'bg-gray-400 text-white',
};

function StateBadge({ state }: { state: string }) {
  const colorClass = stateColors[state] || 'bg-gray-400 text-white';
  return <Badge className={colorClass}>{state}</Badge>;
}

function MatchersCell({ matchers }: { matchers: Array<{ name: string; value: string; isRegex: boolean }> }) {
  if (!matchers || matchers.length === 0) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {matchers.map((m, i) => (
        <Badge key={i} variant="outline" className="text-xs">
          {m.isRegex ? `${m.name}~="${m.value}"` : `${m.name}="${m.value}"`}
        </Badge>
      ))}
    </div>
  );
}

export function SilenceListPage() {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSilence, setSelectedSilence] = useState<AlertmanagerSilence | null>(null);

  const { data: silences = [], isLoading, refetch, isRefetching } = usePrometheusSilences();
  const deleteSilence = useDeleteSilence();

  const sortedSilences = [...silences].sort((a, b) => {
    const stateOrder = { active: 0, pending: 1, expired: 2 };
    const aState = a.status?.state || 'expired';
    const bState = b.status?.state || 'expired';
    return stateOrder[aState] - stateOrder[bState];
  });

  const handleEdit = (silence: AlertmanagerSilence) => {
    navigate(`/monitoring/silences/edit/${silence.id}`);
  };

  const handleRecreate = (silence: AlertmanagerSilence) => {
    navigate(`/monitoring/silences/recreate/${silence.id}`);
  };

  const handleDeleteClick = (silence: AlertmanagerSilence) => {
    setSelectedSilence(silence);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSilence?.id) {
      await deleteSilence.mutateAsync(selectedSilence.id);
      setDeleteDialogOpen(false);
      setSelectedSilence(null);
    }
  };

  const columns: ColumnDef<AlertmanagerSilence>[] = [
    {
      id: 'matchers',
      header: '匹配器',
      cell: ({ row }) => <MatchersCell matchers={row.original.matchers} />,
    },
    {
      accessorKey: 'createdBy',
      header: '创建者',
      cell: ({ row }) => <span>{row.getValue('createdBy')}</span>,
    },
    {
      accessorKey: 'comment',
      header: '备注',
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[200px] truncate block">
          {row.getValue('comment') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'startsAt',
      header: '开始时间',
      cell: ({ row }) => {
        const startsAt = row.getValue('startsAt') as string;
        if (!startsAt) return '-';
        try {
          return format(new Date(startsAt), 'yyyy-MM-dd HH:mm', { locale: zhCN });
        } catch {
          return '-';
        }
      },
    },
    {
      accessorKey: 'endsAt',
      header: '结束时间',
      cell: ({ row }) => {
        const endsAt = row.getValue('endsAt') as string;
        if (!endsAt) return '-';
        try {
          return format(new Date(endsAt), 'yyyy-MM-dd HH:mm', { locale: zhCN });
        } catch {
          return '-';
        }
      },
    },
    {
      accessorKey: 'status.state',
      header: '状态',
      cell: ({ row }) => <StateBadge state={row.original.status?.state || 'expired'} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const silence = row.original;
        const isExpired = silence.status?.state === 'expired';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isExpired && (
                <DropdownMenuItem onClick={() => handleEdit(silence)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
              )}
              {isExpired && (
                <DropdownMenuItem onClick={() => handleRecreate(silence)}>
                  <Copy className="mr-2 h-4 w-4" />
                  重建
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleDeleteClick(silence)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isExpired ? '删除' : '过期'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VolumeX className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">静默规则</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isRefetching && 'animate-spin')} />
            刷新
          </Button>
          <Button size="sm" onClick={() => navigate('/monitoring/silences/create')}>
            <Plus className="h-4 w-4 mr-1" />
            创建
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        共 {silences.length} 条静默规则
        {silences.filter(s => s.status?.state === 'active').length > 0 && (
          <span className="ml-2">
            （{silences.filter(s => s.status?.state === 'active').length} 活跃）
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={sortedSilences}
        isLoading={isLoading}
        rowClassName={(row) =>
          cn(row.original.status?.state === 'expired' && 'opacity-50')
        }
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此静默规则吗？此操作无法撤销。
              {selectedSilence?.status?.state !== 'expired' && (
                <span className="block mt-2 text-yellow-600">
                  注意：这将使静默规则提前过期。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
