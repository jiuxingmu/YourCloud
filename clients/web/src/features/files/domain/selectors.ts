import { getBaseName, getParentPath, normalizePath } from './path'
import { isArchiveFile, isAudioFile, isDocFile, isImageFile, isPdfFile, isSheetFile, isSlideFile, isVideoFile } from './fileKind'
import type { FileItem, TimeFilter, TypeFilter } from './types'

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
  if (monthDiff >= 0 && monthDiff <= 1) return 'lastMonth'
  return 'earlier'
}

export function matchesTypeFilter(file: FileItem, typeFilter: TypeFilter): boolean {
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

export function matchesTimeFilter(file: FileItem, timeFilter: TimeFilter): boolean {
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

export function deriveDriveItems(files: FileItem[], currentPath: string): FileItem[] {
  const folderByPath = new Map<string, FileItem>()
  const directFiles: FileItem[] = []
  const syntheticFolderPaths = new Set<string>()
  const normalizedCurrent = normalizePath(currentPath)

  for (const file of files) {
    const full = normalizePath(file.filename)
    if (!full) continue
    if (file.mimeType === 'inode/directory') folderByPath.set(full, file)
  }

  for (const file of files) {
    const full = normalizePath(file.filename)
    if (!full) continue
    const parent = getParentPath(full)
    const isFolder = file.mimeType === 'inode/directory'

    if (normalizedCurrent === '') {
      if (!full.includes('/')) directFiles.push(file)
      else syntheticFolderPaths.add(full.split('/')[0])
      continue
    }

    const prefix = `${normalizedCurrent}/`
    if (!full.startsWith(prefix)) continue
    const rest = full.slice(prefix.length)
    if (!rest) continue
    if (rest.includes('/')) {
      syntheticFolderPaths.add(`${normalizedCurrent}/${rest.split('/')[0]}`)
      continue
    }

    if (parent === normalizedCurrent || (isFolder && full === `${normalizedCurrent}/${rest}`)) directFiles.push(file)
  }

  const syntheticFolders: FileItem[] = Array.from(syntheticFolderPaths)
    .filter((folderPath) => getParentPath(folderPath) === normalizedCurrent)
    .map((folderPath) => {
      const real = folderByPath.get(folderPath)
      if (real) return real
      const now = new Date().toISOString()
      return {
        id: -Math.abs(
          Array.from(folderPath).reduce((sum, ch) => {
            return (sum * 31 + ch.charCodeAt(0)) | 0
          }, 0),
        ),
        filename: folderPath,
        size: 0,
        mimeType: 'inode/directory',
        createdAt: now,
        updatedAt: now,
      } satisfies FileItem
    })

  const merged = [...syntheticFolders, ...directFiles]
  const uniqueByPath = new Map<string, FileItem>()
  for (const item of merged) {
    const key = normalizePath(item.filename)
    if (!uniqueByPath.has(key)) uniqueByPath.set(key, item)
  }

  return Array.from(uniqueByPath.values()).sort((a, b) => {
    const aFolder = a.mimeType === 'inode/directory'
    const bFolder = b.mimeType === 'inode/directory'
    if (aFolder !== bFolder) return aFolder ? -1 : 1
    return getBaseName(a.filename).localeCompare(getBaseName(b.filename), 'zh-CN')
  })
}

export function mergeVirtualAndRemoteFiles(virtualFolders: FileItem[], remoteFiles: FileItem[]): FileItem[] {
  const remoteByPath = new Map<string, FileItem>()
  for (const remote of remoteFiles) {
    remoteByPath.set(normalizePath(remote.filename), remote)
  }
  const optimisticVirtuals = virtualFolders.filter((folder) => !remoteByPath.has(normalizePath(folder.filename)))
  return [...optimisticVirtuals, ...remoteFiles]
}
