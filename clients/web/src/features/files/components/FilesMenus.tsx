import { Menu, MenuItem } from '@mui/material'
import { ArchiveIcon, AudioIcon, DeleteIcon, FileIcon, ImageIcon, MoveIcon, PdfIcon, StarIcon, VideoIcon } from '../../../shared/icons/YourCloudIcons'
import type { FileItem, TimeFilter, TypeFilter } from '../domain/types'

type ActionMenuProps = {
  anchorEl: null | HTMLElement
  actionFile: FileItem | null
  starredIds: number[]
  onClose: () => void
  onRequestMove: (file: FileItem) => void
  onRequestDelete: (file: FileItem) => void
  onToggleStar: (file: FileItem) => void
}

export function FileActionMenu({ anchorEl, actionFile, starredIds, onClose, onRequestMove, onRequestDelete, onToggleStar }: ActionMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl && actionFile)} onClose={onClose} slotProps={{ list: { 'aria-label': '文件操作菜单' } }}>
      <MenuItem
        onClick={() => {
          if (actionFile) onRequestMove(actionFile)
          onClose()
        }}
      >
        <MoveIcon fontSize="small" sx={{ mr: 1 }} />
        移动
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (actionFile) onRequestDelete(actionFile)
          onClose()
        }}
      >
        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
        删除
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (actionFile) onToggleStar(actionFile)
          onClose()
        }}
      >
        <StarIcon fontSize="small" sx={{ mr: 1 }} />
        {actionFile && starredIds.includes(actionFile.id) ? '取消星标' : '加星标'}
      </MenuItem>
    </Menu>
  )
}

type FilterMenuProps = {
  anchorEl: null | HTMLElement
  filterMenu: 'type' | 'time' | null
  onClose: () => void
  setTypeFilter: (value: TypeFilter) => void
  setTimeFilter: (value: TimeFilter) => void
}

export function FileFilterMenu({ anchorEl, filterMenu, onClose, setTypeFilter, setTimeFilter }: FilterMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(filterMenu)} onClose={onClose} slotProps={{ list: { 'aria-label': filterMenu === 'type' ? '类型筛选菜单' : '时间筛选菜单' } }}>
      {filterMenu === 'type' && (
        <>
          <MenuItem onClick={() => { setTypeFilter('all'); onClose() }}><FileIcon fontSize="small" sx={{ mr: 1 }} />全部类型</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('doc'); onClose() }}><FileIcon fontSize="small" sx={{ mr: 1, color: '#5f6368' }} />文档</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('sheet'); onClose() }}><FileIcon fontSize="small" sx={{ mr: 1, color: '#0f9d58' }} />电子表格</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('slide'); onClose() }}><FileIcon fontSize="small" sx={{ mr: 1, color: '#f9ab00' }} />演示文稿</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('image'); onClose() }}><ImageIcon fontSize="small" sx={{ mr: 1, color: '#1a73e8' }} />照片和图片</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('pdf'); onClose() }}><PdfIcon fontSize="small" sx={{ mr: 1, color: '#d93025' }} />PDF</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('video'); onClose() }}><VideoIcon fontSize="small" sx={{ mr: 1, color: '#9334e6' }} />视频</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('archive'); onClose() }}><ArchiveIcon fontSize="small" sx={{ mr: 1, color: '#5f6368' }} />归档（ZIP）</MenuItem>
          <MenuItem onClick={() => { setTypeFilter('audio'); onClose() }}><AudioIcon fontSize="small" sx={{ mr: 1, color: '#188038' }} />音频</MenuItem>
        </>
      )}
      {filterMenu === 'time' && (
        <>
          <MenuItem onClick={() => { setTimeFilter('all'); onClose() }}>全部时间</MenuItem>
          <MenuItem onClick={() => { setTimeFilter('today'); onClose() }}>今天</MenuItem>
          <MenuItem onClick={() => { setTimeFilter('7d'); onClose() }}>过去 7 天</MenuItem>
          <MenuItem onClick={() => { setTimeFilter('30d'); onClose() }}>过去 30 天</MenuItem>
          <MenuItem onClick={() => { setTimeFilter('thisYear'); onClose() }}>今年</MenuItem>
          <MenuItem onClick={() => { setTimeFilter('lastYear'); onClose() }}>去年</MenuItem>
        </>
      )}
    </Menu>
  )
}
