# YourCloud Web UI 重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `YourCloud` Web 端升级为“作品集风格 + 预览优先”的双栏体验，并保持现有 API 行为不变。

**Architecture:** 保持现有 React + MUI 架构，围绕 `App`、`LoginPage`、`FilesPage` 做表现层重构。`FilesPage` 拆分为目录区、预览区、状态提示等可维护单元，文件选择状态成为页面核心驱动。不改后端接口，只调整前端状态组织与交互路径。

**Tech Stack:** React 18、TypeScript、Vite、MUI 组件库

---

## 文件结构与职责

- Modify: `clients/web/src/App.tsx`（全局壳层、主题 token、主容器布局）
- Modify: `clients/web/src/pages/LoginPage.tsx`（登录/注册双栏视觉与 Tab 交互）
- Modify: `clients/web/src/pages/FilesPage.tsx`（主交互重构：列表+预览、上传、下载、分享、状态）
- Optional Create: `clients/web/src/pages/files/PreviewPane.tsx`（预览舞台子组件）
- Optional Create: `clients/web/src/pages/files/FileDirectoryPane.tsx`（目录区子组件）

> 说明：若 `FilesPage` 改造后超过约 280 行，执行可选拆分；否则可先保持单文件实现，再在后续任务内拆分。

### Task 1: 全局主题与 App 外壳重构

**Files:**
- Modify: `clients/web/src/App.tsx`
- Test: `clients/web` 本地构建验证

- [ ] **Step 1: 写出视觉改造后的主题对象（先改 `createTheme`）**

```tsx
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5b4dff' },
    secondary: { main: '#7c3aed' },
    background: { default: '#f3f1ff', paper: '#ffffff' },
  },
  shape: { borderRadius: 16 },
  typography: {
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
})
```

- [ ] **Step 2: 调整顶栏与容器结构，形成“品牌栏 + 全高主体”**

```tsx
<Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f4ff 0%, #eef3ff 100%)' }}>
  <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e7e5f4' }}>
    <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>YourCloud</Typography>
        <Typography variant="caption" color="text.secondary">Creative Cloud Workspace</Typography>
      </Box>
      {/* 保留登录态和退出按钮 */}
    </Toolbar>
  </AppBar>
  <Container maxWidth={false} sx={{ maxWidth: 1200, py: { xs: 2, md: 4 } }}>
    {/* 页面内容 */}
  </Container>
</Box>
```

- [ ] **Step 3: 运行构建确认无类型错误**

Run: `npm --prefix clients/web run build`  
Expected: `vite build` 完成且退出码为 0

- [ ] **Step 4: 提交本任务**

```bash
git add clients/web/src/App.tsx
git commit -m "feat(web): refresh global shell and visual theme"
```

### Task 2: 登录页改为作品集风格双栏 + Tab 认证流

**Files:**
- Modify: `clients/web/src/pages/LoginPage.tsx`
- Test: 登录页交互手动验证 + 构建验证

- [ ] **Step 1: 将“两个按钮并列登录/注册”改为 Tab 切换状态**

```tsx
const [mode, setMode] = useState<'login' | 'register'>('login')

<Tabs value={mode} onChange={(_, v) => setMode(v)} variant="fullWidth">
  <Tab label="登录" value="login" />
  <Tab label="创建账号" value="register" />
</Tabs>

<Button
  variant="contained"
  onClick={() => submit(mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register')}
  disabled={!!loading}
>
  {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
</Button>
```

- [ ] **Step 2: 改为左右双栏视觉结构并补充品牌侧文案**

```tsx
<Box sx={{ minHeight: { md: '70vh' }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: 3 }}>
  <Card sx={{ display: { xs: 'none', md: 'block' }, p: 4, background: 'linear-gradient(135deg, #5b4dff, #7c3aed)', color: '#fff' }}>
    <Typography variant="h4" sx={{ mb: 1 }}>YourCloud Studio</Typography>
    <Typography sx={{ opacity: 0.9 }}>上传、预览、分享你的创作文件，一站完成。</Typography>
  </Card>
  <Card>
    <CardContent sx={{ p: 4 }}>
      {/* Tabs + 表单 */}
    </CardContent>
  </Card>
</Box>
```

- [ ] **Step 3: 统一反馈区（成功/错误）并验证注册自动登录路径**

Run: `npm --prefix clients/web run dev`  
Expected:  
- 切换 Tab 后按钮文案与提交路径一致  
- 登录/注册错误反馈显示在同一区域  

- [ ] **Step 4: 运行构建并提交**

```bash
npm --prefix clients/web run build
git add clients/web/src/pages/LoginPage.tsx
git commit -m "feat(web): redesign auth page with split layout and tabs"
```

### Task 3: FilesPage 改造为“左目录 + 右预览舞台”核心布局

**Files:**
- Modify: `clients/web/src/pages/FilesPage.tsx`
- Optional Create: `clients/web/src/pages/files/FileDirectoryPane.tsx`
- Optional Create: `clients/web/src/pages/files/PreviewPane.tsx`
- Test: 文件列表、选中、下载、分享、空态、加载态

- [ ] **Step 1: 新增选中文件状态并在加载后自动选中首项**

```tsx
const [selectedId, setSelectedId] = useState<number | null>(null)
const selectedFile = files.find((f) => f.id === selectedId) ?? null

async function load() {
  setLoading(true)
  const nextFiles = await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } })
  setFiles(nextFiles)
  setSelectedId((prev) => (prev && nextFiles.some((f) => f.id === prev) ? prev : nextFiles[0]?.id ?? null))
  setLoading(false)
}
```

- [ ] **Step 2: 用响应式双栏替换表格容器**

```tsx
<Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 420px) 1fr' } }}>
  <Card>{/* 左侧目录区：上传、文件列表、选中高亮 */}</Card>
  <Card>{/* 右侧预览舞台：标题、预览、操作区 */}</Card>
</Box>
```

- [ ] **Step 3: 目录区改为可点击列表，支持键盘上下选择**

```tsx
<List onKeyDown={handleListKeyDown}>
  {files.map((f) => (
    <ListItemButton key={f.id} selected={f.id === selectedId} onClick={() => setSelectedId(f.id)}>
      <ListItemText primary={f.filename} secondary={formatFileSize(f.size)} />
    </ListItemButton>
  ))}
</List>
```

- [ ] **Step 4: 预览区实现“预览优先”展示**

```tsx
{selectedFile ? (
  <Box>
    <Typography variant="h5">{selectedFile.filename}</Typography>
    <Box sx={{ mt: 2, p: 2, minHeight: 320, border: '1px dashed #c7c3df', borderRadius: 2 }}>
      <Typography color="text.secondary">当前文件暂不支持内联预览，建议下载查看。</Typography>
    </Box>
    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
      <Button variant="contained" onClick={() => downloadFile(selectedFile)}>下载</Button>
      <Button variant="outlined" onClick={() => createShare(selectedFile.id)}>创建分享链接</Button>
    </Stack>
  </Box>
) : (
  <EmptyState />
)}
```

- [ ] **Step 5: 将分享链接展示绑定到预览区，而不是顶部全局区域**

```tsx
{shareLink && selectedFile && (
  <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5 }}>
    <Typography variant="caption" color="text.secondary">分享链接（24 小时有效）</Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <TextField size="small" fullWidth value={shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
      <Button onClick={copyShareLink}>复制</Button>
    </Stack>
  </Paper>
)}
```

- [ ] **Step 6: 运行手动回归**

Run: `npm --prefix clients/web run dev`  
Expected:  
- 有文件时默认选中第一项  
- 点击左侧项后右侧内容更新  
- 下载/分享可用，复制链接提示正常  
- 无文件时显示空态引导

- [ ] **Step 7: 构建并提交**

```bash
npm --prefix clients/web run build
git add clients/web/src/pages/FilesPage.tsx clients/web/src/pages/files/*.tsx
git commit -m "feat(web): implement editorial split files workspace"
```

### Task 4: 状态反馈统一与体验打磨

**Files:**
- Modify: `clients/web/src/pages/FilesPage.tsx`
- Modify: `clients/web/src/pages/LoginPage.tsx`
- Test: 成功/错误提示一致性与响应式

- [ ] **Step 1: 用 Snackbar + Alert 统一瞬态提示（成功/失败）**

```tsx
const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

<Snackbar open={!!toast} autoHideDuration={2200} onClose={() => setToast(null)}>
  {toast ? <Alert severity={toast.type}>{toast.text}</Alert> : <span />}
</Snackbar>
```

- [ ] **Step 2: 为加载和空态增加 skeleton 与引导 CTA**

```tsx
{loading ? (
  <Stack spacing={1.2}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
) : files.length === 0 ? (
  <Box sx={{ p: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>还没有文件</Typography>
    <Typography color="text.secondary" sx={{ mb: 1.5 }}>上传你的第一个作品开始管理。</Typography>
    <Button variant="contained" component="label">上传文件<input hidden type="file" onChange={...} /></Button>
  </Box>
) : (
  <FileList />
)}
```

- [ ] **Step 3: 做响应式验收（移动端布局与按钮可达性）**

Run: `npm --prefix clients/web run dev`  
Expected:  
- `375x812` 视口下可完成 选择 -> 预览 -> 下载/分享  
- 关键按钮不被裁切，不发生重叠

- [ ] **Step 4: 最终构建并提交**

```bash
npm --prefix clients/web run build
git add clients/web/src/pages/FilesPage.tsx clients/web/src/pages/LoginPage.tsx
git commit -m "feat(web): unify feedback states and responsive polish"
```

## Spec 覆盖自检

- 视觉风格（创意作品集、蓝紫强调、柔和容器）：Task 1/2/4 覆盖
- 布局重构（登录双栏、文件页左目录右预览、响应式）：Task 2/3/4 覆盖
- 交互重构（自动选中、预览优先、操作层级、分享区位置）：Task 3 覆盖
- 状态一致性（空态、加载态、错误/成功反馈）：Task 4 覆盖
- 保持 API 不变：所有任务仅修改前端页面层，未引入后端变更
