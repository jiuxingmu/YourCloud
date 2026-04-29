import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material'
import FilePreview from '../components/FilePreview'
import { ApiRequestError } from '../apiClient'
import { getShare, buildShareDownloadUrlWithCode } from '../features/files/data/filesApi'
import { DownloadLineIcon, FileIcon } from '../shared/icons/YourCloudIcons'

type Props = { token: string }
export const SHARE_LINK_INVALID_TEXT = '分享链接无效或已失效'

export function getShareValidationError(token: string): string | null {
  return token ? null : SHARE_LINK_INVALID_TEXT
}

export function isExtractCodeError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 403 && error.code === 'EXTRACT_CODE_INVALID'
}

export function mapShareErrorMessage(error: unknown): string {
  if (isExtractCodeError(error)) return '请输入正确的提取码后访问'
  if (error instanceof ApiRequestError && error.status === 410 && error.code === 'EXPIRED') return '分享链接已过期'
  if (error instanceof ApiRequestError && error.status === 410 && error.code === 'REVOKED') return '分享已被取消'
  if (error instanceof ApiRequestError && error.status === 404 && error.code === 'NOT_FOUND') return '分享内容不存在或已被删除'
  return SHARE_LINK_INVALID_TEXT
}

export default function SharePage({ token }: Props) {
  const appHomeHref = import.meta.env.BASE_URL || '/'
  const [data, setData] = useState<{ file: { filename: string; id: number; mimeType?: string } } | null>(null)
  const [error, setError] = useState('')
  const [extractCode, setExtractCode] = useState('')
  const [requiresExtractCode, setRequiresExtractCode] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loadShare(currentCode = '') {
    const validationError = getShareValidationError(token)
    if (validationError) {
      setData(null)
      setError(validationError)
      return
    }
    setLoading(true)
    try {
      const payload = await getShare(token, currentCode)
      setData(payload)
      setError('')
      setRequiresExtractCode(false)
    } catch (err: unknown) {
      setData(null)
      const message = mapShareErrorMessage(err)
      setError(message)
      setRequiresExtractCode(isExtractCodeError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadShare('')
  }, [token])

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        与我共享
      </Typography>
      <Card variant="outlined" sx={{ borderRadius: 0, borderColor: '#dfe3e8' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Chip label="分享文件" size="small" sx={{ alignSelf: 'flex-start' }} />
            {error && <Alert severity="error">{error}</Alert>}
            {requiresExtractCode && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ maxWidth: 360 }}>
                <TextField
                  label="提取码"
                  value={extractCode}
                  onChange={(event) => setExtractCode(event.target.value)}
                  placeholder="请输入提取码"
                  size="small"
                />
                <Button variant="outlined" onClick={() => void loadShare(extractCode)} disabled={loading || !extractCode.trim()}>
                  验证提取码
                </Button>
              </Stack>
            )}
            {data && (
              <>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    maxWidth: 560,
                    borderRadius: 0,
                    border: '1px solid #eef1f4',
                    bgcolor: '#f8fafd',
                    overflow: 'hidden',
                  }}
                >
                  <FilePreview id={data.file.id} filename={data.file.filename} mimeType={data.file.mimeType} shareToken={token} shareExtractCode={extractCode} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FileIcon color="action" />
                  <Typography variant="h6">{data.file.filename}</Typography>
                </Box>
                <Typography color="text.secondary">你可以直接下载该文件，或返回登录页面管理更多文件。</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                  <Button variant="contained" startIcon={<DownloadLineIcon />} href={buildShareDownloadUrlWithCode(token, extractCode)} disabled={loading}>
                    立即下载
                  </Button>
                  <Button variant="outlined" href={appHomeHref}>
                    返回登录
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
