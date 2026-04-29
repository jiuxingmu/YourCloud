import { useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Divider, Snackbar, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { request, toUserFriendlyErrorMessage } from '../apiClient'

type Props = { onSuccess: () => void }

export default function LoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setFeedback({ type: 'error', text: '请输入邮箱和密码。' })
      return
    }
    if (!emailPattern.test(normalizedEmail)) {
      setFeedback({ type: 'error', text: '请输入有效的邮箱地址。' })
      return
    }
    if (mode === 'register' && password.length < 6) {
      setFeedback({ type: 'error', text: '注册密码至少需要 6 位。' })
      return
    }

    const path = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register'
    setFeedback(null)
    setLoading(true)
    try {
      const data = await request<{ token?: string }>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      if (data.token) {
        localStorage.setItem('token', data.token)
        onSuccess()
        return
      }

      if (path === '/api/v1/auth/register') {
        setFeedback({ type: 'success', text: '注册成功，正在为你登录...' })
        const loginData = await request<{ token?: string }>('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        })
        if (loginData.token) {
          localStorage.setItem('token', loginData.token)
          onSuccess()
          return
        }
        setFeedback({ type: 'success', text: '注册成功，请切换到登录继续。' })
      }
    } catch (e) {
      setFeedback({ type: 'error', text: toUserFriendlyErrorMessage(e, 'auth') })
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submit()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 760,
          borderRadius: 0,
          border: '1px solid #e0e3e7',
          boxShadow: 'none',
        }}
      >
        <CardContent component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a73e8', fontSize: 15 }}>云</Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 500 }}>登录 YourCloud</Typography>
                <Box
                  sx={{
                    px: 0.8,
                    py: '1px',
                    borderRadius: 0,
                    border: '1px solid #f2c46f',
                    bgcolor: '#fff7e6',
                    color: '#9a6a00',
                    fontSize: 10,
                    lineHeight: 1.2,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                  }}
                >
                  测试版
                </Box>
              </Box>
            </Box>
            <Typography color="text.secondary" sx={{ fontSize: 14 }}>
              使用你的账号访问云端硬盘
            </Typography>

            <Tabs
              value={mode}
              onChange={(_e: SyntheticEvent, value: 'login' | 'register') => {
                setMode(value)
                setEmail('')
                setPassword('')
                setFeedback(null)
              }}
              variant="fullWidth"
            >
              <Tab label="登录" value="login" />
              <Tab label="注册" value="register" />
            </Tabs>

            <TextField
              label="电子邮箱"
              placeholder="you@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="密码"
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              fullWidth
            />

            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" type="submit" disabled={loading} size="large" sx={{ minWidth: 124, borderRadius: 0 }}>
                {loading ? (mode === 'login' ? '登录中...' : '创建中...') : mode === 'login' ? '登录' : '注册'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {feedback ? (
          <Alert onClose={() => setFeedback(null)} closeText="关闭" severity={feedback.type} variant="filled" sx={{ width: '100%' }}>
            {feedback.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}
