import { useState, type MouseEvent } from 'react'
import { getParentPath, normalizePath } from '@yourcloud/sdk'
import { buildMoveFilename, createFileShareService, createFolderService, deleteFileService, downloadFileService, moveFileService, remapVirtualFoldersAfterMove, validateShareExtractCode, type ShareResult } from '../application/fileActionsService'
import { copyTextToClipboard } from '../application/clipboard'
import { type DeletedItem, type FileItem } from '../domain'

type FeedbackFn = (type: 'success' | 'error', text: string) => void
type ErrorMessageFn = (error: unknown) => string

type Options = {
  showFeedback: FeedbackFn
  toErrorMessage: ErrorMessageFn
  canDownloadFile: (file: FileItem) => boolean
  load: () => Promise<void>
  deletedItems: DeletedItem[]
  persistDeleted: (items: DeletedItem[]) => void
  starredIds: number[]
  persistStarred: (ids: number[]) => void
  setVirtualFolders: React.Dispatch<React.SetStateAction<FileItem[]>>
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  virtualFoldersRef: React.MutableRefObject<FileItem[]>
  currentDrivePath: string
}

export function useFileActions(options: Options) {
  const { showFeedback, toErrorMessage, canDownloadFile, load, deletedItems, persistDeleted, starredIds, persistStarred, setVirtualFolders, setFiles, virtualFoldersRef, currentDrivePath } =
    options

  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [shareToken, setShareToken] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareExpireDays, setShareExpireDays] = useState(3)
  const [shareExtractCode, setShareExtractCode] = useState('')
  const [shareSourceFile, setShareSourceFile] = useState<FileItem | null>(null)
  const [shareQrUrl, setShareQrUrl] = useState('')
  const [shareCreating, setShareCreating] = useState(false)
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null)
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null)
  const [actionFile, setActionFile] = useState<FileItem | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderPathInput, setFolderPathInput] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveTargetFolderPath, setMoveTargetFolderPath] = useState('')
  const [moveTargetFile, setMoveTargetFile] = useState<FileItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetFile, setDeleteTargetFile] = useState<FileItem | null>(null)

  async function generateShareFor(file: FileItem, expireDays: number, extractCode: string) {
    setShareCreating(true)
    const expireHours = expireDays === 0 ? 0 : expireDays * 24
    const result = await createFileShareService(
      file,
      { expireHours, extractCode },
      showFeedback,
      toErrorMessage,
    )
    if (result) updateShareDisplay(result)
    setShareCreating(false)
  }

  function requestShareFile(file: FileItem) {
    setShareSourceFile(file)
    setShareExpireDays(3)
    setShareExtractCode('')
    setShareLink('')
    setShareToken('')
    setShareQrUrl('')
    setShareExpiresAt(null)
    setShareDialogOpen(true)
  }

  function updateShareDisplay(payload: ShareResult) {
    setShareLink(payload.url)
    setShareToken(payload.token)
    setShareQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload.url)}`)
    setShareExpiresAt(payload.expiresAt || null)
  }

  async function createFileShare() {
    if (!shareSourceFile) return
    if (shareExtractCode.trim() && !validateShareExtractCode(shareExtractCode)) {
      showFeedback('error', '提取码需为 4-16 位字母或数字')
      return
    }
    await generateShareFor(shareSourceFile, shareExpireDays, shareExtractCode.trim())
  }

  function changeShareExpireDays(nextExpireDays: number) {
    setShareExpireDays(nextExpireDays)
  }

  async function copyShareLink() {
    if (!shareLink) return
    const copied = await copyTextToClipboard(shareLink)
    if (copied) {
      showFeedback('success', '分享链接已复制。')
      return
    }
    showFeedback('error', '复制分享链接失败，请手动复制。')
  }

  async function download(file: FileItem) {
    setDownloadingId(file.id)
    await downloadFileService(file, showFeedback, toErrorMessage, { canDownloadFile, fetchImpl: fetch })
    setDownloadingId(null)
  }

  function openActionMenu(event: MouseEvent<HTMLElement>, file: FileItem) {
    setActionAnchor(event.currentTarget)
    setActionFile(file)
  }

  function closeActionMenu() {
    setActionAnchor(null)
    setActionFile(null)
  }

  function requestDeleteFile(file: FileItem) {
    if (file.id <= 0) {
      showFeedback('error', '该目录来自路径推断，暂不支持直接删除，请先整理真实目录结构')
      return
    }
    setDeleteTargetFile(file)
    setDeleteDialogOpen(true)
  }

  async function confirmDeleteFile() {
    const file = deleteTargetFile
    if (!file) return
    const deleted = await deleteFileService(file, deletedItems, persistDeleted, load, showFeedback, toErrorMessage)
    if (deleted) {
      const target = normalizePath(file.filename)
      const matchesDeletedPath = (path: string) => {
        const normalized = normalizePath(path)
        return normalized === target || normalized.startsWith(`${target}/`)
      }
      setVirtualFolders((prev) => prev.filter((item) => !matchesDeletedPath(item.filename)))
      setFiles((prev) => prev.filter((item) => !matchesDeletedPath(item.filename)))
    }
    setDeleteDialogOpen(false)
    setDeleteTargetFile(null)
  }

  function requestMoveFile(file: FileItem) {
    if (file.id <= 0) {
      showFeedback('error', '该目录来自路径推断，暂不支持直接移动，请先整理真实目录结构')
      return
    }
    setMoveTargetFile(file)
    setMoveTargetFolderPath('')
    setMoveDialogOpen(true)
  }

  async function confirmMoveFile() {
    const file = moveTargetFile
    if (!file) return
    if (!moveTargetFolderPath.trim()) {
      showFeedback('error', '请选择目标文件夹')
      return
    }
    const nextName = buildMoveFilename(file.filename, moveTargetFolderPath)
    if (!nextName) return
    if (normalizePath(nextName) === normalizePath(file.filename)) {
      showFeedback('error', '请选择不同的目标目录')
      return
    }
    const moved = await moveFileService(file, nextName, load, showFeedback, toErrorMessage)
    if (!moved) return
    const isDirectory = file.mimeType === 'inode/directory'
    setVirtualFolders((prev) => remapVirtualFoldersAfterMove(prev, file.filename, nextName, isDirectory))
    setFiles((prev) => remapVirtualFoldersAfterMove(prev, file.filename, nextName, isDirectory))
    setMoveDialogOpen(false)
    setMoveTargetFile(null)
    setMoveTargetFolderPath('')
  }

  async function confirmCreateFolder() {
    if (!folderPathInput.trim()) {
      showFeedback('error', '请输入有效的文件夹名称')
      return
    }
    const childPath = normalizePath(folderPathInput.trim())
    const nextPath = currentDrivePath ? normalizePath(`${currentDrivePath}/${childPath}`) : childPath
    await createFolderService(nextPath, setVirtualFolders, setFiles, virtualFoldersRef, load, showFeedback, toErrorMessage)
    setFolderDialogOpen(false)
    setFolderPathInput('')
  }

  function toggleStar(file: FileItem) {
    if (starredIds.includes(file.id)) {
      persistStarred(starredIds.filter((id) => id !== file.id))
      showFeedback('success', `已取消星标：${file.filename}`)
      return
    }
    persistStarred([file.id, ...starredIds].slice(0, 100))
    showFeedback('success', `已加星标：${file.filename}`)
  }

  return {
    downloadingId,
    shareLink,
    shareToken,
    shareQrUrl,
    shareCreating,
    shareExpiresAt,
    shareDialogOpen,
    shareExpireDays,
    shareExtractCode,
    shareSourceFile,
    actionAnchor,
    actionFile,
    folderDialogOpen,
    folderPathInput,
    moveDialogOpen,
    moveTargetFolderPath,
    moveTargetFile,
    deleteDialogOpen,
    deleteTargetFile,
    setShareDialogOpen,
    setShareExpireDays: changeShareExpireDays,
    setShareExtractCode,
    setFolderDialogOpen,
    setFolderPathInput,
    setMoveDialogOpen,
    setMoveTargetFolderPath,
    setDeleteDialogOpen,
    openActionMenu,
    closeActionMenu,
    requestDeleteFile,
    requestMoveFile,
    confirmDeleteFile,
    confirmMoveFile,
    confirmCreateFolder,
    toggleStar,
    requestShareFile,
    createFileShare,
    copyShareLink,
    download,
  }
}
