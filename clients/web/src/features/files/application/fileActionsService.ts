import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { authHeaders } from '../../../apiClient'
import { buildFileDownloadUrl, createFolder, createShare, deleteFile, moveFile } from '../data/filesApi'
import { emitFilesChanged } from '../data/filesEvents'
import { getDeleteFeedbackText, normalizePath, type DeletedItem, type FileItem } from '../domain'

type FeedbackFn = (type: 'success' | 'error', text: string) => void
type ErrorMessageFn = (error: unknown) => string

type ShareDeps = {
  createShareApi: typeof createShare
}

export type ShareResult = {
  url: string
  token: string
  expiresAt?: string
  extractCode?: string
}

type DownloadDeps = {
  canDownloadFile: (file: FileItem) => boolean
  fetchImpl: typeof fetch
}

type DeleteDeps = {
  deleteFileApi: typeof deleteFile
  emitFilesChangedEvent: () => void
}

type MoveDeps = {
  moveFileApi: typeof moveFile
  emitFilesChangedEvent: () => void
}

type CreateFolderDeps = {
  createFolderApi: typeof createFolder
}

export function validateMoveTargetName(input: string): string | null {
  const trimmed = input.trim()
  return trimmed ? trimmed : null
}

export function buildShareLinkFromResponse(url: string | undefined, origin: string): string {
  return url || `${origin}/?share=unknown`
}

function buildShareLinkFromToken(origin: string, token: string): string {
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return new URL(`${basePath}share/${token}`, origin).toString()
}

export async function createFileShareService(
  file: FileItem,
  options: { expireHours: number; extractCode: string },
  showFeedback: FeedbackFn,
  toErrorMessage: ErrorMessageFn,
  deps: ShareDeps = { createShareApi: createShare },
): Promise<ShareResult | null> {
  if (file.mimeType === 'inode/directory') {
    showFeedback('error', '文件夹暂不支持创建分享链接')
    return null
  }
  try {
    const expireHours = Math.max(0, Math.floor(options.expireHours))
    const data = await deps.createShareApi(file.id, expireHours, options.extractCode.trim())
    const link = data.token ? buildShareLinkFromToken(location.origin, data.token) : buildShareLinkFromResponse(data.url, location.origin)
    showFeedback('success', `已创建分享链接：${file.filename}`)
    return { url: link, token: data.token, expiresAt: data.expiresAt, extractCode: data.extractCode }
  } catch (error) {
    showFeedback('error', toErrorMessage(error))
    return null
  }
}

export async function downloadFileService(
  file: FileItem,
  showFeedback: FeedbackFn,
  toErrorMessage: ErrorMessageFn,
  deps: DownloadDeps,
): Promise<void> {
  if (!deps.canDownloadFile(file)) {
    showFeedback('error', '当前项目不支持下载')
    return
  }

  try {
    const res = await deps.fetchImpl(buildFileDownloadUrl(file.id), { headers: { ...authHeaders() } })
    if (!res.ok) throw new Error('下载失败')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    showFeedback('success', '已开始下载。')
  } catch (error) {
    showFeedback('error', toErrorMessage(error))
  }
}

export async function deleteFileService(
  file: FileItem,
  deletedItems: DeletedItem[],
  persistDeleted: (items: DeletedItem[]) => void,
  load: () => Promise<void>,
  showFeedback: FeedbackFn,
  toErrorMessage: ErrorMessageFn,
  deps: DeleteDeps = { deleteFileApi: deleteFile, emitFilesChangedEvent: emitFilesChanged },
): Promise<void> {
  try {
    await deps.deleteFileApi(file.id)
    showFeedback('success', getDeleteFeedbackText(file))
    persistDeleted([{ id: file.id, filename: file.filename, deletedAt: new Date().toISOString() }, ...deletedItems].slice(0, 50))
    await load()
    deps.emitFilesChangedEvent()
  } catch (error) {
    showFeedback('error', toErrorMessage(error))
  }
}

export async function moveFileService(
  file: FileItem,
  nextFilename: string,
  load: () => Promise<void>,
  showFeedback: FeedbackFn,
  toErrorMessage: ErrorMessageFn,
  deps: MoveDeps = { moveFileApi: moveFile, emitFilesChangedEvent: emitFilesChanged },
): Promise<void> {
  try {
    await deps.moveFileApi(file.id, nextFilename)
    showFeedback('success', `已移动：${file.filename}`)
    await load()
    deps.emitFilesChangedEvent()
  } catch (error) {
    showFeedback('error', toErrorMessage(error))
  }
}

export async function createFolderService(
  folderPath: string,
  setVirtualFolders: Dispatch<SetStateAction<FileItem[]>>,
  setFiles: Dispatch<SetStateAction<FileItem[]>>,
  virtualFoldersRef: MutableRefObject<FileItem[]>,
  load: () => Promise<void>,
  showFeedback: FeedbackFn,
  toErrorMessage: ErrorMessageFn,
  deps: CreateFolderDeps = { createFolderApi: createFolder },
): Promise<void> {
  try {
    await deps.createFolderApi(folderPath)
    showFeedback('success', `已创建文件夹：${folderPath}`)
    const now = new Date().toISOString()
    const pseudoFolder: FileItem = {
      id: -Math.floor(Date.now() + Math.random() * 1000),
      filename: folderPath,
      size: 0,
      mimeType: 'inode/directory',
      createdAt: now,
      updatedAt: now,
    }
    setVirtualFolders((prev) => {
      const next = [pseudoFolder, ...prev.filter((item) => normalizePath(item.filename) !== normalizePath(pseudoFolder.filename))]
      virtualFoldersRef.current = next
      return next
    })
    setFiles((prev) => [pseudoFolder, ...prev.filter((item) => item.id !== pseudoFolder.id)])
    await load()
  } catch (error) {
    showFeedback('error', toErrorMessage(error))
  }
}
