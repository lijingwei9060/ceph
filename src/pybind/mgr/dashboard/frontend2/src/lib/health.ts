import type { HealthStatus } from '@/types';

export type HealthLevel = 'ok' | 'warning' | 'error' | 'unknown';

export function getHealthLevel(status?: HealthStatus): HealthLevel {
  if (!status) return 'unknown';
  if (status === 'HEALTH_OK') return 'ok';
  if (status === 'HEALTH_WARN') return 'warning';
  if (status === 'HEALTH_ERR') return 'error';
  return 'unknown';
}

export function getHealthIcon(status?: HealthStatus): string {
  const level = getHealthLevel(status);
  switch (level) {
    case 'ok': return 'CheckCircle';
    case 'warning': return 'AlertTriangle';
    case 'error': return 'AlertOctagon';
    default: return 'HelpCircle';
  }
}

export function getHealthColor(status?: HealthStatus): string {
  const level = getHealthLevel(status);
  switch (level) {
    case 'ok': return 'text-success';
    case 'warning': return 'text-warning';
    case 'error': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

export function getHealthBgColor(status?: HealthStatus): string {
  const level = getHealthLevel(status);
  switch (level) {
    case 'ok': return 'bg-success/10';
    case 'warning': return 'bg-warning/10';
    case 'error': return 'bg-destructive/10';
    default: return 'bg-muted';
  }
}

export function getHealthLabel(status?: HealthStatus): string {
  const level = getHealthLevel(status);
  switch (level) {
    case 'ok': return 'ok';
    case 'warning': return 'warning';
    case 'error': return 'error';
    default: return 'unknown';
  }
}
