type PreviewKind = 'image' | 'video' | 'document' | 'text' | 'other'

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > -1 ? filename.slice(dot + 1).toLowerCase() : ''
}

function classifyPreviewKind(filename: string, mimeType?: string): PreviewKind {
  const ext = extensionOf(filename)
  const docExt = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
  const textExt = new Set(['txt', 'md', 'json', 'csv', 'yaml', 'yml', 'xml', 'log'])

  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  if (mimeType?.startsWith('text/')) return 'text'
  if (mimeType === 'application/pdf' || docExt.has(ext)) return 'document'
  if (textExt.has(ext)) return 'text'
  return 'other'
}

export { extensionOf, classifyPreviewKind, type PreviewKind }
