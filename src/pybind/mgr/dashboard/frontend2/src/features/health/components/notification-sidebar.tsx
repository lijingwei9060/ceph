import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle2, Info, AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { useSummary } from '@/features/health/api/use-health';
import type { ExecutingTask, FinishedTask } from '@/types';

type NotificationType = 'success' | 'error' | 'info';

interface CdNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: string;
  duration?: number;
  application: 'ceph' | 'prometheus';
}

const STORAGE_KEY = 'cdNotifications';
const MAX_NOTIFICATIONS = 10;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function taskToNotification(task: FinishedTask): CdNotification {
  const endTime = typeof task.end_time === 'string' ? task.end_time : new Date(task.end_time * 1000).toISOString();
  const durationMs = task.duration != null ? task.duration * 1000 : undefined;
  return {
    id: `${task.name}-${task.begin_time}-${task.end_time}`,
    type: task.success ? 'success' : 'error',
    title: task.description || task.name,
    message: task.exception
      ? (task.exception.detail ?? (typeof task.exception === 'string' ? task.exception : JSON.stringify(task.exception)))
      : undefined,
    timestamp: endTime,
    duration: durationMs,
    application: 'ceph',
  };
}

function loadNotifications(): CdNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotifications(notifications: CdNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
}

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  success: 'text-green-500',
  info: 'text-blue-500',
  error: 'text-red-500',
};

const TYPE_BORDER: Record<NotificationType, string> = {
  success: 'border-l-green-500',
  info: 'border-l-blue-500',
  error: 'border-l-red-500',
};

export function NotificationSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { data: summary } = useSummary(5000);
  const [notifications, setNotifications] = useState<CdNotification[]>(loadNotifications);

  const executingTasks: ExecutingTask[] = summary?.executing_tasks ?? [];

  // Convert newly finished tasks into notifications
  const finishedTasks = summary?.finished_tasks ?? [];
  useEffect(() => {
    if (finishedTasks.length === 0) return;
    const existingIds = new Set(notifications.map((n) => n.id));
    const newNotifs = finishedTasks
      .map(taskToNotification)
      .filter((n) => !existingIds.has(n.id));
    if (newNotifs.length === 0) return;
    setNotifications((prev) => {
      const next = [...newNotifs, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(next);
      return next;
    });
  }, [finishedTasks]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotifications(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const hasNotifications = notifications.length > 0 || executingTasks.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">{t('notifications.title')}</SheetTitle>
            {hasNotifications && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearAll}>
                <Trash2 className="h-3 w-3 mr-1" />
                {t('notifications.clearAll')}
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4 pb-4">
          {!hasNotifications && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          )}

          {executingTasks.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('notifications.executingTasks')}
              </h4>
              {executingTasks.map((task, i) => (
                <div key={`exec-${i}`} className="rounded-md border border-l-4 border-l-blue-500 p-3">
                  <div className="flex items-start gap-2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.description || task.name}</p>
                      {task.progress != null && task.progress > 0 && (
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all rounded-full"
                            style={{ width: `${Math.min(task.progress, 100)}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(task.begin_time).toLocaleTimeString()}
                        {task.progress != null && ` · ${Math.round(task.progress)}%`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('notifications.recent')}
              </h4>
              {notifications.map((notif) => {
                const Icon = TYPE_ICON[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={`rounded-md border border-l-4 ${TYPE_BORDER[notif.type]} p-3`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${TYPE_COLOR[notif.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {notif.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 break-all">
                            {notif.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground" title={new Date(notif.timestamp).toLocaleString()}>
                            {timeAgo(notif.timestamp)}
                          </span>
                          {notif.duration != null && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {formatDuration(notif.duration)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {notif.application === 'ceph' ? 'Ceph' : 'Prometheus'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => removeNotification(notif.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function NotificationBell() {
  const { t } = useTranslation();
  const { data: summary } = useSummary(5000);
  const [open, setOpen] = useState(false);
  const [hasStored, setHasStored] = useState(() => loadNotifications().length > 0);

  const executingTasks = summary?.executing_tasks ?? [];
  const hasRunning = executingTasks.length > 0;

  // Re-check stored notifications when summary changes (new finished tasks may arrive)
  useEffect(() => {
    setHasStored(loadNotifications().length > 0);
  }, [summary?.finished_tasks]);

  const showDot = hasStored || hasRunning;

  return (
    <>
      <Button variant="ghost" size="sm" className="relative" onClick={() => setOpen(true)} title={t('notifications.title')}>
        <Bell className={`h-4 w-4 ${hasRunning ? 'text-blue-500' : ''}`} />
        {showDot && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
        )}
      </Button>
      <NotificationSidebar open={open} onOpenChange={setOpen} />
    </>
  );
}
