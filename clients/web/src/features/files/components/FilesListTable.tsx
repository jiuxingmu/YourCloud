import { Fragment } from 'react'
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { DownloadLineIcon, MoreIcon, ShareLineIcon } from '../../../shared/icons/YourCloudIcons'
import { canDownloadFile, formatDisplayFileSize, formatModified, getBaseName, type FileItem, type FileSection } from '../domain'
import { FileTypeBadge } from './FileTypeBadge'

type Props = {
  section: FileSection
  items: FileItem[]
  recommendedFiles: FileItem[]
  recentGroups: { today: FileItem[]; lastMonth: FileItem[]; earlier: FileItem[] }
  downloadingId: number | null
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, file: FileItem) => void
  onOpenFolder: (file: FileItem) => void
}

export function FilesListTable({ section, items, recommendedFiles, recentGroups, downloadingId, onDownload, onShare, onOpenMenu, onOpenFolder }: Props) {
  const unifiedTableSx = {
    tableLayout: 'fixed',
    '& .MuiTableCell-root': { px: 1.5, py: 1, whiteSpace: 'nowrap' },
    '& .MuiTableHead-root .MuiTableCell-root': { fontWeight: 600, color: 'text.secondary', borderBottomColor: '#e6eaf0' },
  }
  const headerCellSx = { width: '20%' }

  function renderRowActions(file: FileItem) {
    return (
      <>
        {canDownloadFile(file) && (
          <>
            <Button size="small" onClick={() => onDownload(file)} disabled={downloadingId === file.id}>
              下载
            </Button>
            <Button size="small" onClick={() => onShare(file)}>
              分享
            </Button>
          </>
        )}
        <IconButton size="small" aria-label={`打开文件操作菜单：${getBaseName(file.filename)}`} onClick={(e) => onOpenMenu(e, file)}>
          <MoreIcon fontSize="small" />
        </IconButton>
      </>
    )
  }

  function renderRows(rowItems: FileItem[], locationLabel = '我的云端硬盘') {
    return rowItems.map((file) => (
      <TableRow key={file.id} hover>
        <TableCell sx={{ maxWidth: 460 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: section === 'drive' && file.mimeType === 'inode/directory' ? 'pointer' : 'default' }}
            onClick={() => {
              if (section === 'drive' && file.mimeType === 'inode/directory') onOpenFolder(file)
            }}
          >
            <FileTypeBadge file={file} />
            <Typography noWrap>{section === 'drive' ? getBaseName(file.filename) : file.filename}</Typography>
          </Box>
        </TableCell>
        <TableCell>{formatModified(file.updatedAt ?? file.createdAt)}</TableCell>
        <TableCell>{formatDisplayFileSize(file)}</TableCell>
        <TableCell>{locationLabel}</TableCell>
        <TableCell align="right">{renderRowActions(file)}</TableCell>
      </TableRow>
    ))
  }

  return (
    <Table size="small" sx={unifiedTableSx}>
      <TableHead>
        <TableRow>
          <TableCell sx={headerCellSx}>名称</TableCell>
          <TableCell sx={headerCellSx}>修改时间</TableCell>
          <TableCell sx={headerCellSx}>文件大小</TableCell>
          <TableCell sx={headerCellSx}>位置</TableCell>
          <TableCell sx={headerCellSx} align="right">
            操作
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {section === 'recent'
          ? ([['今天', recentGroups.today], ['上个月', recentGroups.lastMonth], ['更早', recentGroups.earlier]] as Array<[string, FileItem[]]>).map(([label, group]) => (
              <Fragment key={label}>
                {group.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {renderRows(group)}
              </Fragment>
            ))
          : renderRows(section === 'home' ? recommendedFiles : items)}
      </TableBody>
    </Table>
  )
}
