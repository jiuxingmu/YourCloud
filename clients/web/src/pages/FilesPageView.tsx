import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from 'react'
import { Alert, Box, Button, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { FilesDialogs } from '../features/files/components/FilesDialogs'
import { FilesFilterBar } from '../features/files/components/FilesFilterBar'
import { FilesGrid } from '../features/files/components/FilesGrid'
import { FilesListTable } from '../features/files/components/FilesListTable'
import { FileActionMenu, FileFilterMenu } from '../features/files/components/FilesMenus'
import { FilesSectionContent } from '../features/files/components/FilesSectionContent'
import type { DeletedItem, FileItem, FileSection, TimeFilter, TypeFilter } from '../features/files/domain'
import type { WebUploadProgress } from '../features/files/hooks/useFilesData'
import { formatBytes, formatBytesPerSec } from '../shared/formatBytes'
import { FolderPlusIcon, RefreshLineIcon, UploadIcon } from '../shared/icons/YourCloudIcons'

type FeedbackState = { type: 'success' | 'error'; text: string } | null
type FilterMenu = 'type' | 'time' | null
type ViewMode = 'grid' | 'list'

type FileActionsViewModel = {
  downloadingId: number | null
  shareLink: string
  shareToken: string
  shareQrUrl: string
  shareCreating: boolean
  shareExpiresAt: string | null
  shareDialogOpen: boolean
  shareExpireDays: number
  shareExtractCode: string
  shareSourceFile: FileItem | null
  actionAnchor: null | HTMLElement
  actionFile: FileItem | null
  folderDialogOpen: boolean
  folderPathInput: string
  moveDialogOpen: boolean
  moveTargetFolderPath: string
  deleteDialogOpen: boolean
  deleteTargetFile: FileItem | null
  setShareDialogOpen: (open: boolean) => void
  setShareExpireDays: (value: number) => void
  setShareExtractCode: (value: string) => void
  setFolderDialogOpen: (open: boolean) => void
  setFolderPathInput: (path: string) => void
  setMoveDialogOpen: (open: boolean) => void
  setMoveTargetFolderPath: (path: string) => void
  setDeleteDialogOpen: (open: boolean) => void
  openActionMenu: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  closeActionMenu: () => void
  requestDeleteFile: (file: FileItem) => void
  requestMoveFile: (file: FileItem) => void
  confirmDeleteFile: () => Promise<void>
  confirmMoveFile: () => Promise<void>
  confirmCreateFolder: () => Promise<void>
  toggleStar: (file: FileItem) => void
  requestShareFile: (file: FileItem) => void
  createFileShare: () => Promise<void>
  copyShareLink: () => Promise<void>
  download: (file: FileItem) => Promise<void>
}

type Props = {
  section: FileSection
  loading: boolean
  uploading: boolean
  uploadProgress: WebUploadProgress
  uploadingFilename: string
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  handleUploadChange: (event: ChangeEvent<HTMLInputElement>) => void
  load: () => Promise<void>
  filteredFiles: FileItem[]
  recentGroups: { today: FileItem[]; past7Days: FileItem[]; past30Days: FileItem[]; thisYear: FileItem[]; lastYear: FileItem[]; earlier: FileItem[] }
  openFolder: (file: FileItem) => void
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
  moveFolderOptions: string[]
}

export default function FilesPageView(props: Props) {
  const {
    section,
    loading,
    uploading,
    uploadProgress,
    uploadingFilename,
    viewMode,
    setViewMode,
    handleUploadChange,
    load,
    filteredFiles,
    recentGroups,
    openFolder,
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
    moveFolderOptions,
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
      recentGroups={recentGroups}
      downloadingId={actions.downloadingId}
      onDownload={actions.download}
      onShare={actions.requestShareFile}
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
      onShare={actions.requestShareFile}
      onOpenMenu={actions.openActionMenu}
    />
  )

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Paper variant="outlined" sx={{ borderRadius: 0, p: 2, borderColor: '#dfe3e8', backgroundColor: '#fff' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
          {section === 'drive' && (
            <>
              {shouldShowCreateActions(section) && (
                <>
                  <Button variant="contained" startIcon={<UploadIcon />} component="label" sx={{ borderRadius: 0, px: 2.5 }}>
                    上传文件
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
        {uploading && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.5 }}>
              正在上传：{uploadingFilename || '文件'}
              {uploadProgress.total > 0
                ? ` · ${formatBytes(uploadProgress.loaded)} / ${formatBytes(uploadProgress.total)}（${uploadProgress.percent}%）`
                : uploadProgress.loaded > 0
                  ? ` · 已上传 ${formatBytes(uploadProgress.loaded)}`
                  : ` · ${uploadProgress.percent}%`}
              {uploadProgress.speedBps !== null && uploadProgress.speedBps > 0
                ? ` · ${formatBytesPerSec(uploadProgress.speedBps)}`
                : null}
            </Typography>
            <Box sx={{ mt: 0.6, height: 6, borderRadius: 3, bgcolor: '#e8ecf3', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${uploadProgress.percent}%`,
                  height: '100%',
                  bgcolor: '#1a73e8',
                  transition: 'width .2s ease',
                }}
              />
            </Box>
          </Box>
        )}

        <FilesSectionContent
          section={section}
          loading={loading}
          filteredCount={filteredFiles.length}
          viewMode={viewMode}
          renderGridView={renderGridView}
          renderListView={renderListView}
          filterAndViewControls={filterAndViewControls}
          currentDrivePath={currentDrivePath}
          setCurrentDrivePath={setCurrentDrivePath}
          deletedItems={deletedItems}
          clearDeletedItems={clearDeletedItems}
          showFeedback={showFeedback}
          shouldUseTopRightViewSwitch={shouldUseTopRightViewSwitch}
          setViewMode={setViewMode}
        />
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
        moveTargetFolderPath={actions.moveTargetFolderPath}
        moveFolderOptions={moveFolderOptions}
        setMoveDialogOpen={actions.setMoveDialogOpen}
        setMoveTargetFolderPath={actions.setMoveTargetFolderPath}
        onConfirmMove={() => void actions.confirmMoveFile()}
        deleteDialogOpen={actions.deleteDialogOpen}
        deleteTargetFile={actions.deleteTargetFile}
        setDeleteDialogOpen={actions.setDeleteDialogOpen}
        onConfirmDelete={() => void actions.confirmDeleteFile()}
        shareDialogOpen={actions.shareDialogOpen}
        shareSourceFile={actions.shareSourceFile}
        shareExpireDays={actions.shareExpireDays}
        setShareExpireDays={actions.setShareExpireDays}
        shareExtractCode={actions.shareExtractCode}
        setShareExtractCode={actions.setShareExtractCode}
        shareLink={actions.shareLink}
        shareToken={actions.shareToken}
        shareQrUrl={actions.shareQrUrl}
        shareCreating={actions.shareCreating}
        shareExpiresAt={actions.shareExpiresAt}
        setShareDialogOpen={actions.setShareDialogOpen}
        onConfirmCreateShare={() => void actions.createFileShare()}
        onCopyShareLink={() => void actions.copyShareLink()}
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
