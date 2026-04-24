import { useTranslation } from 'react-i18next';
import { Network, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useHealthFull } from '@/features/health/api/use-health';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CrushNode } from '@/types/health';

function CrushTreeNode({ node, depth = 0 }: { node: CrushNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer',
          depth === 0 && 'font-semibold'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        <Badge variant="outline" className="text-xs">
          {node.type}
        </Badge>
        <span className="text-sm">{node.name}</span>
        <span className="text-xs text-muted-foreground">
          (weight: {node.weight.toFixed(3)})
        </span>
      </div>
      {expanded &&
        node.children?.map((child) => (
          <CrushTreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function CrushMapPage() {
  const { t } = useTranslation();
  const { data: health, isLoading } = useHealthFull();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const crushMap = health?.osd_map?.crush;
  const trees: CrushNode[] = crushMap?.trees ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Network className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t('nav.crushMap')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CRUSH Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {trees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No CRUSH data available</p>
          ) : (
            <div className="space-y-1">
              {trees.map((tree) => (
                <CrushTreeNode key={tree.id} node={tree} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
