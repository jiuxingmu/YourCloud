import { formatBytes, getBaseName } from '@yourcloud/sdk'
import type { DeletedItem, FileItem, FileSection } from './types'

export function shouldShowCreateActions(section: FileSection): boolean {
  return section === 'drive'
}

export function getDeleteDialogTitle(file: FileItem | null): string {
  return file?.mimeType === 'inode/directory' ? '删除文件夹' : '删除文件'
}

export function getDeleteDialogDescription(file: FileItem | null): string {
  const target = file ? getBaseName(file.filename) || file.filename : ''
  if (!target) return '确认删除吗？删除后不可恢复。'
  if (file?.mimeType === 'inode/directory') return `确认删除文件夹「${target}」吗？删除后不可恢复。`
  return `确认删除文件「${target}」吗？删除后不可恢复。`
}

export function getDeleteFeedbackText(file: FileItem): string {
  const target = getBaseName(file.filename) || file.filename
  if (file.mimeType === 'inode/directory') return `已删除文件夹：「${target}」`
  return `已删除文件：「${target}」`
}

export function getTrashClearFeedbackText(deletedItems: DeletedItem[]): string {
  return deletedItems.length > 0 ? '已清空回收站记录' : '当前无可清空内容'
}

export function canDownloadFile(file: FileItem): boolean {
  return file.id > 0 && file.mimeType !== 'inode/directory'
}

export function isDirectoryItem(file: FileItem): boolean {
  return file.mimeType === 'inode/directory'
}

export function formatDisplayFileSize(file: FileItem): string {
  if (file.mimeType === 'inode/directory') return '-'
  return formatBytes(file.size)
}
