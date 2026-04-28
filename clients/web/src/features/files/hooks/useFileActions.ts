import { useState, type MouseEvent } from 'react'
import { createFileShareService, createFolderService, deleteFileService, downloadFileService, moveFileService, validateMoveTargetName } from '../application/fileActionsService'
import { getDeleteFeedbackText, type DeletedItem, type FileItem } from '../domain'

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
}

export function useFileActions(options: Options) {
  const { showFeedback, toErrorMessage, canDownloadFile, load, deletedItems, persistDeleted, starredIds, persistStarred, setVirtualFolders, setFiles, virtualFoldersRef } =
    options

  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null)
  const [actionFile, setActionFile] = useState<FileItem | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderPathInput, setFolderPathInput] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveFilenameInput, setMoveFilenameInput] = useState('')
  const [moveTargetFile, setMoveTargetFile] = useState<FileItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetFile, setDeleteTargetFile] = useState<FileItem | null>(null)

  async function createFileShare(file: FileItem) {
    const link = await createFileShareService(file, showFeedback, toErrorMessage)
    if (link) setShareLink(link)
  }

  async function copyShareLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      showFeedback('success', '分享链接已复制。')
    } catch {
      showFeedback('error', '复制分享链接失败，请手动复制。')
    }
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
    setDeleteTargetFile(file)
    setDeleteDialogOpen(true)
  }

  async function confirmDeleteFile() {
    const file = deleteTargetFile
    if (!file) return
    if (file.mimeType === 'inode/directory') {
      setVirtualFolders((prev) => prev.filter((f) => f.id !== file.id))
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      showFeedback('success', getDeleteFeedbackText(file))
      setDeleteDialogOpen(false)
      setDeleteTargetFile(null)
      return
    }
    await deleteFileService(file, deletedItems, persistDeleted, load, showFeedback, toErrorMessage)
    setDeleteDialogOpen(false)
    setDeleteTargetFile(null)
  }

  function requestMoveFile(file: FileItem) {
    setMoveTargetFile(file)
    setMoveFilenameInput(file.filename)
    setMoveDialogOpen(true)
  }

  async function confirmMoveFile() {
    const file = moveTargetFile
    if (!file) return
    const nextName = validateMoveTargetName(moveFilenameInput)
    if (!nextName) {
      showFeedback('error', '请输入有效的目标名称')
      return
    }
    if (file.mimeType === 'inode/directory') {
      setVirtualFolders((prev) => prev.map((f) => (f.id === file.id ? { ...f, filename: nextName, updatedAt: new Date().toISOString() } : f)))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, filename: nextName, updatedAt: new Date().toISOString() } : f)))
      showFeedback('success', `已移动：${file.filename}`)
      setMoveDialogOpen(false)
      setMoveTargetFile(null)
      setMoveFilenameInput('')
      return
    }
    await moveFileService(file, nextName, load, showFeedback, toErrorMessage)
    setMoveDialogOpen(false)
    setMoveTargetFile(null)
    setMoveFilenameInput('')
  }

  async function confirmCreateFolder() {
    if (!folderPathInput.trim()) {
      showFeedback('error', '请输入有效的文件夹名称')
      return
    }
    await createFolderService(folderPathInput.trim(), setVirtualFolders, setFiles, virtualFoldersRef, load, showFeedback, toErrorMessage)
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
    actionAnchor,
    actionFile,
    folderDialogOpen,
    folderPathInput,
    moveDialogOpen,
    moveFilenameInput,
    moveTargetFile,
    deleteDialogOpen,
    deleteTargetFile,
    setFolderDialogOpen,
    setFolderPathInput,
    setMoveDialogOpen,
    setMoveFilenameInput,
    setDeleteDialogOpen,
    openActionMenu,
    closeActionMenu,
    requestDeleteFile,
    requestMoveFile,
    confirmDeleteFile,
    confirmMoveFile,
    confirmCreateFolder,
    toggleStar,
    createFileShare,
    copyShareLink,
    download,
  }
}
