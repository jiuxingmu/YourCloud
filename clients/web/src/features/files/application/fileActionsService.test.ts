import { describe, expect, it } from 'vitest'
import { buildShareLinkFromResponse, remapVirtualFoldersAfterMove, validateMoveTargetName } from './fileActionsService'
import type { FileItem } from '../domain'

describe('fileActionsService', () => {
  it('falls back to unknown share url when backend returns empty link', () => {
    expect(buildShareLinkFromResponse('', 'https://cloud.test')).toBe('https://cloud.test/?share=unknown')
  })

  it('rejects empty move target names after trimming', () => {
    expect(validateMoveTargetName('   ')).toBeNull()
  })

  it('remaps virtual folders after moving a folder', () => {
    const virtualFolders: FileItem[] = [
      { id: -1, filename: 'YC_QA_B', size: 0, mimeType: 'inode/directory', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: -2, filename: 'YC_QA_B/sub', size: 0, mimeType: 'inode/directory', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: -3, filename: 'YC_QA_C', size: 0, mimeType: 'inode/directory', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]

    const next = remapVirtualFoldersAfterMove(virtualFolders, 'YC_QA_B', 'YC_QA_A/YC_QA_B', true)
    expect(next.map((item) => item.filename)).toEqual(['YC_QA_A/YC_QA_B', 'YC_QA_A/YC_QA_B/sub', 'YC_QA_C'])
  })

  it('remaps only target item after moving a file', () => {
    const files: FileItem[] = [
      { id: 11, filename: 'YC_QA_B/readme.md', size: 12, mimeType: 'text/markdown', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 12, filename: 'YC_QA_B', size: 0, mimeType: 'inode/directory', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ]

    const next = remapVirtualFoldersAfterMove(files, 'YC_QA_B/readme.md', 'YC_QA_A/readme.md', false)
    expect(next.map((item) => item.filename)).toEqual(['YC_QA_A/readme.md', 'YC_QA_B'])
  })
})
