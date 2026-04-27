import { useEffect, useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ShareIcon from '@mui/icons-material/Share'
import { authHeaders, request } from '../apiClient'

type FileItem = { id: number; filename: string; size: number }

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState('')
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  async function load() {
    setLoading(true)
    setError('')
    try {
      setFiles(await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function upload(file: File) {
    const form = new FormData()
    form.append('file', file)
    setMessage('')
    setError('')
    try {
      await request('/api/v1/files', { method: 'POST', headers: { ...authHeaders() }, body: form })
      setMessage('Upload success.')
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function createShare(fileId: number) {
    setMessage('')
    setError('')
    try {
      const data = await request<{ token: string }>('/api/v1/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ fileId, expireHours: 24 }),
      })
      const link = `${location.origin}/?share=${data.token}`
      setShareLink(link)
      setMessage('Share link created.')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function copyShareLink() {
    if (!shareLink) return
    await navigator.clipboard.writeText(shareLink)
    setMessage('Share link copied.')
  }

  async function downloadFile(file: FileItem) {
    setMessage('')
    setError('')
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
      URL.revokeObjectURL(url)
      setMessage('Download started.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          File Dashboard
        </Typography>
        <Typography color="text.secondary">Upload, browse, download, and share files securely.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button variant="contained" component="label" startIcon={<UploadFileIcon />} sx={{ px: 2 }}>
              Upload File
              <input hidden type="file" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading} sx={{ px: 2 }}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Chip label={`${files.length} files`} color="primary" variant="outlined" />
          </Box>

          {shareLink && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField size="small" fullWidth value={shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
              <Tooltip title="Copy">
                <IconButton onClick={copyShareLink}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </CardContent>
      </Card>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {files.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                No files yet
              </Typography>
              <Typography color="text.secondary">Upload your first file to get started.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell sx={{ fontWeight: 600, maxWidth: 360 }}>
                      <Tooltip title={f.filename}>
                        <Typography
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                        >
                          {f.filename}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatFileSize(f.size)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => downloadFile(f)}
                          disabled={downloadingId === f.id}
                        >
                          {downloadingId === f.id ? 'Downloading...' : 'Download'}
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<ShareIcon />} onClick={() => createShare(f.id)}>
                          Share
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
