import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { getDeleteDialogDescription, getDeleteDialogTitle, type FileItem } from '../domain'

const dialogPaperSx = { borderRadius: 0, border: '1px solid #dfe3e8', minWidth: 560 }

type Props = {
  folderDialogOpen: boolean
  folderPathInput: string
  setFolderDialogOpen: (open: boolean) => void
  setFolderPathInput: (value: string) => void
  onConfirmCreateFolder: () => void
  moveDialogOpen: boolean
  moveFilenameInput: string
  setMoveDialogOpen: (open: boolean) => void
  setMoveFilenameInput: (value: string) => void
  onConfirmMove: () => void
  deleteDialogOpen: boolean
  deleteTargetFile: FileItem | null
  setDeleteDialogOpen: (open: boolean) => void
  onConfirmDelete: () => void
}

export function FilesDialogs(props: Props) {
  const {
    folderDialogOpen,
    folderPathInput,
    setFolderDialogOpen,
    setFolderPathInput,
    onConfirmCreateFolder,
    moveDialogOpen,
    moveFilenameInput,
    setMoveDialogOpen,
    setMoveFilenameInput,
    onConfirmMove,
    deleteDialogOpen,
    deleteTargetFile,
    setDeleteDialogOpen,
    onConfirmDelete,
  } = props

  return (
    <>
      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle sx={{ fontSize: 32, fontWeight: 500, pt: 3, pb: 2 }}>新建文件夹</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="medium"
            value={folderPathInput}
            onChange={(e) => setFolderPathInput(e.target.value)}
            placeholder="例如：项目资料/2026"
            sx={{ '& .MuiOutlinedInput-root': { minHeight: 58, fontSize: 18 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button size="large" onClick={() => setFolderDialogOpen(false)}>
            取消
          </Button>
          <Button size="large" variant="contained" onClick={onConfirmCreateFolder}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>移动文件</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small" value={moveFilenameInput} onChange={(e) => setMoveFilenameInput(e.target.value)} placeholder="输入新的文件名或目录路径" />
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
    </>
  )
}
