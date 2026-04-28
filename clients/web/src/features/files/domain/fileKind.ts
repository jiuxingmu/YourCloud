const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
const AUDIO_EXT = ['.mp3', '.wav', '.aac', '.m4a', '.ogg']
const ARCHIVE_EXT = ['.zip', '.rar', '.7z', '.tar', '.gz']
const DOC_EXT = ['.doc', '.docx', '.txt', '.md']
const SHEET_EXT = ['.xls', '.xlsx', '.csv']
const SLIDE_EXT = ['.ppt', '.pptx']
const TEXT_EXT = ['.txt', '.md', '.json', '.csv', '.yaml', '.yml', '.xml', '.log']

export function lowerName(filename: string): string {
  return filename.toLowerCase()
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > -1 ? filename.slice(dot + 1).toLowerCase() : ''
}

export function hasExtension(filename: string, exts: string[]): boolean {
  const name = lowerName(filename)
  return exts.some((ext) => name.endsWith(ext))
}

export function isImageFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('image/') || hasExtension(filename, IMAGE_EXT)
}

export function isVideoFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('video/') || hasExtension(filename, VIDEO_EXT)
}

export function isAudioFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().startsWith('audio/') || hasExtension(filename, AUDIO_EXT)
}

export function isArchiveFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.includes('zip') || hasExtension(filename, ARCHIVE_EXT)
}

export function isPdfFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase() === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')
}

export function isDocFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.includes('word') || mime.includes('text') || hasExtension(filename, DOC_EXT)
}

export function isSheetFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().includes('sheet') || hasExtension(filename, SHEET_EXT)
}

export function isSlideFile(filename: string, mimeType?: string): boolean {
  return (mimeType || '').toLowerCase().includes('presentation') || hasExtension(filename, SLIDE_EXT)
}

export function isTextFile(filename: string, mimeType?: string): boolean {
  const mime = (mimeType || '').toLowerCase()
  return mime.startsWith('text/') || hasExtension(filename, TEXT_EXT)
}
