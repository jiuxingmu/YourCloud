import { extensionOf, isImageFile, isPdfFile, isTextFile, isVideoFile } from '../features/files/domain'

type PreviewKind = 'image' | 'video' | 'document' | 'text' | 'other'

function classifyPreviewKind(filename: string, mimeType?: string): PreviewKind {
  const ext = extensionOf(filename)
  const docExt = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
  if (isImageFile(filename, mimeType)) return 'image'
  if (isVideoFile(filename, mimeType)) return 'video'
  if (isTextFile(filename, mimeType)) return 'text'
  if (isPdfFile(filename, mimeType) || docExt.has(ext)) return 'document'
  return 'other'
}

export { extensionOf, classifyPreviewKind, type PreviewKind }
