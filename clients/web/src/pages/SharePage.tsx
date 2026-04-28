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

export default function SharePage({ token }: Props) {
  const [data, setData] = useState<{ file: { filename: string; id: number; mimeType?: string } } | null>(null)
  const [error, setError] = useState('')
  const [extractCode, setExtractCode] = useState('')
  const [requiresExtractCode, setRequiresExtractCode] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const validationError = getShareValidationError(token)
    if (validationError) {
      setData(null)
      setError(validationError)
      return
    }
    setLoading(true)
    getShare(token, extractCode)
      .then((payload) => {
        setData(payload)
        setError('')
        setRequiresExtractCode(false)
      })
      .catch((err: unknown) => {
        setData(null)
        if (isExtractCodeError(err)) {
          setError('请输入正确的提取码后访问')
          setRequiresExtractCode(true)
          return
        }
        setError(SHARE_LINK_INVALID_TEXT)
      })
      .finally(() => setLoading(false))
  }, [token, extractCode])

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
              <TextField
                label="提取码"
                value={extractCode}
                onChange={(event) => setExtractCode(event.target.value)}
                placeholder="请输入提取码"
                size="small"
                sx={{ maxWidth: 260 }}
              />
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
                  <Button variant="outlined" href="/">
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
