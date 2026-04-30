export type PreviewKind = 'image' | 'video' | 'document' | 'text' | 'other'

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf('.')
  if (i < 0) return ''
  return filename.slice(i + 1).toLowerCase()
}

function isImageFile(filename: string, mimeType?: string): boolean {
  if (mimeType?.startsWith('image/')) return true
  const ext = extensionOf(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

function isVideoFile(filename: string, mimeType?: string): boolean {
  if (mimeType?.startsWith('video/')) return true
  const ext = extensionOf(filename)
  return ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(ext)
}

function isTextFile(filename: string, mimeType?: string): boolean {
  if (mimeType?.startsWith('text/') || mimeType === 'application/json') return true
  const ext = extensionOf(filename)
  return ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yml', 'yaml', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'sh'].includes(ext)
}

function isPdfFile(filename: string, mimeType?: string): boolean {
  if (mimeType === 'application/pdf') return true
  return extensionOf(filename) === 'pdf'
}

export function classifyPreviewKind(filename: string, mimeType?: string): PreviewKind {
  const ext = extensionOf(filename)
  const docExt = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
  if (isImageFile(filename, mimeType)) return 'image'
  if (isVideoFile(filename, mimeType)) return 'video'
  if (isTextFile(filename, mimeType)) return 'text'
  if (isPdfFile(filename, mimeType) || docExt.has(ext)) return 'document'
  return 'other'
}

export function extensionOfFilename(filename: string): string {
  return extensionOf(filename)
}

export function isDirectoryItem(filename: string, mimeType?: string): boolean {
  return mimeType === 'inode/directory'
}
