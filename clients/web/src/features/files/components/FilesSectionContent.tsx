import type { ReactNode } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { FolderPlusIcon } from '../../../shared/icons/YourCloudIcons'
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
  recommendedFolder: string
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
    recommendedFolder,
    currentDrivePath,
    setCurrentDrivePath,
    deletedItems,
    clearDeletedItems,
    showFeedback,
    shouldUseTopRightViewSwitch,
    setViewMode,
  } = props

  if (!loading && section === 'home') {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Typography sx={{ fontSize: 34, fontWeight: 500 }}>欢迎使用云端硬盘</Typography>
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>建议的文件夹</Typography>
          <Card variant="outlined" sx={{ maxWidth: 360, borderRadius: 0, borderColor: '#e6eaf0' }}>
            <CardContent sx={{ py: 1.4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <FolderPlusIcon fontSize="small" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {recommendedFolder}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    位于「我的云端硬盘」
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>建议的文件</Typography>
            {shouldUseTopRightViewSwitch(section) ? <ViewModeSwitch viewMode={viewMode} onChange={setViewMode} /> : null}
          </Box>
          {viewMode === 'grid' ? renderGridView : renderListView}
        </Box>
      </Box>
    )
  }

  if (!loading && section === 'trash') {
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
        {deletedItems.length === 0 ? (
          <Typography color="text.secondary">暂无记录</Typography>
        ) : (
          <Stack spacing={1}>
            {deletedItems.map((item) => (
              <Box key={`${item.id}-${item.deletedAt}`} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef1f4', pb: 0.8 }}>
                <Typography>{item.filename}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatModified(item.deletedAt)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
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
        {!loading && filteredCount === 0 ? (
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

  if (!loading && filteredCount === 0) {
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
