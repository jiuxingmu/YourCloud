import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  ClickAwayListener,
  Button,
  CssBaseline,
  IconButton,
  InputAdornment,
  ListItem,
  List,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popper,
  ListItemButton,
  ListItemIcon,
  LinearProgress,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
  Alert,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import { authHeaders, request, YOURCLOUD_SESSION_EXPIRED_EVENT } from './apiClient'
import { formatBytes } from '@yourcloud/sdk'
import { emitStarredCleared, emitTrashCleared, onFilesChanged } from './features/files/data/filesEvents'
import { clearDeletedItems, clearSearchHistory, clearStarredIds, readSearchHistory, writeSearchHistory } from './features/files/data/filesStorage'
import { ClockIcon, HomeIcon, SearchLineIcon, SettingsIcon, ShareLineIcon, StarIcon, TrashIcon } from './shared/icons/YourCloudIcons'
import FilesPage from './pages/FilesPage'
import LoginPage from './pages/LoginPage'
import SharePage from './pages/SharePage'
import SharesPage from './pages/SharesPage'

export function getShareTokenFromLocation(pathname: string, search: string): string | null {
  const queryToken = new URLSearchParams(search).get('share')
  if (queryToken) return queryToken
  const match = pathname.match(/(?:^|\/)share\/([^/?#]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function isShareRoute(pathname: string): boolean {
  return /(?:^|\/)share(?:\/|$)/.test(pathname)
}

type CurrentUser = { id: number; email: string }

export function displayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || ''
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  if (!normalized) return 'YourCloud 用户'
  return normalized
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export function avatarTextFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'YC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
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

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
  const shareToken = useMemo(() => getShareTokenFromLocation(location.pathname, location.search), [])
  const shareRoute = useMemo(() => isShareRoute(location.pathname), [])
  const [activeNav, setActiveNav] = useState<'drive' | 'recent' | 'starred' | 'trash' | 'shares'>('drive')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>(() => readSearchHistory())
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchAnchorEl, setSearchAnchorEl] = useState<HTMLDivElement | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null)
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usedBytes, setUsedBytes] = useState(0)
  const totalBytes = 2 * 1024 * 1024 * 1024 * 1024
  const shouldRenderSharePage = shareRoute || !!shareToken
  const shouldRenderShell = shouldRenderSharePage || loggedIn

  function logout() {
    localStorage.removeItem('token')
    setLoggedIn(false)
  }

  useEffect(() => {
    function onSessionExpired() {
      setLoggedIn(false)
      setCurrentUser(null)
    }
    window.addEventListener(YOURCLOUD_SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(YOURCLOUD_SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [])

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
    if (!loggedIn || shouldRenderSharePage) {
      setCurrentUser(null)
      return
    }

    let cancelled = false
    async function loadCurrentUser() {
      try {
        const me = await request<CurrentUser>('/api/v1/auth/me', { headers: { ...authHeaders() } })
        if (!cancelled) setCurrentUser(me)
      } catch {
        if (!cancelled) setCurrentUser(null)
      }
    }

    void loadCurrentUser()
    return () => {
      cancelled = true
    }
  }, [loggedIn, shouldRenderSharePage])

  useEffect(() => {
    function handleFilesChanged() {
      void refreshStorageUsage()
    }
    return onFilesChanged(handleFilesChanged as EventListener)
  }, [loggedIn, shareToken])

  const resolvedName = currentUser?.email ? displayNameFromEmail(currentUser.email) : 'YourCloud 用户'
  const resolvedEmail = currentUser?.email || 'unknown@yourcloud.app'
  const resolvedAvatar = avatarTextFromName(resolvedName)
  const navItems: Array<{ id: 'drive' | 'recent' | 'starred' | 'trash' | 'shares'; label: string; icon: JSX.Element }> = [
    { id: 'drive', label: '我的云盘', icon: <HomeIcon fontSize="small" /> },
    { id: 'recent', label: '最近使用', icon: <ClockIcon fontSize="small" /> },
    { id: 'shares', label: '分享管理', icon: <ShareLineIcon fontSize="small" /> },
    { id: 'starred', label: '已加星标', icon: <StarIcon fontSize="small" /> },
    { id: 'trash', label: '回收站', icon: <TrashIcon fontSize="small" /> },
  ]

  function persistHistory(next: string[]) {
    setSearchHistory(next)
    writeSearchHistory(next)
  }

  function pushSearchHistory(term: string) {
    const normalized = term.trim()
    if (!normalized) return
    const next = [normalized, ...searchHistory.filter((item) => item !== normalized)].slice(0, 8)
    persistHistory(next)
  }

  const filteredSearchHistory = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return searchHistory.slice(0, 8)
    return searchHistory.filter((item) => item.toLowerCase().includes(normalized)).slice(0, 8)
  }, [searchHistory, searchQuery])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {shouldRenderShell ? (
          <>
            <AppBar position="fixed" color="inherit" elevation={0}>
              <Toolbar sx={{ minHeight: 64, px: 1.5 }}>
                <Box sx={{ width: 180, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#5f6368' }}>
                      YourCloud
                    </Typography>
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
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
                    <Box ref={setSearchAnchorEl} sx={{ width: '100%', maxWidth: 680 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={searchQuery}
                        onFocus={() => setSearchOpen(true)}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setSearchOpen(true)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            pushSearchHistory(searchQuery)
                            setSearchOpen(false)
                          }
                          if (e.key === 'Escape') setSearchOpen(false)
                        }}
                        placeholder="在云端硬盘中搜索"
                        autoComplete="off"
                        name="file-search"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: '#edf2fb',
                            minHeight: 46,
                            transition: 'all .16s ease',
                            '& fieldset': { borderColor: '#d7deea' },
                            '&:hover': { bgcolor: '#e9effa' },
                            '&:hover fieldset': { borderColor: '#c7d2e6' },
                            '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 2px 10px rgba(26,115,232,0.14)' },
                            '&.Mui-focused fieldset': { borderColor: '#90b4f5' },
                          },
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchLineIcon fontSize="small" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <ArrowDropDownRoundedIcon sx={{ color: '#5f6368' }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <Popper open={searchOpen && filteredSearchHistory.length > 0} anchorEl={searchAnchorEl} placement="bottom-start" sx={{ zIndex: 1301, width: searchAnchorEl?.clientWidth }}>
                        <Paper elevation={0} sx={{ mt: 0.75, border: '1px solid #dfe3eb', borderRadius: 2, overflow: 'hidden', boxShadow: '0 6px 22px rgba(15,23,42,0.12)' }}>
                          <List dense disablePadding>
                            {filteredSearchHistory.map((item) => (
                              <ListItem key={item} disablePadding>
                                <ListItemButton
                                  onClick={() => {
                                    setSearchQuery(item)
                                    pushSearchHistory(item)
                                    setSearchOpen(false)
                                  }}
                                  sx={{ minHeight: 42 }}
                                >
                                  <ListItemText primary={item} />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Popper>
                    </Box>
                  </ClickAwayListener>
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
                    <Avatar sx={{ width: 30, height: 30, fontSize: 14, bgcolor: '#5f72c8' }}>{resolvedAvatar}</Avatar>
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
                    已用 {formatBytes(usedBytes)}，共 {formatBytes(totalBytes)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
                {shouldRenderSharePage ? (
                  <SharePage token={shareToken ?? ''} />
                ) : activeNav === 'shares' ? (
                  <SharesPage />
                ) : (
                  <FilesPage searchQuery={searchQuery} section={activeNav} />
                )}
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
                  clearSearchHistory()
                  setSearchHistory([])
                  setSettingsAnchor(null)
                  showFeedback('success', '已清空搜索历史')
                }}
              >
                清空搜索历史
              </MenuItem>
              <MenuItem
                onClick={() => {
                  clearStarredIds()
                  emitStarredCleared()
                  setSettingsAnchor(null)
                  showFeedback('success', '已清空星标记录')
                }}
              >
                清空星标记录
              </MenuItem>
              <MenuItem
                onClick={() => {
                  clearDeletedItems()
                  emitTrashCleared()
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
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#5f72c8' }}>{resolvedAvatar}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{resolvedName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {resolvedEmail}
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
                    已用 {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
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
