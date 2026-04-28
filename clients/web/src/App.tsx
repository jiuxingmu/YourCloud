import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  InputAdornment,
  List,
  Menu,
  MenuItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Snackbar,
  SvgIcon,
  type SvgIconProps,
  TextField,
  Toolbar,
  Typography,
  Alert,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { authHeaders, request } from './apiClient'
import FilesPage from './pages/FilesPage'
import LoginPage from './pages/LoginPage'
import SharePage from './pages/SharePage'

export function getShareTokenFromLocation(pathname: string, search: string): string | null {
  const queryToken = new URLSearchParams(search).get('share')
  if (queryToken) return queryToken
  const match = pathname.match(/^\/share\/([^/?#]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function isShareRoute(pathname: string): boolean {
  return /^\/share(?:\/|$)/.test(pathname)
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1a73e8' },
    background: { default: '#f8fafd', paper: '#ffffff' },
    text: { primary: '#1f1f1f', secondary: '#5f6368' },
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Segoe UI", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafd',
          borderBottom: '1px solid #edf0f2',
        },
      },
    },
  },
})

function HomeIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 4 3 11h2v9h5v-6h4v6h5v-9h2z" />
    </SvgIcon>
  )
}

function ClockIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9zm1 9.41 3.29 3.3-1.41 1.41L11 13V7h2z" />
    </SvgIcon>
  )
}

function SearchLineIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M10 3a7 7 0 1 0 4.47 12.39l4.07 4.07 1.41-1.41-4.07-4.07A7 7 0 0 0 10 3zm0 2a5 5 0 1 1-5 5 5.01 5.01 0 0 1 5-5z" />
    </SvgIcon>
  )
}

function SettingsIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.48 7.48 0 0 0-1.63-.94L14.86 3h-3.72l-.37 2.18a7.48 7.48 0 0 0-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58a7.43 7.43 0 0 0-.05.94 7.43 7.43 0 0 0 .05.94l-2.03 1.58 1.92 3.32 2.39-.96a7.48 7.48 0 0 0 1.63.94l.37 2.18h3.72l.37-2.18a7.48 7.48 0 0 0 1.63-.94l2.39.96 1.92-3.32zm-7.14 1.56A2.5 2.5 0 1 1 14.5 12a2.5 2.5 0 0 1-2.5 2.5z" />
    </SvgIcon>
  )
}

function StarIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="m12 3 2.7 5.47L20.7 9l-4.35 4.24 1.03 6.01L12 16.95 6.62 19.25l1.03-6.01L3.3 9l6-.53z" />
    </SvgIcon>
  )
}

function DriveIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7.2 4 2 13l2.4 4h5.2L15 8 12.8 4zm7.6 0L20 13h-5.4L9.4 4zM10.8 20H22l-2.4-4H8.4z" />
    </SvgIcon>
  )
}

function TrashIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M8 4h8l1 2h4v2H3V6h4zm1 6h2v8H9zm4 0h2v8h-2zM6 8h12l-1 12H7z" />
    </SvgIcon>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
  const shareToken = useMemo(() => getShareTokenFromLocation(location.pathname, location.search), [])
  const shareRoute = useMemo(() => isShareRoute(location.pathname), [])
  const [activeNav, setActiveNav] = useState<'home' | 'drive' | 'recent' | 'starred' | 'trash'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('search_history_files')
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null)
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usedBytes, setUsedBytes] = useState(0)
  const totalBytes = 15 * 1024 * 1024 * 1024

  function formatStorageSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  function logout() {
    localStorage.removeItem('token')
    setLoggedIn(false)
  }

  function showFeedback(type: 'success' | 'error', text: string) {
    setFeedback({ type, text })
  }

  async function refreshStorageUsage() {
    if (!loggedIn || shareToken) return
    try {
      const files = await request<Array<{ size: number }>>('/api/v1/files', { headers: { ...authHeaders() } })
      setUsedBytes(files.reduce((sum, file) => sum + (file.size || 0), 0))
    } catch {
      // keep current value on transient errors
    }
  }

  useEffect(() => {
    void refreshStorageUsage()
  }, [loggedIn, shareToken])

  useEffect(() => {
    function handleFilesChanged() {
      void refreshStorageUsage()
    }
    window.addEventListener('yourcloud:files-changed', handleFilesChanged as EventListener)
    return () => {
      window.removeEventListener('yourcloud:files-changed', handleFilesChanged as EventListener)
    }
  }, [loggedIn, shareToken])

  const shouldRenderSharePage = shareRoute || !!shareToken
  const shouldRenderShell = shouldRenderSharePage || loggedIn
  const navItems: Array<{ id: 'home' | 'drive' | 'recent' | 'starred' | 'trash'; label: string; icon: JSX.Element }> = [
    { id: 'home', label: '首页', icon: <HomeIcon fontSize="small" /> },
    { id: 'drive', label: '我的云硬盘', icon: <DriveIcon fontSize="small" /> },
    { id: 'recent', label: '最近使用', icon: <ClockIcon fontSize="small" /> },
    { id: 'starred', label: '已加星标', icon: <StarIcon fontSize="small" /> },
    { id: 'trash', label: '回收站', icon: <TrashIcon fontSize="small" /> },
  ]

  function persistHistory(next: string[]) {
    setSearchHistory(next)
    localStorage.setItem('search_history_files', JSON.stringify(next))
  }

  function pushSearchHistory(term: string) {
    const normalized = term.trim()
    if (!normalized) return
    const next = [normalized, ...searchHistory.filter((item) => item !== normalized)].slice(0, 8)
    persistHistory(next)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {shouldRenderShell ? (
          <>
            <AppBar position="fixed" color="inherit" elevation={0}>
              <Toolbar sx={{ minHeight: 64, px: 1.5 }}>
                <Box sx={{ width: 180, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#5f6368' }}>
                    YourCloud
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') pushSearchHistory(searchQuery)
                    }}
                    placeholder="在云端硬盘中搜索"
                    autoComplete="off"
                    name="file-search"
                    sx={{
                      maxWidth: 680,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        bgcolor: '#e9eef6',
                        minHeight: 44,
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: '#d2d6dc' },
                        '&.Mui-focused fieldset': { borderColor: '#c4c7cc' },
                      },
                    }}
                    slotProps={{
                      htmlInput: { list: 'search-history-list' },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchLineIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <datalist id="search-history-list">
                    {searchHistory.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </Box>
                <Box sx={{ width: 220, ml: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small" aria-label="打开设置菜单" onClick={(e) => setSettingsAnchor(e.currentTarget)}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                  {!shareToken && loggedIn && (
                    <Button size="small" onClick={logout}>
                      退出
                    </Button>
                  )}
                  <IconButton size="small" aria-label="打开账号菜单" onClick={(e) => setAvatarAnchor(e.currentTarget)}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 14, bgcolor: '#5f72c8' }}>Wu</Avatar>
                  </IconButton>
                </Box>
              </Toolbar>
            </AppBar>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '256px minmax(0, 1fr)' }, pt: '64px', minHeight: '100vh' }}>
              <Box sx={{ borderRight: '1px solid #edf0f2', px: 1.5, py: 2, display: { xs: 'none', md: 'block' } }}>
                <List dense>
                  {navItems.map((item) => (
                    <ListItemButton
                      key={item.id}
                      selected={activeNav === item.id}
                      onClick={() => setActiveNav(item.id)}
                      sx={{
                        borderRadius: 0,
                        mb: 0.35,
                        minHeight: 40,
                        '&.Mui-selected': { bgcolor: '#d3e3fd', '&:hover': { bgcolor: '#c7dafd' } },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={<Typography sx={{ fontSize: 14 }}>{item.label}</Typography>} />
                    </ListItemButton>
                  ))}
                </List>
                <Box sx={{ mt: 2.5, px: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    存储
                  </Typography>
                  <LinearProgress variant="determinate" value={Math.max(1, Math.min(100, (usedBytes / totalBytes) * 100))} sx={{ mt: 1, mb: 0.8, height: 6, borderRadius: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    已用 {formatStorageSize(usedBytes)}，共 15 GB
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
                {shouldRenderSharePage ? <SharePage token={shareToken ?? ''} /> : <FilesPage searchQuery={searchQuery} section={activeNav} />}
              </Box>
            </Box>
            <Menu
              anchorEl={settingsAnchor}
              open={Boolean(settingsAnchor)}
              onClose={() => setSettingsAnchor(null)}
              slotProps={{ paper: { sx: { borderRadius: 0 } } }}
            >
              <MenuItem disableRipple sx={{ pointerEvents: 'none', opacity: 1, fontSize: 12, color: 'text.secondary' }}>
                设置
              </MenuItem>
              <MenuItem
                onClick={() => {
                  localStorage.removeItem('search_history_files')
                  setSearchHistory([])
                  setSettingsAnchor(null)
                  showFeedback('success', '已清空搜索历史')
                }}
              >
                清空搜索历史
              </MenuItem>
              <MenuItem
                onClick={() => {
                  localStorage.removeItem('starred_file_ids')
                  window.dispatchEvent(new CustomEvent('yourcloud:starred-cleared'))
                  setSettingsAnchor(null)
                  showFeedback('success', '已清空星标记录')
                }}
              >
                清空星标记录
              </MenuItem>
              <MenuItem
                onClick={() => {
                  localStorage.removeItem('deleted_file_items')
                  window.dispatchEvent(new CustomEvent('yourcloud:trash-cleared'))
                  setSettingsAnchor(null)
                  showFeedback('success', '已清空回收站记录')
                }}
              >
                清空回收站记录
              </MenuItem>
            </Menu>
            <Menu
              anchorEl={avatarAnchor}
              open={Boolean(avatarAnchor)}
              onClose={() => setAvatarAnchor(null)}
              slotProps={{ paper: { sx: { borderRadius: 0, minWidth: 260, p: 1 } } }}
            >
              <Box sx={{ px: 1.5, py: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#5f72c8' }}>Wu</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Xuegao Wu</Typography>
                    <Typography variant="caption" color="text.secondary">
                      wu@yourcloud.app
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <MenuItem disableRipple sx={{ pointerEvents: 'none', opacity: 1 }}>
                <Box sx={{ width: '100%', display: 'grid', gap: 0.4 }}>
                  <Typography variant="caption" color="text.secondary">
                    账号容量
                  </Typography>
                  <LinearProgress variant="determinate" value={Math.max(1, Math.min(100, (usedBytes / totalBytes) * 100))} sx={{ height: 5, borderRadius: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    已用 {formatStorageSize(usedBytes)} / 15 GB
                  </Typography>
                </Box>
              </MenuItem>
              {!shareToken && loggedIn && (
                <MenuItem
                  onClick={() => {
                    setAvatarAnchor(null)
                    logout()
                  }}
                >
                  退出登录
                </MenuItem>
              )}
            </Menu>
            <Snackbar open={Boolean(feedback)} autoHideDuration={2800} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
              {feedback ? (
                <Alert onClose={() => setFeedback(null)} closeText="关闭" severity={feedback.type} variant="filled" sx={{ width: '100%' }}>
                  {feedback.text}
                </Alert>
              ) : undefined}
            </Snackbar>
          </>
        ) : (
          <LoginPage onSuccess={() => setLoggedIn(true)} />
        )}
      </Box>
    </ThemeProvider>
  )
}
