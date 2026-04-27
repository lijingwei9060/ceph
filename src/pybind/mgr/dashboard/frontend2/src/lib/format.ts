const SI_UNITS = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
const BINARY_PER_SEC_UNITS = ['B/s', 'kB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s', 'EB/s', 'ZB/s', 'YB/s'];

function formatNumber(n: number, divisor: number, units: string[], decimals = 1): string {
  if (n == null || isNaN(n)) return '-';
  if (n < 1 && n >= 0) return `0 ${units[0]}`;
  if (n < 0 && n > -1) return `0 ${units[0]}`;

  let value = Math.abs(n);
  let unitIndex = 0;
  while (value >= divisor && unitIndex < units.length - 1) {
    value /= divisor;
    unitIndex++;
  }

  const rounded = Number(value.toFixed(decimals));
  const prefix = n < 0 ? '-' : '';
  return `${prefix}${rounded} ${units[unitIndex]}`;
}

export function formatDimless(value: number, decimals = 1): string {
  return formatNumber(value, 1000, SI_UNITS, decimals);
}

export function formatDimlessBinary(value: number, decimals = 1): string {
  return formatNumber(value, 1024, BINARY_UNITS, decimals);
}

export function formatDimlessBinaryPerSecond(value: number, decimals = 1): string {
  return formatNumber(value, 1024, BINARY_PER_SEC_UNITS, decimals);
}

export function formatIops(value: number): string {
  if (value == null || isNaN(value)) return '-';
  return `${value} IOPS`;
}

export function formatMilliseconds(value: number): string {
  if (value == null || isNaN(value)) return '-';
  return `${value} ms`;
}

export function formatDuration(seconds: number): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '';

  const units = [
    { label: 'year', seconds: 31536000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  let remaining = Math.floor(seconds);
  const parts: string[] = [];

  for (const unit of units) {
    const count = Math.floor(remaining / unit.seconds);
    if (count > 0) {
      parts.push(`${count} ${count === 1 ? unit.label : unit.label + 's'}`);
      remaining -= count * unit.seconds;
    }
  }

  if (parts.length === 0) return '1 second';
  return parts.join(' ');
}

export function formatDate(date: Date | string | number): string {
  if (date == null) return '-';
  const d = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  if (isNaN(d.getTime())) return '-';
  const dateStr = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${dateStr} ${timeStr}`;
}

export function formatRelativeDate(date: Date | string | number): string {
  if (date == null) return '-';
  const d = typeof date === 'number'
    ? new Date(date * 1000)
    : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'a few seconds ago';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  const days = Math.floor(diffSec / 86400);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function formatBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return ['y', 'yes', 't', 'true', 'on', '1'].includes(value.toLowerCase());
  }
  return false;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

export function truncate(text: string, length: number, omission = ''): string {
  if (!text || text.length <= length) return text ?? '';
  return text.slice(0, length) + omission;
}

const CEPH_VERSION_RE = /ceph version (\d+\.\d+\.\d+)[-\s]*\w*\s*\(\w*\)\s*(\w+)/;

export function cephReleaseName(version: string): string {
  if (!version) return '';
  const match = version.match(CEPH_VERSION_RE);
  if (!match) return '';
  return match[2] || 'main';
}

export function cephVersion(version: string): string {
  if (!version) return '';
  const match = version.match(/ceph version (\d+\.\d+\.\d+)/);
  return match ? match[1] : '';
}

const BYTE_UNITS: Record<string, number> = {
  B: 1,
  KB: 1000,
  KIB: 1024,
  MB: 1_000_000,
  MIB: 1_048_576,
  GB: 1_000_000_000,
  GIB: 1_073_741_824,
  TB: 1_000_000_000_000,
  TIB: 1_099_511_627_776,
  PB: 1_000_000_000_000_000,
  PIB: 1_125_899_906_842_624,
  EB: 1e18,
  EIB: 1_152_921_504_606_846_976,
  ZB: 1e21,
  ZIB: 1_180_591_620_717_411_303_424,
  YB: 1e24,
  YIB: 1_208_925_819_614_629_174_706_176,
};

export function toBytes(value: string): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multiplier = BYTE_UNITS[unit];
  if (multiplier == null) return null;
  return num * multiplier;
}

export function toMilliseconds(value: string): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)?)\s*ms$/);
  return match ? parseFloat(match[1]) : null;
}

export function toIops(value: string): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)?)\s*IOPS$/i);
  return match ? parseFloat(match[1]) : null;
}
