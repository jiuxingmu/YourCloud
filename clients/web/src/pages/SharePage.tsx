import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, SvgIcon, type SvgIconProps, Typography } from '@mui/material'
import { request } from '../apiClient'
import FilePreview from '../components/FilePreview'

type Props = { token: string }
export const SHARE_LINK_INVALID_TEXT = '分享链接无效或已失效'

export function getShareValidationError(token: string): string | null {
  return token ? null : SHARE_LINK_INVALID_TEXT
}

function DownloadLineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 4h2v8.17l2.59-2.58L17 11l-5 5-5-5 1.41-1.41L11 12.17zM5 18h14v2H5z" />
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

export default function SharePage({ token }: Props) {
  const [data, setData] = useState<{ file: { filename: string; id: number; mimeType?: string } } | null>(null)
  const [error, setError] = useState('')
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  useEffect(() => {
    const validationError = getShareValidationError(token)
    if (validationError) {
      setData(null)
      setError(validationError)
      return
    }
    request<{ file: { filename: string; id: number; mimeType?: string } }>(`/api/v1/shares/${token}`)
      .then(setData)
      .catch(() => setError(SHARE_LINK_INVALID_TEXT))
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
                  <FilePreview id={data.file.id} filename={data.file.filename} mimeType={data.file.mimeType} shareToken={token} apiBase={apiBase} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FileIcon color="action" />
                  <Typography variant="h6">{data.file.filename}</Typography>
                </Box>
                <Typography color="text.secondary">你可以直接下载该文件，或返回登录页面管理更多文件。</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                  <Button variant="contained" startIcon={<DownloadLineIcon />} href={`${apiBase}/api/v1/shares/${token}/download`}>
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
