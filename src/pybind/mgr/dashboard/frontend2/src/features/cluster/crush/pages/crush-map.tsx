import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Network, ChevronRight, ChevronDown } from 'lucide-react';
import { useCrushInfo } from '../api/use-crush-rule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CrushNodeRaw {
  id: number;
  name: string;
  type: string;
  type_id: number;
  children?: number[];
  device_class?: string;
  crush_weight?: number;
  exists?: number;
  primary_affinity?: number;
  reweight?: number;
  status?: string;
  pool_weights?: Record<string, number>;
}

interface TreeNode {
  id: number;
  name: string;
  type: string;
  status?: string;
  crushWeight?: number;
  deviceClass?: string;
  children: TreeNode[];
  raw: CrushNodeRaw;
}

function buildTree(data: { nodes: CrushNodeRaw[]; roots: number[] }): TreeNode[] {
  const { nodes, roots } = data;
  if (!nodes || nodes.length === 0) return [];

  const nodeMap = new Map<number, TreeNode>();

  // Process in reverse so children are resolved before parents
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const childNodes: TreeNode[] = [];
    if (node.children) {
      for (const childId of [...node.children].sort((a, b) => a - b)) {
        const child = nodeMap.get(childId);
        if (child) childNodes.push(child);
      }
    }

    nodeMap.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      crushWeight: node.crush_weight,
      deviceClass: node.device_class,
      children: childNodes,
      raw: node,
    });
  }

  return roots
    .map((id) => nodeMap.get(id))
    .filter((n): n is TreeNode => n !== undefined);
}

function CrushTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

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
        {node.crushWeight !== undefined && node.crushWeight > 0 && (
          <span className="text-xs text-muted-foreground">
            (weight: {node.crushWeight.toFixed(3)})
          </span>
        )}
        {node.deviceClass && (
          <Badge variant="secondary" className="text-xs">{node.deviceClass}</Badge>
        )}
        {node.status && (
          <Badge variant={node.status === 'up' ? 'default' : 'secondary'} className="text-xs">
            {node.status}
          </Badge>
        )}
      </div>
      {expanded &&
        node.children.map((child) => (
          <CrushTreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function CrushMapPage() {
  const { t } = useTranslation();
  const { data: crushInfo, isLoading } = useCrushInfo();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const treeNodes = crushInfo ? buildTree(crushInfo) : [];

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
          {treeNodes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No CRUSH data available</p>
          ) : (
            <div className="space-y-1">
              {treeNodes.map((node) => (
                <CrushTreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
