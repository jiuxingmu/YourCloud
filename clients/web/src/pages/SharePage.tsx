import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import FilePreview from '../components/FilePreview'
import { getShare, buildShareDownloadUrl } from '../features/files/data/filesApi'
import { DownloadLineIcon, FileIcon } from '../shared/icons/YourCloudIcons'

type Props = { token: string }
export const SHARE_LINK_INVALID_TEXT = '分享链接无效或已失效'

export function getShareValidationError(token: string): string | null {
  return token ? null : SHARE_LINK_INVALID_TEXT
}

export default function SharePage({ token }: Props) {
  const [data, setData] = useState<{ file: { filename: string; id: number; mimeType?: string } } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const validationError = getShareValidationError(token)
    if (validationError) {
      setData(null)
      setError(validationError)
      return
    }
    getShare(token)
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
                  <FilePreview id={data.file.id} filename={data.file.filename} mimeType={data.file.mimeType} shareToken={token} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FileIcon color="action" />
                  <Typography variant="h6">{data.file.filename}</Typography>
                </Box>
                <Typography color="text.secondary">你可以直接下载该文件，或返回登录页面管理更多文件。</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                  <Button variant="contained" startIcon={<DownloadLineIcon />} href={buildShareDownloadUrl(token)}>
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
