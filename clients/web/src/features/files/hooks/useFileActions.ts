import { useState, type MouseEvent } from 'react'
import { authHeaders } from '../../../apiClient'
import { buildFileDownloadUrl, createFolder, createShare, deleteFile, moveFile } from '../data/filesApi'
import { emitFilesChanged } from '../data/filesEvents'
import { getDeleteFeedbackText } from '../domain/rules'
import { normalizePath } from '../domain/path'
import type { DeletedItem, FileItem } from '../domain/types'

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
    if (file.mimeType === 'inode/directory') {
      showFeedback('error', '文件夹暂不支持创建分享链接')
      return
    }
    try {
      const data = await createShare(file.id, 24)
      const link = data.url || `${location.origin}/?share=unknown`
      setShareLink(link)
      showFeedback('success', `已创建分享链接：${file.filename}`)
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    }
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
    if (!canDownloadFile(file)) {
      showFeedback('error', '当前项目不支持下载')
      return
    }
    setDownloadingId(file.id)
    try {
      const res = await fetch(buildFileDownloadUrl(file.id), { headers: { ...authHeaders() } })
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      showFeedback('success', '已开始下载。')
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setDownloadingId(null)
    }
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
    try {
      await deleteFile(file.id)
      showFeedback('success', getDeleteFeedbackText(file))
      persistDeleted([{ id: file.id, filename: file.filename, deletedAt: new Date().toISOString() }, ...deletedItems].slice(0, 50))
      await load()
      emitFilesChanged()
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTargetFile(null)
    }
  }

  function requestMoveFile(file: FileItem) {
    setMoveTargetFile(file)
    setMoveFilenameInput(file.filename)
    setMoveDialogOpen(true)
  }

  async function confirmMoveFile() {
    const file = moveTargetFile
    if (!file) return
    if (!moveFilenameInput.trim()) {
      showFeedback('error', '请输入有效的目标名称')
      return
    }
    if (file.mimeType === 'inode/directory') {
      const nextName = moveFilenameInput.trim()
      setVirtualFolders((prev) => prev.map((f) => (f.id === file.id ? { ...f, filename: nextName, updatedAt: new Date().toISOString() } : f)))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, filename: nextName, updatedAt: new Date().toISOString() } : f)))
      showFeedback('success', `已移动：${file.filename}`)
      setMoveDialogOpen(false)
      setMoveTargetFile(null)
      setMoveFilenameInput('')
      return
    }
    try {
      await moveFile(file.id, moveFilenameInput.trim())
      showFeedback('success', `已移动：${file.filename}`)
      await load()
      emitFilesChanged()
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setMoveDialogOpen(false)
      setMoveTargetFile(null)
      setMoveFilenameInput('')
    }
  }

  async function confirmCreateFolder() {
    if (!folderPathInput.trim()) {
      showFeedback('error', '请输入有效的文件夹名称')
      return
    }
    try {
      await createFolder(folderPathInput.trim())
      showFeedback('success', `已创建文件夹：${folderPathInput.trim()}`)
      const now = new Date().toISOString()
      const pseudoFolder: FileItem = {
        id: -Math.floor(Date.now() + Math.random() * 1000),
        filename: folderPathInput.trim(),
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
    } finally {
      setFolderDialogOpen(false)
      setFolderPathInput('')
    }
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
