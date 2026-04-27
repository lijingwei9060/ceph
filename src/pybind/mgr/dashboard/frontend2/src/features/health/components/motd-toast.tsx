import { useEffect } from 'react';
import { toast } from 'sonner';
import { useMotd } from '@/features/health/api/use-motd';

const DISMISSAL_KEY = 'motd_dismissed';
const DISMISSAL_VERSION_KEY = 'motd_dismissal_version';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSAL_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(dismissed: Set<string>) {
  localStorage.setItem(DISMISSAL_KEY, JSON.stringify([...dismissed]));
}


export function MotdToast() {
  const { data: motd } = useMotd();

  useEffect(() => {
    if (!motd?.message) return;

    const dismissalId = `${motd.severity}:${motd.md5}`;
    const dismissed = getDismissed();

    if (dismissed.has(dismissalId)) return;

    const title = motd.severity === 'danger'
      ? 'Important Notice'
      : motd.severity === 'warning'
      ? 'Warning'
      : 'Notice';

    toast(motd.message, {
      id: dismissalId,
      description: title,
      duration: motd.severity === 'danger' ? Infinity : 10000,
      dismissible: motd.severity !== 'danger',
      onDismiss: () => {
        const newDismissed = getDismissed();
        newDismissed.add(dismissalId);
        saveDismissed(newDismissed);
        localStorage.setItem(DISMISSAL_VERSION_KEY, dismissalId);
      },
    });
  }, [motd]);

  return null;
}
