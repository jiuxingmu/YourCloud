/** Human-readable byte size (binary units). */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  const rounded = i === 0 ? Math.round(v) : v < 10 ? Math.round(v * 10) / 10 : Math.round(v)
  return `${rounded} ${units[i]}`
}

export function formatBytesPerSec(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}
