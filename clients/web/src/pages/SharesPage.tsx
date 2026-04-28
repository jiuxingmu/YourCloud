import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ApiRequestError, toUserFriendlyErrorMessage } from '../apiClient'
import { listMyShares, revokeShare, type ManagedShareItem } from '../features/files/data/filesApi'

function formatDate(value?: string | null): string {
  if (!value) return '永久有效'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN')
}

function getStatus(item: ManagedShareItem): string {
  if (item.share.revokedAt) return '已失效（手动取消）'
  if (item.share.expiresAt && new Date(item.share.expiresAt).getTime() < Date.now()) return '已过期'
  return '生效中'
}

export default function SharesPage() {
  const [items, setItems] = useState<ManagedShareItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [revokingId, setRevokingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listMyShares()
      setItems(data)
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, 'files'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleRevoke(item: ManagedShareItem) {
    setFeedback('')
    setRevokingId(item.share.id)
    try {
      await revokeShare(item.share.id)
      setFeedback(`已提前失效分享：${item.filename}`)
      await load()
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'ALREADY_REVOKED') {
        setFeedback('该分享已失效')
        await load()
      } else {
        setError(toUserFriendlyErrorMessage(err, 'files'))
      }
    } finally {
      setRevokingId(null)
    }
  }

  async function copyShareLink(token: string) {
    const link = `${location.origin}/share/${token}`
    setFeedback('')
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setFeedback('分享链接已复制')
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, 'files'))
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.share.createdAt || 0).getTime() - new Date(a.share.createdAt || 0).getTime())
  }, [items])
  const unifiedTableSx = {
    tableLayout: 'fixed',
    '& .MuiTableCell-root': { px: 1.5, py: 1, whiteSpace: 'nowrap' },
    '& .MuiTableHead-root .MuiTableCell-root': { fontWeight: 600, color: 'text.secondary', borderBottomColor: '#e6eaf0' },
  }
  const headerCellSx = { width: `${100 / 6}%` }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography sx={{ fontSize: 34, fontWeight: 500 }}>分享管理</Typography>
      <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, borderColor: '#dfe3e8' }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontWeight: 600 }}>我的分享</Typography>
        </Stack>
        {feedback && <Alert severity="success" sx={{ mb: 1.5 }}>{feedback}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Table size="small" sx={unifiedTableSx}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>文件</TableCell>
              <TableCell sx={headerCellSx}>提取码</TableCell>
              <TableCell sx={headerCellSx}>过期时间</TableCell>
              <TableCell sx={headerCellSx}>状态</TableCell>
              <TableCell sx={headerCellSx}>分享链接</TableCell>
              <TableCell sx={headerCellSx} align="right">
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((item) => {
              const status = getStatus(item)
              return (
                <TableRow key={item.share.id}>
                  <TableCell>{item.filename}</TableCell>
                  <TableCell>{item.extractCode?.trim() ? item.extractCode : '-'}</TableCell>
                  <TableCell>{formatDate(item.share.expiresAt)}</TableCell>
                  <TableCell>{status}</TableCell>
                  <TableCell>
                    <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => void copyShareLink(item.share.token)}>
                      链接
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      disabled={Boolean(item.share.revokedAt) || revokingId === item.share.id}
                      onClick={() => void handleRevoke(item)}
                    >
                      取消分享
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {!loading && sortedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">暂无分享记录</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
