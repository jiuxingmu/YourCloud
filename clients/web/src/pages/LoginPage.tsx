import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { request } from '../apiClient'

type Props = { onSuccess: () => void }

export default function LoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState<'login' | 'register' | null>(null)

  async function submit(path: '/api/v1/auth/login' | '/api/v1/auth/register') {
    setError('')
    setMessage('')
    setLoading(path === '/api/v1/auth/login' ? 'login' : 'register')
    try {
      const data = await request<{ token?: string }>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (data.token) {
        localStorage.setItem('token', data.token)
        onSuccess()
        return
      }

      if (path === '/api/v1/auth/register') {
        setMessage('Register success, logging you in...')
        const loginData = await request<{ token?: string }>('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (loginData.token) {
          localStorage.setItem('token', loginData.token)
          onSuccess()
          return
        }
        setMessage('Register success. Please click Login.')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ width: '100%', maxWidth: 520, boxShadow: '0 10px 30px rgba(17,24,39,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Welcome Back
              </Typography>
              <Typography color="text.secondary">Login or create a new account to manage your cloud files.</Typography>
            </Box>

            <TextField label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" onClick={() => submit('/api/v1/auth/login')} disabled={!!loading}>
                {loading === 'login' ? 'Signing in...' : 'Login'}
              </Button>
              <Button variant="outlined" onClick={() => submit('/api/v1/auth/register')} disabled={!!loading}>
                {loading === 'register' ? 'Creating...' : 'Register'}
              </Button>
            </Stack>

            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
