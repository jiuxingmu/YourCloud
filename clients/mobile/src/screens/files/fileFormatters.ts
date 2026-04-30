import { formatBytes } from '@yourcloud/sdk';

export function formatFileSize(size: number): string {
  return formatBytes(size);
}

export function formatFileDate(iso?: string): string {
  if (!iso) return '--/--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--/--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

export function getFilePlaceholderColor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) return '#DBEAFE';
  return '#EEF2FF';
}
