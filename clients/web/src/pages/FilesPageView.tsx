import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from 'react'
import { Alert, Box, Button, IconButton, Paper, Snackbar, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { FilesDialogs } from '../features/files/components/FilesDialogs'
import { FilesFilterBar } from '../features/files/components/FilesFilterBar'
import { FilesGrid } from '../features/files/components/FilesGrid'
import { FilesListTable } from '../features/files/components/FilesListTable'
import { FileActionMenu, FileFilterMenu } from '../features/files/components/FilesMenus'
import { FilesSectionContent } from '../features/files/components/FilesSectionContent'
import type { DeletedItem, FileItem, FileSection, TimeFilter, TypeFilter } from '../features/files/domain'
import { CopyIcon, FolderPlusIcon, RefreshLineIcon, UploadIcon } from '../shared/icons/YourCloudIcons'

type FeedbackState = { type: 'success' | 'error'; text: string } | null
type FilterMenu = 'type' | 'time' | null
type ViewMode = 'grid' | 'list'

type FileActionsViewModel = {
  downloadingId: number | null
  shareLink: string
  actionAnchor: null | HTMLElement
  actionFile: FileItem | null
  folderDialogOpen: boolean
  folderPathInput: string
  moveDialogOpen: boolean
  moveFilenameInput: string
  deleteDialogOpen: boolean
  deleteTargetFile: FileItem | null
  setFolderDialogOpen: (open: boolean) => void
  setFolderPathInput: (path: string) => void
  setMoveDialogOpen: (open: boolean) => void
  setMoveFilenameInput: (path: string) => void
  setDeleteDialogOpen: (open: boolean) => void
  openActionMenu: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  closeActionMenu: () => void
  requestDeleteFile: (file: FileItem) => void
  requestMoveFile: (file: FileItem) => void
  confirmDeleteFile: () => Promise<void>
  confirmMoveFile: () => Promise<void>
  confirmCreateFolder: () => Promise<void>
  toggleStar: (file: FileItem) => void
  createFileShare: (file: FileItem) => Promise<void>
  copyShareLink: () => Promise<void>
  download: (file: FileItem) => Promise<void>
}

type Props = {
  section: FileSection
  loading: boolean
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  handleUploadChange: (event: ChangeEvent<HTMLInputElement>) => void
  load: () => Promise<void>
  filteredFiles: FileItem[]
  recommendedFiles: FileItem[]
  recentGroups: { today: FileItem[]; lastMonth: FileItem[]; earlier: FileItem[] }
  openFolder: (file: FileItem) => void
  recommendedFolder: string
  currentDrivePath: string
  setCurrentDrivePath: (path: string) => void
  deletedItems: DeletedItem[]
  clearDeletedItems: () => void
  showFeedback: (type: 'success' | 'error', text: string) => void
  shouldShowCreateActions: (section: FileSection) => boolean
  shouldUseTopRightViewSwitch: (section: FileSection) => boolean
  feedback: FeedbackState
  setFeedback: (next: FeedbackState) => void
  actions: FileActionsViewModel
  starredIds: number[]
  filterMenu: FilterMenu
  filterAnchor: null | HTMLElement
  openFilterMenu: (menu: 'type' | 'time', event: MouseEvent<HTMLElement>) => void
  closeFilterMenu: () => void
  setTypeFilter: Dispatch<SetStateAction<TypeFilter>>
  setTimeFilter: Dispatch<SetStateAction<TimeFilter>>
}

export default function FilesPageView(props: Props) {
  const {
    section,
    loading,
    viewMode,
    setViewMode,
    handleUploadChange,
    load,
    filteredFiles,
    recommendedFiles,
    recentGroups,
    openFolder,
    recommendedFolder,
    currentDrivePath,
    setCurrentDrivePath,
    deletedItems,
    clearDeletedItems,
    showFeedback,
    shouldShowCreateActions,
    shouldUseTopRightViewSwitch,
    feedback,
    setFeedback,
    actions,
    starredIds,
    filterMenu,
    filterAnchor,
    openFilterMenu,
    closeFilterMenu,
    setTypeFilter,
    setTimeFilter,
  } = props

  const filterAndViewControls = (
    <FilesFilterBar
      onOpenTypeFilter={(event) => openFilterMenu('type', event)}
      onOpenTimeFilter={(event) => openFilterMenu('time', event)}
      showViewSwitch={shouldUseTopRightViewSwitch(section)}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  )

  const renderListView = (
    <FilesListTable
      section={section}
      items={filteredFiles}
      recommendedFiles={recommendedFiles}
      recentGroups={recentGroups}
      downloadingId={actions.downloadingId}
      onDownload={actions.download}
      onShare={actions.createFileShare}
      onOpenMenu={actions.openActionMenu}
      onOpenFolder={openFolder}
    />
  )

  const renderGridView = (
    <FilesGrid
      section={section}
      items={filteredFiles}
      downloadingId={actions.downloadingId}
      onOpenFolder={openFolder}
      onDownload={actions.download}
      onShare={actions.createFileShare}
      onOpenMenu={actions.openActionMenu}
    />
  )

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, borderColor: '#dfe3e8', backgroundColor: '#fff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
          {(section === 'drive' || section === 'trash') && (
            <>
              {shouldShowCreateActions(section) && (
                <>
                  <Button variant="contained" startIcon={<UploadIcon />} component="label" sx={{ borderRadius: 0, px: 2.5 }}>
                    新建文件
                    <input hidden type="file" onChange={handleUploadChange} />
                  </Button>
                  <Button variant="outlined" startIcon={<FolderPlusIcon />} onClick={() => actions.setFolderDialogOpen(true)}>
                    新建文件夹
                  </Button>
                </>
              )}
              <Button variant="outlined" startIcon={<RefreshLineIcon />} onClick={() => void load()} disabled={loading}>
                刷新
              </Button>
            </>
          )}
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            正在加载文件...
          </Typography>
        )}

        <FilesSectionContent
          section={section}
          loading={loading}
          filteredCount={filteredFiles.length}
          viewMode={viewMode}
          renderGridView={renderGridView}
          renderListView={renderListView}
          filterAndViewControls={filterAndViewControls}
          recommendedFolder={recommendedFolder}
          currentDrivePath={currentDrivePath}
          setCurrentDrivePath={setCurrentDrivePath}
          deletedItems={deletedItems}
          clearDeletedItems={clearDeletedItems}
          showFeedback={showFeedback}
          shouldUseTopRightViewSwitch={shouldUseTopRightViewSwitch}
          setViewMode={setViewMode}
        />

        {actions.shareLink && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={actions.shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
            <Tooltip title="复制链接">
              <IconButton aria-label="复制分享链接" onClick={() => void actions.copyShareLink()}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>

      <FileActionMenu
        anchorEl={actions.actionAnchor}
        actionFile={actions.actionFile}
        starredIds={starredIds}
        onClose={actions.closeActionMenu}
        onRequestMove={actions.requestMoveFile}
        onRequestDelete={actions.requestDeleteFile}
        onToggleStar={actions.toggleStar}
      />
      <FileFilterMenu anchorEl={filterAnchor} filterMenu={filterMenu} onClose={closeFilterMenu} setTypeFilter={setTypeFilter} setTimeFilter={setTimeFilter} />
      <FilesDialogs
        folderDialogOpen={actions.folderDialogOpen}
        folderPathInput={actions.folderPathInput}
        setFolderDialogOpen={actions.setFolderDialogOpen}
        setFolderPathInput={actions.setFolderPathInput}
        onConfirmCreateFolder={() => void actions.confirmCreateFolder()}
        moveDialogOpen={actions.moveDialogOpen}
        moveFilenameInput={actions.moveFilenameInput}
        setMoveDialogOpen={actions.setMoveDialogOpen}
        setMoveFilenameInput={actions.setMoveFilenameInput}
        onConfirmMove={() => void actions.confirmMoveFile()}
        deleteDialogOpen={actions.deleteDialogOpen}
        deleteTargetFile={actions.deleteTargetFile}
        setDeleteDialogOpen={actions.setDeleteDialogOpen}
        onConfirmDelete={() => void actions.confirmDeleteFile()}
      />
      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {feedback ? (
          <Alert onClose={() => setFeedback(null)} closeText="关闭" severity={feedback.type} variant="filled" sx={{ width: '100%' }}>
            {feedback.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}
