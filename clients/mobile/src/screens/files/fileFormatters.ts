export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
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
