import { describe, expect, it } from 'vitest'
import { classifyPreviewKind } from './filePreviewKind'

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
