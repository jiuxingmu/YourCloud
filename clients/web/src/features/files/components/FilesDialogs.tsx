import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { getDeleteDialogDescription, getDeleteDialogTitle, type FileItem } from '../domain'

const dialogPaperSx = { borderRadius: 0, border: '1px solid #dfe3e8', minWidth: 560 }

type Props = {
  folderDialogOpen: boolean
  folderPathInput: string
  setFolderDialogOpen: (open: boolean) => void
  setFolderPathInput: (value: string) => void
  onConfirmCreateFolder: () => void
  moveDialogOpen: boolean
  moveTargetFolderPath: string
  moveFolderOptions: string[]
  setMoveDialogOpen: (open: boolean) => void
  setMoveTargetFolderPath: (value: string) => void
  onConfirmMove: () => void
  deleteDialogOpen: boolean
  deleteTargetFile: FileItem | null
  setDeleteDialogOpen: (open: boolean) => void
  onConfirmDelete: () => void
  shareDialogOpen: boolean
  shareSourceFile: FileItem | null
  shareExpireDays: number
  setShareExpireDays: (value: number) => void
  shareExtractCode: string
  setShareExtractCode: (value: string) => void
  shareLink: string
  shareToken: string
  shareQrUrl: string
  shareCreating: boolean
  shareExpiresAt: string | null
  setShareDialogOpen: (open: boolean) => void
  onConfirmCreateShare: () => void
  onCopyShareLink: () => void
}

export function FilesDialogs(props: Props) {
  const {
    folderDialogOpen,
    folderPathInput,
    setFolderDialogOpen,
    setFolderPathInput,
    onConfirmCreateFolder,
    moveDialogOpen,
    moveTargetFolderPath,
    moveFolderOptions,
    setMoveDialogOpen,
    setMoveTargetFolderPath,
    onConfirmMove,
    deleteDialogOpen,
    deleteTargetFile,
    setDeleteDialogOpen,
    onConfirmDelete,
    shareDialogOpen,
    shareSourceFile,
    shareExpireDays,
    setShareExpireDays,
    shareExtractCode,
    setShareExtractCode,
    shareLink,
    shareToken,
    shareQrUrl,
    shareCreating,
    shareExpiresAt,
    setShareDialogOpen,
    onConfirmCreateShare,
    onCopyShareLink,
  } = props

  return (
    <>
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle sx={{ fontSize: 20, fontWeight: 500, pt: 2, pb: 1.5 }}>新建文件夹</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={folderPathInput}
            onChange={(e) => setFolderPathInput(e.target.value)}
            placeholder="例如：项目资料/2026"
            sx={{ '& .MuiOutlinedInput-root': { fontSize: 14 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
          <Button onClick={() => setFolderDialogOpen(false)}>
            取消
          </Button>
          <Button variant="contained" onClick={onConfirmCreateFolder}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>移动文件</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            select
            fullWidth
            size="small"
            value={moveTargetFolderPath}
            onChange={(e) => setMoveTargetFolderPath(e.target.value)}
            label="目标文件夹"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              mt: 0.5,
              '& .MuiInputLabel-root': {
                backgroundColor: '#fff',
                px: 0.5,
              },
            }}
          >
            <MenuItem value="" disabled>
              请选择目标文件夹
            </MenuItem>
            <MenuItem value="/">我的云端硬盘（根目录）</MenuItem>
            {moveFolderOptions.map((folder) => (
              <MenuItem key={folder} value={folder}>
                {folder}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={onConfirmMove}>
            确认
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>{getDeleteDialogTitle(deleteTargetFile)}</DialogTitle>
        <DialogContent>
          <Typography>{getDeleteDialogDescription(deleteTargetFile)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button color="error" variant="contained" onClick={onConfirmDelete}>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} slotProps={{ paper: { sx: { ...dialogPaperSx, minWidth: 640 } } }}>
        <DialogTitle sx={{ fontSize: 20, fontWeight: 500 }}>分享文件</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              文件：{shareSourceFile?.filename || '-'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="有效期"
                value={shareExpireDays}
                onChange={(e) => setShareExpireDays(Number(e.target.value))}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value={1}>1 天</MenuItem>
                <MenuItem value={3}>3 天</MenuItem>
                <MenuItem value={7}>7 天</MenuItem>
                <MenuItem value={30}>1 个月</MenuItem>
                <MenuItem value={0}>永久</MenuItem>
              </TextField>
              <TextField
                size="small"
                label="提取码（可选）"
                placeholder="默认无"
                value={shareExtractCode}
                onChange={(e) => setShareExtractCode(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 16 } }}
                sx={{ minWidth: 220 }}
              />
              <Button variant="contained" onClick={onConfirmCreateShare}>
                {shareCreating ? '生成中...' : '生成链接'}
              </Button>
            </Stack>

            {shareLink && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ pt: 0.5 }}>
                <Box sx={{ width: 220, height: 220, border: '1px solid #eef1f4', display: 'grid', placeItems: 'center', bgcolor: '#fff' }}>
                  {shareQrUrl ? <img src={shareQrUrl} alt="分享二维码" width={200} height={200} /> : <Typography variant="caption" color="text.secondary">{shareCreating ? '正在生成二维码...' : '暂无二维码'}</Typography>}
                </Box>
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <TextField size="small" label="分享链接" value={shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
                  <TextField size="small" label="有效期" value={shareExpiresAt ? new Date(shareExpiresAt).toLocaleString() : '永久'} slotProps={{ htmlInput: { readOnly: true } }} />
                  <TextField size="small" label="分享 Token" value={shareToken} slotProps={{ htmlInput: { readOnly: true } }} />
                  <TextField size="small" label="提取码" value={shareExtractCode || '无'} slotProps={{ htmlInput: { readOnly: true } }} />
                  <Link href={shareLink} target="_blank" rel="noreferrer" underline="hover">
                    在新标签页打开分享链接
                  </Link>
                </Stack>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>关闭</Button>
          <Button variant="outlined" onClick={onCopyShareLink} disabled={!shareLink || shareCreating}>
            复制链接
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
