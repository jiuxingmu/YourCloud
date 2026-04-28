import { describe, expect, it } from 'vitest'
import { classifyPreviewKind } from './filePreviewKind'
import { shouldFetchPreviewSource } from './FilePreview'

describe('classifyPreviewKind', () => {
  it('classifies image and video from mime type', () => {
    expect(classifyPreviewKind('a.bin', 'image/png')).toBe('image')
    expect(classifyPreviewKind('a.bin', 'video/mp4')).toBe('video')
  })

  it('classifies docs by extension and mime type', () => {
    expect(classifyPreviewKind('proposal.pdf')).toBe('document')
    expect(classifyPreviewKind('deck.pptx')).toBe('document')
    expect(classifyPreviewKind('file.any', 'application/pdf')).toBe('document')
  })

  it('classifies plain text formats for content preview', () => {
    expect(classifyPreviewKind('notes.md')).toBe('text')
    expect(classifyPreviewKind('logs.txt')).toBe('text')
    expect(classifyPreviewKind('server.log', 'text/plain')).toBe('text')
  })

  it('falls back to other for unknown binary types', () => {
    expect(classifyPreviewKind('archive.zip')).toBe('other')
  })
})

describe('shouldFetchPreviewSource', () => {
  it('blocks preview fetching for folders', () => {
    expect(shouldFetchPreviewSource(100, 'inode/directory')).toBe(false)
  })

  it('blocks preview fetching for synthetic ids', () => {
    expect(shouldFetchPreviewSource(-1777374944622, 'text/plain')).toBe(false)
  })

  it('allows preview fetching for real files', () => {
    expect(shouldFetchPreviewSource(42, 'text/plain')).toBe(true)
  })
})
