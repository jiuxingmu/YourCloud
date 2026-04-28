import { describe, expect, it } from 'vitest'
import FilesPageContainer from './FilesPageContainer'
import { canDownloadFile, deriveDriveItems, formatDisplayFileSize, getDefaultViewModeForSection, getDeleteDialogDescription, getDeleteDialogTitle, getDeleteFeedbackText, getTrashClearFeedbackText, mergeVirtualAndRemoteFiles, shouldShowCreateActions, shouldUseTopRightViewSwitch } from '../features/files/domain'

describe('FilesPage helpers', () => {
  it('exposes FilesPageContainer for container/view split', () => {
    expect(typeof FilesPageContainer).toBe('function')
  })

  it('hides create actions in home and trash', () => {
    expect(shouldShowCreateActions('home')).toBe(false)
    expect(shouldShowCreateActions('trash')).toBe(false)
  })

  it('shows create actions only in drive section', () => {
    expect(shouldShowCreateActions('drive')).toBe(true)
    expect(shouldShowCreateActions('starred')).toBe(false)
    expect(shouldShowCreateActions('recent')).toBe(false)
  })

  it('defaults home/drive/recent/starred panels to list view', () => {
    expect(getDefaultViewModeForSection('home')).toBe('list')
    expect(getDefaultViewModeForSection('recent')).toBe('list')
    expect(getDefaultViewModeForSection('starred')).toBe('list')
    expect(getDefaultViewModeForSection('drive')).toBe('list')
    expect(getDefaultViewModeForSection('trash')).toBe('grid')
  })

  it('uses top-right view switch for home/drive/recent/starred panels', () => {
    expect(shouldUseTopRightViewSwitch('home')).toBe(true)
    expect(shouldUseTopRightViewSwitch('drive')).toBe(true)
    expect(shouldUseTopRightViewSwitch('recent')).toBe(true)
    expect(shouldUseTopRightViewSwitch('starred')).toBe(true)
    expect(shouldUseTopRightViewSwitch('trash')).toBe(false)
  })

  it('returns folder-specific delete dialog copy', () => {
    const folder = { id: 1, filename: 'parent/qa-folder-1', size: 0, mimeType: 'inode/directory' }
    expect(getDeleteDialogTitle(folder)).toBe('删除文件夹')
    expect(getDeleteDialogDescription(folder)).toContain('删除文件夹「qa-folder-1」')
  })

  it('returns file-specific delete dialog copy', () => {
    const file = { id: 1, filename: 'docs/spec.txt', size: 10, mimeType: 'text/plain' }
    expect(getDeleteDialogTitle(file)).toBe('删除文件')
    expect(getDeleteDialogDescription(file)).toContain('删除文件「spec.txt」')
  })

  it('uses basename in delete feedback to avoid truncated path noise', () => {
    const folder = { id: 1, filename: 'nested/path/qa-folder-1', size: 0, mimeType: 'inode/directory' }
    expect(getDeleteFeedbackText(folder)).toBe('已删除文件夹：「qa-folder-1」')
  })

  it('returns precise clear-trash feedback when trash is empty', () => {
    expect(getTrashClearFeedbackText([])).toBe('当前无可清空内容')
    expect(getTrashClearFeedbackText([{ id: 1, filename: 'a.txt', deletedAt: new Date().toISOString() }])).toBe('已清空回收站记录')
  })

  it('always keeps folders visible for type filtering and blocks folder download', () => {
    const folder = { id: 7, filename: 'folder-a', size: 0, mimeType: 'inode/directory' }
    const file = { id: 8, filename: 'a.txt', size: 1, mimeType: 'text/plain' }
    expect(canDownloadFile(folder)).toBe(false)
    expect(canDownloadFile(file)).toBe(true)
  })

  it('blocks invalid id from triggering download behavior', () => {
    const invalidFile = { id: -11, filename: 'ghost.txt', size: 10, mimeType: 'text/plain' }
    expect(canDownloadFile(invalidFile)).toBe(false)
  })

  it('shows dash for folder size display', () => {
    const folder = { id: 9, filename: 'folder-b', size: 0, mimeType: 'inode/directory' }
    const file = { id: 10, filename: 'note.txt', size: 1536, mimeType: 'text/plain' }
    expect(formatDisplayFileSize(folder)).toBe('-')
    expect(formatDisplayFileSize(file)).toContain('KB')
  })

  it('keeps optimistic virtual folder when remote list is empty', () => {
    const virtualFolder = { id: -101, filename: 'docs/new-folder', size: 0, mimeType: 'inode/directory' }
    expect(mergeVirtualAndRemoteFiles([virtualFolder], [])).toEqual([virtualFolder])
  })

  it('removes optimistic virtual folder once remote folder arrives', () => {
    const virtualFolder = { id: -101, filename: 'docs/new-folder', size: 0, mimeType: 'inode/directory' }
    const remoteFolder = { id: 11, filename: 'docs/new-folder', size: 0, mimeType: 'inode/directory' }
    expect(mergeVirtualAndRemoteFiles([virtualFolder], [remoteFolder])).toEqual([remoteFolder])
  })

  it('derives top-level folder item from nested files', () => {
    const files = [{ id: 1, filename: 'alpha/readme.md', size: 20, mimeType: 'text/markdown' }]
    const derived = deriveDriveItems(files, '')
    expect(derived).toHaveLength(1)
    expect(derived[0].mimeType).toBe('inode/directory')
    expect(derived[0].filename).toBe('alpha')
  })

  it('normalizes drive path separators when deriving nested items', () => {
    const files = [
      { id: 1, filename: '\\alpha\\beta\\spec.md', size: 20, mimeType: 'text/markdown' },
      { id: 2, filename: 'alpha/beta', size: 0, mimeType: 'inode/directory' },
    ]
    const derived = deriveDriveItems(files, '/alpha/')
    expect(derived).toHaveLength(1)
    expect(derived[0].filename).toBe('alpha/beta')
    expect(derived[0].mimeType).toBe('inode/directory')
  })

  it('deduplicates drive entries by normalized path', () => {
    const files = [
      { id: 1, filename: 'docs/new-folder', size: 0, mimeType: 'inode/directory' },
      { id: 2, filename: 'docs//new-folder/', size: 0, mimeType: 'inode/directory' },
    ]
    const derived = deriveDriveItems(files, 'docs')
    expect(derived).toHaveLength(1)
    expect(derived[0].filename).toBe('docs/new-folder')
  })

  it('keeps folders before files and sorts names in locale order', () => {
    const files = [
      { id: 1, filename: 'docs/zeta.txt', size: 1, mimeType: 'text/plain' },
      { id: 2, filename: 'docs/alpha', size: 0, mimeType: 'inode/directory' },
      { id: 3, filename: 'docs/beta.txt', size: 1, mimeType: 'text/plain' },
    ]
    const derived = deriveDriveItems(files, 'docs')
    expect(derived.map((item) => `${item.mimeType}:${item.filename}`)).toEqual(['inode/directory:docs/alpha', 'text/plain:docs/beta.txt', 'text/plain:docs/zeta.txt'])
  })
})
