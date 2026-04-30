import { Fragment } from 'react'
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { getBaseName } from '@yourcloud/sdk'
import { DownloadLineIcon, MoreIcon, ShareLineIcon } from '../../../shared/icons/YourCloudIcons'
import { canDownloadFile, formatDisplayFileSize, formatModified, type FileItem, type FileSection } from '../domain'
import { FileTypeBadge } from './FileTypeBadge'

type Props = {
  section: FileSection
  items: FileItem[]
  recentGroups: { today: FileItem[]; past7Days: FileItem[]; past30Days: FileItem[]; thisYear: FileItem[]; lastYear: FileItem[]; earlier: FileItem[] }
  downloadingId: number | null
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, file: FileItem) => void
  onOpenFolder: (file: FileItem) => void
}

export function FilesListTable({ section, items, recentGroups, downloadingId, onDownload, onShare, onOpenMenu, onOpenFolder }: Props) {
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
            <Button size="small" startIcon={<DownloadLineIcon fontSize="small" />} onClick={() => onDownload(file)} disabled={downloadingId === file.id}>
              下载
            </Button>
            <Button size="small" startIcon={<ShareLineIcon fontSize="small" />} onClick={() => onShare(file)}>
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
          ? (
              [
                ['今天', recentGroups.today],
                ['过去 7 天', recentGroups.past7Days],
                ['过去 30 天', recentGroups.past30Days],
                ['今年', recentGroups.thisYear],
                ['去年', recentGroups.lastYear],
                ['更早', recentGroups.earlier],
              ] as Array<[string, FileItem[]]>
            ).map(([label, group]) => (
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
          : renderRows(items)}
      </TableBody>
    </Table>
  )
}
