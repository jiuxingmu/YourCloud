import { formatModified, getBaseName, getParentPath, getRelativeBucket, matchesTimeFilter, matchesTypeFilter, normalizePath } from '@yourcloud/sdk'
import type { FileItem } from './types'
export { formatModified, getRelativeBucket, matchesTimeFilter, matchesTypeFilter }

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

  const uniqueFoldersByPath = new Map<string, FileItem>()
  const getTimestamp = (item: FileItem): number => {
    const raw = item.updatedAt ?? item.createdAt
    if (!raw) return 0
    const time = Date.parse(raw)
    return Number.isNaN(time) ? 0 : time
  }
  for (const item of [...syntheticFolders, ...directFiles.filter((f) => f.mimeType === 'inode/directory')]) {
    const key = normalizePath(item.filename)
    const existing = uniqueFoldersByPath.get(key)
    if (!existing) {
      uniqueFoldersByPath.set(key, item)
      continue
    }
    const existingTime = getTimestamp(existing)
    const incomingTime = getTimestamp(item)
    if (incomingTime > existingTime || (incomingTime === existingTime && item.id > existing.id)) {
      uniqueFoldersByPath.set(key, item)
    }
  }
  const merged = [...Array.from(uniqueFoldersByPath.values()), ...directFiles.filter((f) => f.mimeType !== 'inode/directory')]

  return merged.sort((a, b) => {
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
