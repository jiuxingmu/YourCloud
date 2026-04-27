import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { request } from '../apiClient'

type Props = { token: string }

export default function SharePage({ token }: Props) {
  const [data, setData] = useState<{ file: { filename: string; id: number } } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    request<{ file: { filename: string; id: number } }>(`/api/v1/shares/${token}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
  }, [token])

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ width: '100%', maxWidth: 560, boxShadow: '0 10px 30px rgba(17,24,39,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Shared File
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {data && (
              <>
                <Typography variant="h6">{data.file.filename}</Typography>
                <Typography color="text.secondary">Sign in to download this file from your dashboard.</Typography>
                <Button variant="contained" href="/">
                  Go to Login
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
