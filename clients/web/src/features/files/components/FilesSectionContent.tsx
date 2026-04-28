import type { ReactNode } from 'react'
import { Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ViewModeSwitch } from './ViewModeSwitch'
import { formatModified, getTrashClearFeedbackText, type DeletedItem, type FileSection } from '../domain'

type Props = {
  section: FileSection
  loading: boolean
  filteredCount: number
  viewMode: 'grid' | 'list'
  renderGridView: ReactNode
  renderListView: ReactNode
  filterAndViewControls: ReactNode
  currentDrivePath: string
  setCurrentDrivePath: (path: string) => void
  deletedItems: DeletedItem[]
  clearDeletedItems: () => void
  showFeedback: (type: 'success' | 'error', text: string) => void
  shouldUseTopRightViewSwitch: (section: FileSection) => boolean
  setViewMode: (mode: 'grid' | 'list') => void
}

export function FilesSectionContent(props: Props) {
  const {
    section,
    loading,
    filteredCount,
    viewMode,
    renderGridView,
    renderListView,
    filterAndViewControls,
    currentDrivePath,
    setCurrentDrivePath,
    deletedItems,
    clearDeletedItems,
    showFeedback,
    shouldUseTopRightViewSwitch,
    setViewMode,
  } = props

  if (!loading && section === 'trash') {
    const trashHeaderCellSx = { width: '50%' }
    return (
      <Box sx={{ p: 2 }}>
        <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600 }}>回收站（本地删除记录）</Typography>
          <Button
            size="small"
            onClick={() => {
              const message = getTrashClearFeedbackText(deletedItems)
              clearDeletedItems()
              showFeedback('success', message)
            }}
          >
            清空记录
          </Button>
        </Stack>
        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            '& .MuiTableCell-root': { px: 1.5, py: 1, whiteSpace: 'nowrap' },
            '& .MuiTableHead-root .MuiTableCell-root': { fontWeight: 600, color: 'text.secondary', borderBottomColor: '#e6eaf0' },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={trashHeaderCellSx}>名称</TableCell>
              <TableCell sx={trashHeaderCellSx}>删除时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deletedItems.map((item) => (
              <TableRow key={`${item.id}-${item.deletedAt}`}>
                <TableCell>{item.filename}</TableCell>
                <TableCell>{formatModified(item.deletedAt)}</TableCell>
              </TableRow>
            ))}
            {deletedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography color="text.secondary">暂无记录</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    )
  }

  if (section === 'recent') {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 500 }}>最近用过</Typography>
        {filterAndViewControls}
        {viewMode === 'grid' ? renderGridView : renderListView}
      </Box>
    )
  }

  if (section === 'drive') {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Button size="large" onClick={() => setCurrentDrivePath('')} sx={{ fontSize: 34, fontWeight: 500, px: 0, minWidth: 0, lineHeight: 1.2 }}>
              我的云端硬盘
            </Button>
            {currentDrivePath && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 24, lineHeight: 1 }}>›</Typography>
                {currentDrivePath.split('/').map((segment, idx, arr) => {
                  const path = arr.slice(0, idx + 1).join('/')
                  const isLast = idx === arr.length - 1
                  return (
                    <Button key={path} size="large" onClick={() => setCurrentDrivePath(path)} disabled={isLast} sx={{ px: 0.5, minWidth: 0, fontSize: 24, fontWeight: isLast ? 500 : 400, lineHeight: 1.2 }}>
                      {segment}
                    </Button>
                  )
                })}
              </Box>
            )}
          </Box>
        </Box>
        {filterAndViewControls}
        {!loading && filteredCount === 0 && viewMode === 'grid' ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>没有匹配的文件</Typography>
            <Typography color="text.secondary">尝试更换关键词，或点击“上传文件”创建内容。</Typography>
          </Box>
        ) : viewMode === 'grid' ? (
          renderGridView
        ) : (
          renderListView
        )}
      </Box>
    )
  }

  if (!loading && filteredCount === 0 && viewMode === 'grid') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>没有匹配的文件</Typography>
        <Typography color="text.secondary">尝试更换关键词，或点击“上传文件”创建内容。</Typography>
      </Box>
    )
  }

  return viewMode === 'grid' ? (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{shouldUseTopRightViewSwitch(section) ? <ViewModeSwitch viewMode={viewMode} onChange={setViewMode} /> : null}</Box>
      {renderGridView}
    </Box>
  ) : (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{shouldUseTopRightViewSwitch(section) ? <ViewModeSwitch viewMode={viewMode} onChange={setViewMode} /> : null}</Box>
      {renderListView}
    </Box>
  )
}
