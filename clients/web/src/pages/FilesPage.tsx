import { Fragment, useEffect, useState, type ChangeEvent, type MouseEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  SvgIcon,
  type SvgIconProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  TextField,
} from '@mui/material'
import { authHeaders, request } from '../apiClient'
import FilePreview from '../components/FilePreview'

type FileItem = { id: number; filename: string; size: number; mimeType?: string; updatedAt?: string; createdAt?: string }
type DeletedItem = { id: number; filename: string; deletedAt: string }
type Section = 'home' | 'drive' | 'recent' | 'starred' | 'trash'
type Props = { searchQuery?: string; section?: Section }
type TypeFilter = 'all' | 'doc' | 'sheet' | 'slide' | 'image' | 'pdf' | 'video' | 'archive' | 'audio'
type TimeFilter = 'all' | 'today' | '7d' | '30d' | 'thisYear' | 'lastYear'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

function formatModified(value?: string): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getRelativeBucket(value?: string): 'today' | 'lastMonth' | 'earlier' {
  if (!value) return 'earlier'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'earlier'
  const now = new Date()
  const isSameDay = date.toDateString() === now.toDateString()
  if (isSameDay) return 'today'
  const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  if (monthDiff <= 1) return 'lastMonth'
  return 'earlier'
}

function CopyIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M8 8h11v13H8zM5 3h11v3H8v10H5z" />
    </SvgIcon>
  )
}

function GridIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </SvgIcon>
  )
}

function FileIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 3h8l4 4v14H6zm8 1.5V8h3.5z" />
    </SvgIcon>
  )
}

function ListIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 5h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zM4 17h2v2H4zm4 0h12v2H8z" />
    </SvgIcon>
  )
}

function RefreshLineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 5V2l4 4-4 4V7a5 5 0 1 0 4.9 6h2.02A7 7 0 1 1 12 5z" />
    </SvgIcon>
  )
}

function UploadIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 16h2V9.83l2.59 2.58L17 11l-5-5-5 5 1.41 1.41L11 9.83zM5 18h14v2H5z" />
    </SvgIcon>
  )
}

function MoreIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 7a1.7 1.7 0 1 0 .001-3.399A1.7 1.7 0 0 0 12 7zm0 6.7a1.7 1.7 0 1 0 .001-3.399A1.7 1.7 0 0 0 12 13.7zm0 6.7a1.7 1.7 0 1 0 .001-3.399A1.7 1.7 0 0 0 12 20.4z" />
    </SvgIcon>
  )
}

function DownloadLineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 4h2v8.17l2.59-2.58L17 11l-5 5-5-5 1.41-1.41L11 12.17zM5 18h14v2H5z" />
    </SvgIcon>
  )
}

function ShareLineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M15 5a3 3 0 1 0 2.85 4l-6.48 3.62a3 3 0 1 0 0 2.76L17.85 19A3 3 0 1 0 17 17a2.8 2.8 0 0 0 .1.73l-6.5-3.63a2.9 2.9 0 0 0 0-.2 2.9 2.9 0 0 0 0-.2l6.5-3.63A2.8 2.8 0 0 0 17 11a3 3 0 1 0-2-6z" />
    </SvgIcon>
  )
}

function FolderPlusIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 6h6l2 2h8v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12 5v2h2v2h-2v2h-2v-2h-2v-2h2v-2z" />
    </SvgIcon>
  )
}

function MoveIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="m12 4 4 4h-3v4h-2V8H8zm7 9v6H5v-6H3v8h18v-8z" />
    </SvgIcon>
  )
}

function DeleteIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M8 4h8l1 2h4v2H3V6h4zm1 6h2v8H9zm4 0h2v8h-2zM6 8h12l-1 12H7z" />
    </SvgIcon>
  )
}

function StarIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="m12 3 2.7 5.47L20.7 9l-4.35 4.24 1.03 6.01L12 16.95 6.62 19.25l1.03-6.01L3.3 9l6-.53z" />
    </SvgIcon>
  )
}

function ArrowDownIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="m7 10 5 5 5-5z" />
    </SvgIcon>
  )
}

export default function FilesPage({ searchQuery = '', section = 'home' }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [virtualFolders, setVirtualFolders] = useState<FileItem[]>([])
  const [starredIds, setStarredIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('starred_file_ids')
      return raw ? (JSON.parse(raw) as number[]) : []
    } catch {
      return []
    }
  })
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>(() => {
    try {
      const raw = localStorage.getItem('deleted_file_items')
      return raw ? (JSON.parse(raw) as DeletedItem[]) : []
    } catch {
      return []
    }
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null)
  const [actionFile, setActionFile] = useState<FileItem | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderPathInput, setFolderPathInput] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveFilenameInput, setMoveFilenameInput] = useState('')
  const [moveTargetFile, setMoveTargetFile] = useState<FileItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetFile, setDeleteTargetFile] = useState<FileItem | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [filterMenu, setFilterMenu] = useState<'type' | 'time' | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const dialogPaperSx = { borderRadius: 0, border: '1px solid #dfe3e8' }

  function showFeedback(type: 'success' | 'error', text: string) {
    setFeedback({ type, text })
  }

  function persistStarred(next: number[]) {
    setStarredIds(next)
    localStorage.setItem('starred_file_ids', JSON.stringify(next))
  }

  function persistDeleted(next: DeletedItem[]) {
    setDeletedItems(next)
    localStorage.setItem('deleted_file_items', JSON.stringify(next))
  }

  async function load() {
    setLoading(true)
    try {
      const nextFiles = await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } })
      setFiles([...virtualFolders, ...nextFiles])
    } catch (e) {
      showFeedback('error', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [virtualFolders])

  useEffect(() => {
    function handleStarredCleared() {
      setStarredIds([])
    }
    function handleTrashCleared() {
      setDeletedItems([])
    }
    window.addEventListener('yourcloud:starred-cleared', handleStarredCleared as EventListener)
    window.addEventListener('yourcloud:trash-cleared', handleTrashCleared as EventListener)
    return () => {
      window.removeEventListener('yourcloud:starred-cleared', handleStarredCleared as EventListener)
      window.removeEventListener('yourcloud:trash-cleared', handleTrashCleared as EventListener)
    }
  }, [])

  async function upload(file: File) {
    const form = new FormData()
    form.append('file', file)
    try {
      await request('/api/v1/files', { method: 'POST', headers: { ...authHeaders() }, body: form })
      showFeedback('success', 'Upload success.')
      await load()
      window.dispatchEvent(new CustomEvent('yourcloud:files-changed'))
    } catch (e) {
      showFeedback('error', (e as Error).message)
    }
  }

  function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (file) {
      void upload(file)
    }
    input.value = ''
  }

  async function createShare(file: FileItem) {
    if (file.mimeType === 'inode/directory') {
      showFeedback('error', '文件夹暂不支持创建分享链接')
      return
    }
    try {
      const data = await request<{ token: string }>('/api/v1/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ fileId: file.id, expireHours: 24 }),
      })
      const link = `${location.origin}/?share=${data.token}`
      setShareLink(link)
      showFeedback('success', `已创建分享链接：${file.filename}`)
    } catch (e) {
      showFeedback('error', (e as Error).message)
    }
  }

  async function copyShareLink() {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      showFeedback('success', 'Share link copied.')
    } catch {
      showFeedback('error', 'Failed to copy share link. Please copy it manually.')
    }
  }

  async function downloadFile(file: FileItem) {
    if (file.mimeType === 'inode/directory') {
      showFeedback('error', '文件夹暂不支持下载')
      return
    }
    setDownloadingId(file.id)
    try {
      const res = await fetch(`${apiBase}/api/v1/files/${file.id}/download`, {
        headers: { ...authHeaders() },
      })
      if (!res.ok) {
        throw new Error(`Download failed: ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      showFeedback('success', 'Download started.')
    } catch (e) {
      showFeedback('error', (e as Error).message)
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
      showFeedback('success', `已删除文件夹：${file.filename}`)
      setDeleteDialogOpen(false)
      setDeleteTargetFile(null)
      return
    }
    try {
      await request('/api/v1/files/' + file.id, {
        method: 'DELETE',
        headers: { ...authHeaders() },
      })
      showFeedback('success', `已删除：${file.filename}`)
      persistDeleted([{ id: file.id, filename: file.filename, deletedAt: new Date().toISOString() }, ...deletedItems].slice(0, 50))
      await load()
      window.dispatchEvent(new CustomEvent('yourcloud:files-changed'))
    } catch (e) {
      showFeedback('error', (e as Error).message)
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
      await request<FileItem>('/api/v1/files/' + file.id + '/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ filename: moveFilenameInput.trim() }),
      })
      showFeedback('success', `已移动：${file.filename}`)
      await load()
      window.dispatchEvent(new CustomEvent('yourcloud:files-changed'))
    } catch (e) {
      showFeedback('error', (e as Error).message)
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
      await request('/api/v1/files/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ path: folderPathInput.trim() }),
      })
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
      setVirtualFolders((prev) => [pseudoFolder, ...prev])
    } catch (e) {
      showFeedback('error', (e as Error).message)
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

  function openFilterMenu(kind: 'type' | 'time', event: MouseEvent<HTMLElement>) {
    setFilterMenu(kind)
    setFilterAnchor(event.currentTarget)
  }

  function closeFilterMenu() {
    setFilterMenu(null)
    setFilterAnchor(null)
  }

  function matchesTypeFilter(file: FileItem): boolean {
    if (typeFilter === 'all') return true
    const name = file.filename.toLowerCase()
    const mime = (file.mimeType || '').toLowerCase()
    if (typeFilter === 'image') return mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
    if (typeFilter === 'video') return mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)
    if (typeFilter === 'pdf') return mime === 'application/pdf' || name.endsWith('.pdf')
    if (typeFilter === 'archive') return /\.(zip|rar|7z|tar|gz)$/.test(name)
    if (typeFilter === 'audio') return mime.startsWith('audio/') || /\.(mp3|wav|aac|flac|ogg)$/.test(name)
    if (typeFilter === 'sheet') return /\.(xls|xlsx|csv)$/.test(name)
    if (typeFilter === 'slide') return /\.(ppt|pptx)$/.test(name)
    if (typeFilter === 'doc') return /\.(doc|docx|txt|md)$/.test(name)
    return true
  }

  function matchesTimeFilter(file: FileItem): boolean {
    if (timeFilter === 'all') return true
    const date = new Date(file.updatedAt ?? file.createdAt ?? 0)
    if (Number.isNaN(date.getTime())) return false
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (timeFilter === 'today') return date.toDateString() === now.toDateString()
    if (timeFilter === '7d') return diffMs <= 7 * 24 * 3600 * 1000
    if (timeFilter === '30d') return diffMs <= 30 * 24 * 3600 * 1000
    if (timeFilter === 'thisYear') return date.getFullYear() === now.getFullYear()
    if (timeFilter === 'lastYear') return date.getFullYear() === now.getFullYear() - 1
    return true
  }

  const sectionFiles =
    section === 'starred'
      ? files.filter((f) => starredIds.includes(f.id))
      : section === 'recent'
        ? [...files].sort((a, b) => +new Date(b.updatedAt ?? b.createdAt ?? 0) - +new Date(a.updatedAt ?? a.createdAt ?? 0))
        : files
  const filteredFiles = sectionFiles.filter((file) => {
    if (normalizedQuery && !file.filename.toLowerCase().includes(normalizedQuery)) return false
    if (!matchesTypeFilter(file)) return false
    if (!matchesTimeFilter(file)) return false
    return true
  })
  const recentGroups = {
    today: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'today'),
    lastMonth: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'lastMonth'),
    earlier: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'earlier'),
  }
  const recommendedFiles = [...files].sort((a, b) => +new Date(b.updatedAt ?? b.createdAt ?? 0) - +new Date(a.updatedAt ?? a.createdAt ?? 0)).slice(0, 4)
  const recommendedFolder = files.find((f) => f.filename.includes('/'))?.filename.split('/')[0] || (files[0]?.filename.replace(/\.[^/.]+$/, '') || '示例文件夹')
  const renderGridView = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {filteredFiles.map((file) => (
        <Card
          key={file.id}
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderColor: '#e4e8ed',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(60,64,67,.15)', borderColor: '#d2d8df' },
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '16 / 9',
                minHeight: 132,
                maxHeight: 190,
                borderRadius: 0,
                mb: 1.25,
                border: '1px solid #eef1f4',
                bgcolor: '#f8fafd',
                backgroundImage:
                  'radial-gradient(220px 100px at 10% 15%, rgba(26,115,232,0.09), transparent 60%), radial-gradient(180px 90px at 90% 90%, rgba(66,133,244,0.08), transparent 62%)',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
              }}
            >
              <FilePreview id={file.id} filename={file.filename} mimeType={file.mimeType} apiBase={apiBase} lazy />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <FileIcon fontSize="small" sx={{ mt: 0.2, color: 'text.secondary' }} />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
                  {file.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  修改于 {formatModified(file.updatedAt ?? file.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Button size="small" onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
                  下载
                </Button>
                <Button size="small" onClick={() => createShare(file)}>
                  分享
                </Button>
                <IconButton size="small" onClick={(e) => openActionMenu(e, file)}>
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, borderColor: '#dfe3e8', backgroundColor: '#fff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
          {section !== 'home' && (
            <>
              <Button variant="contained" startIcon={<UploadIcon />} component="label" sx={{ borderRadius: 0, px: 2.5 }}>
                新建文件
                <input hidden type="file" onChange={handleUploadChange} />
              </Button>
              <Button variant="outlined" startIcon={<FolderPlusIcon />} onClick={() => setFolderDialogOpen(true)}>
                新建文件夹
              </Button>
              <Button variant="outlined" startIcon={<RefreshLineIcon />} onClick={load} disabled={loading}>
                刷新
              </Button>
            </>
          )}
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            正在加载文件...
          </Typography>
        )}

        {!loading && section === 'home' ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography sx={{ fontSize: 34, fontWeight: 500 }}>欢迎使用云端硬盘</Typography>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>建议的文件夹</Typography>
              <Card variant="outlined" sx={{ maxWidth: 360, borderRadius: 0, borderColor: '#e6eaf0' }}>
                <CardContent sx={{ py: 1.4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <FolderPlusIcon fontSize="small" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600 }}>
                        {recommendedFolder}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        位于「我的云端硬盘」
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>建议的文件</Typography>
                <Box>
                  <IconButton size="small" color={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>
                    <ListIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>
                    <GridIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {viewMode === 'grid' ? (
                renderGridView
              ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>名称</TableCell>
                    <TableCell>建议原因</TableCell>
                    <TableCell>位置</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendedFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography noWrap>{file.filename}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>您打开过 · {formatModified(file.updatedAt ?? file.createdAt)}</TableCell>
                      <TableCell>我的云端硬盘</TableCell>
                      <TableCell align="right">
                          <Button size="small" onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
                            下载
                          </Button>
                          <Button size="small" onClick={() => createShare(file)}>
                            分享
                          </Button>
                          <IconButton size="small" onClick={(e) => openActionMenu(e, file)}>
                            <MoreIcon fontSize="small" />
                          </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </Box>
          </Box>
        ) : !loading && section === 'trash' ? (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600 }}>回收站（本地删除记录）</Typography>
              <Button
                size="small"
                onClick={() => {
                  persistDeleted([])
                  showFeedback('success', '已清空回收站记录')
                }}
              >
                清空记录
              </Button>
            </Stack>
            {deletedItems.length === 0 ? (
              <Typography color="text.secondary">暂无记录</Typography>
            ) : (
              <Stack spacing={1}>
                {deletedItems.map((item) => (
                  <Box key={`${item.id}-${item.deletedAt}`} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef1f4', pb: 0.8 }}>
                    <Typography>{item.filename}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatModified(item.deletedAt)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        ) : !loading && filteredFiles.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>没有匹配的文件</Typography>
            <Typography color="text.secondary">尝试更换关键词，或点击“新建文件”上传内容。</Typography>
          </Box>
        ) : section === 'recent' ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 500 }}>最近用过</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" endIcon={<ArrowDownIcon fontSize="small" />} onClick={(e) => openFilterMenu('type', e)}>
                类型
              </Button>
              <Button size="small" variant="outlined" endIcon={<ArrowDownIcon fontSize="small" />} onClick={(e) => openFilterMenu('time', e)}>
                修改时间
              </Button>
              <Box sx={{ ml: 'auto' }}>
                <IconButton size="small" color={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>
                  <ListIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>
                  <GridIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>
            {viewMode === 'grid' ? (
              renderGridView
            ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>名称</TableCell>
                  <TableCell>修改时间</TableCell>
                  <TableCell>所有者</TableCell>
                  <TableCell>文件大小</TableCell>
                  <TableCell>位置</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {([
                  ['今天', recentGroups.today],
                  ['上个月', recentGroups.lastMonth],
                  ['更早', recentGroups.earlier],
                ] as Array<[string, FileItem[]]>).map(([label, group]) => (
                  <Fragment key={label}>
                    {group.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="caption" color="text.secondary">
                            {label}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {group.map((file) => (
                      <TableRow key={file.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography noWrap>{file.filename}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatModified(file.updatedAt ?? file.createdAt)}</TableCell>
                        <TableCell>我</TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>我的云端硬盘</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
                            下载
                          </Button>
                          <Button size="small" onClick={() => createShare(file)}>
                            分享
                          </Button>
                          <IconButton size="small" onClick={(e) => openActionMenu(e, file)}>
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
            )}
          </Box>
        ) : section === 'drive' ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 500 }}>我的云端硬盘</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" endIcon={<ArrowDownIcon fontSize="small" />} onClick={(e) => openFilterMenu('type', e)}>
                类型
              </Button>
              <Button size="small" variant="outlined" endIcon={<ArrowDownIcon fontSize="small" />} onClick={(e) => openFilterMenu('time', e)}>
                修改时间
              </Button>
              <Box sx={{ ml: 'auto' }}>
                <IconButton size="small" color={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>
                  <ListIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>
                  <GridIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>
            {viewMode === 'grid' ? (
              renderGridView
            ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>名称</TableCell>
                  <TableCell>所有者</TableCell>
                  <TableCell>修改日期</TableCell>
                  <TableCell>文件大小</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell sx={{ maxWidth: 460 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography noWrap>{file.filename}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>我</TableCell>
                    <TableCell>{formatModified(file.updatedAt ?? file.createdAt)}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<DownloadLineIcon />} onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
                        下载
                      </Button>
                      <Button size="small" startIcon={<ShareLineIcon />} onClick={() => createShare(file)}>
                        分享
                      </Button>
                      <IconButton size="small" onClick={(e) => openActionMenu(e, file)}>
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </Box>
        ) : viewMode === 'grid' ? (
          renderGridView
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>大小</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell sx={{ maxWidth: 460 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography noWrap>{file.filename}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatFileSize(file.size)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatModified(file.updatedAt ?? file.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<DownloadLineIcon />} onClick={() => downloadFile(file)} disabled={downloadingId === file.id}>
                      下载
                    </Button>
                    <Button size="small" startIcon={<ShareLineIcon />} onClick={() => createShare(file)}>
                      分享
                    </Button>
                    <IconButton size="small" onClick={(e) => openActionMenu(e, file)}>
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {shareLink && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
            <Tooltip title="复制链接">
              <IconButton onClick={copyShareLink}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>

      <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor && actionFile)} onClose={closeActionMenu}>
        <MenuItem
          onClick={() => {
            if (actionFile) void requestMoveFile(actionFile)
            closeActionMenu()
          }}
        >
          <MoveIcon fontSize="small" sx={{ mr: 1 }} />
          移动
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionFile) requestDeleteFile(actionFile)
            closeActionMenu()
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionFile) toggleStar(actionFile)
            closeActionMenu()
          }}
        >
          <StarIcon fontSize="small" sx={{ mr: 1 }} />
          {actionFile && starredIds.includes(actionFile.id) ? '取消星标' : '加星标'}
        </MenuItem>
      </Menu>
      <Menu anchorEl={filterAnchor} open={Boolean(filterMenu)} onClose={closeFilterMenu}>
        {filterMenu === 'type' && (
          <>
            <MenuItem onClick={() => { setTypeFilter('all'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />全部类型</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('doc'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />文档</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('sheet'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />电子表格</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('slide'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />演示文稿</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('image'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />照片和图片</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('pdf'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />PDF</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('video'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />视频</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('archive'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />归档（ZIP）</MenuItem>
            <MenuItem onClick={() => { setTypeFilter('audio'); closeFilterMenu() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />音频</MenuItem>
          </>
        )}
        {filterMenu === 'time' && (
          <>
            <MenuItem onClick={() => { setTimeFilter('all'); closeFilterMenu() }}>全部时间</MenuItem>
            <MenuItem onClick={() => { setTimeFilter('today'); closeFilterMenu() }}>今天</MenuItem>
            <MenuItem onClick={() => { setTimeFilter('7d'); closeFilterMenu() }}>过去 7 天</MenuItem>
            <MenuItem onClick={() => { setTimeFilter('30d'); closeFilterMenu() }}>过去 30 天</MenuItem>
            <MenuItem onClick={() => { setTimeFilter('thisYear'); closeFilterMenu() }}>今年</MenuItem>
            <MenuItem onClick={() => { setTimeFilter('lastYear'); closeFilterMenu() }}>去年</MenuItem>
          </>
        )}
      </Menu>
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>新建文件夹</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" value={folderPathInput} onChange={(e) => setFolderPathInput(e.target.value)} placeholder="例如：项目资料/2026" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => void confirmCreateFolder()}>
            创建
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>移动文件</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" value={moveFilenameInput} onChange={(e) => setMoveFilenameInput(e.target.value)} placeholder="输入新的文件名或目录路径" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => void confirmMoveFile()}>
            确认
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>删除文件</DialogTitle>
        <DialogContent>
          <Typography>确认删除文件「{deleteTargetFile?.filename ?? ''}」吗？删除后不可恢复。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDeleteFile()}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {feedback ? (
          <Alert onClose={() => setFeedback(null)} severity={feedback.type} variant="filled" sx={{ width: '100%' }}>
            {feedback.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}
