import { useMemo, useState } from 'react'
import { AppBar, Box, Button, Chip, Container, CssBaseline, Toolbar, Typography } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import FilesPage from './pages/FilesPage'
import LoginPage from './pages/LoginPage'
import SharePage from './pages/SharePage'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3b82f6' },
    background: { default: '#f4f6fb' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minWidth: 108,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
})

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
  const shareToken = useMemo(() => new URLSearchParams(location.search).get('share'), [])

  function logout() {
    localStorage.removeItem('token')
    setLoggedIn(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e5e7eb' }}>
          <Toolbar sx={{ maxWidth: 980, width: '100%', mx: 'auto' }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              YourCloud
            </Typography>
            {!shareToken && loggedIn && <Chip label="Logged in" color="success" variant="outlined" size="small" sx={{ mr: 1.5 }} />}
            {!shareToken && loggedIn && (
              <Button variant="outlined" size="small" onClick={logout}>
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 5 }}>
          {shareToken ? <SharePage token={shareToken} /> : loggedIn ? <FilesPage /> : <LoginPage onSuccess={() => setLoggedIn(true)} />}
        </Container>
      </Box>
    </ThemeProvider>
  )
}
