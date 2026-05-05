export type PreviewKind = 'image' | 'video' | 'document' | 'text' | 'other'
export type FileTimeFilter = 'all' | 'today' | '7d' | '30d' | 'thisYear' | 'lastYear'
export type FileTypeFilter = 'all' | 'doc' | 'sheet' | 'slide' | 'image' | 'pdf' | 'video' | 'archive' | 'audio'

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
}

export function getBaseName(path: string): string {
  const normalized = normalizePath(path)
  const idx = normalized.lastIndexOf('/')
  return idx > -1 ? normalized.slice(idx + 1) : normalized
}

export function getParentPath(path: string): string {
  const normalized = normalizePath(path)
  const idx = normalized.lastIndexOf('/')
  return idx > -1 ? normalized.slice(0, idx) : ''
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  if (gb < 1024) return `${gb.toFixed(2)} GB`
  const tb = gb / 1024
  return `${Number(tb.toFixed(2))} TB`
}

export function extensionOfFilename(filename: string): string {
  const i = filename.lastIndexOf('.')
  if (i < 0) return ''
  return filename.slice(i + 1).toLowerCase()
}

export function isDirectoryItem(filename: string, mimeType?: string): boolean {
  void filename
  return mimeType === 'inode/directory'
}

export function classifyPreviewKind(filename: string, mimeType?: string): PreviewKind {
  const ext = extensionOfFilename(filename)
  const docExt = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])

  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
    return 'image'
  }
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(ext)) {
    return 'video'
  }
  if (
    mimeType?.startsWith('text/') ||
    mimeType === 'application/json' ||
    ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yml', 'yaml', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'sh'].includes(ext)
  ) {
    return 'text'
  }
  if (mimeType === 'application/pdf' || ext === 'pdf' || docExt.has(ext)) {
    return 'document'
  }
  return 'other'
}

export function isImageFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extensionOfFilename(filename))
}

export function isVideoFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(extensionOfFilename(filename))
}

export function isAudioFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('audio/') || ['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(extensionOfFilename(filename))
}

export function isArchiveFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.includes('zip') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extensionOfFilename(filename))
}

export function isPdfFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase() === 'application/pdf' || extensionOfFilename(filename) === 'pdf'
}

export function isDocFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.includes('word') || mime.includes('text') || ['doc', 'docx', 'txt', 'md'].includes(extensionOfFilename(filename))
}

export function isSheetFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().includes('sheet') || ['xls', 'xlsx', 'csv'].includes(extensionOfFilename(filename))
}

export function isSlideFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().includes('presentation') || ['ppt', 'pptx'].includes(extensionOfFilename(filename))
}

export function isTextFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'yaml', 'yml', 'xml', 'log'].includes(extensionOfFilename(filename))
}

export function shouldFetchPreviewSource(id: number, mimeType?: string): boolean {
  if (isDirectoryItem('', mimeType)) return false
  return id > 0
}

export function formatModified(value?: string): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function getRelativeBucket(value?: string): 'today' | 'lastMonth' | 'earlier' {
  if (!value) return 'earlier'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'earlier'
  const now = new Date()
  if (date.getTime() > now.getTime()) return 'earlier'
  if (date.toDateString() === now.toDateString()) return 'today'
  const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  if (monthDiff === 1) return 'lastMonth'
  return 'earlier'
}

export function matchesTimeFilter(file: { updatedAt?: string; createdAt?: string }, timeFilter: FileTimeFilter): boolean {
  if (timeFilter === 'all') return true
  const raw = file.updatedAt ?? file.createdAt
  if (!raw) return false
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return false
  if (timeFilter === 'today') return date.toDateString() === now.toDateString()
  if (timeFilter === '7d') return diffMs <= 7 * 24 * 3600 * 1000
  if (timeFilter === '30d') return diffMs <= 30 * 24 * 3600 * 1000
  if (timeFilter === 'thisYear') return date.getFullYear() === now.getFullYear()
  if (timeFilter === 'lastYear') return date.getFullYear() === now.getFullYear() - 1
  return true
}

export function matchesTypeFilter(file: { filename: string; mimeType?: string }, typeFilter: FileTypeFilter): boolean {
  if (typeFilter === 'all') return true
  if (file.mimeType === 'inode/directory') return true
  if (typeFilter === 'doc') return isDocFile(file.filename, file.mimeType)
  if (typeFilter === 'sheet') return isSheetFile(file.filename, file.mimeType)
  if (typeFilter === 'slide') return isSlideFile(file.filename, file.mimeType)
  if (typeFilter === 'image') return isImageFile(file.filename, file.mimeType)
  if (typeFilter === 'pdf') return isPdfFile(file.filename, file.mimeType)
  if (typeFilter === 'video') return isVideoFile(file.filename, file.mimeType)
  if (typeFilter === 'archive') return isArchiveFile(file.filename, file.mimeType)
  if (typeFilter === 'audio') return isAudioFile(file.filename, file.mimeType)
  return true
}
