import { useEffect, useState } from 'react'
import { Alert, Box, Button, IconButton, Paper, Snackbar, Stack, TextField, Typography, Tooltip } from '@mui/material'
import { toUserFriendlyErrorMessage } from '../apiClient'
import FilePreview from '../components/FilePreview'
import { FileTypeBadge } from '../features/files/components/FileTypeBadge'
import { FilesDialogs } from '../features/files/components/FilesDialogs'
import { FilesFilterBar } from '../features/files/components/FilesFilterBar'
import { FilesGrid } from '../features/files/components/FilesGrid'
import { FilesListTable } from '../features/files/components/FilesListTable'
import { FileActionMenu, FileFilterMenu } from '../features/files/components/FilesMenus'
import { FilesSectionContent } from '../features/files/components/FilesSectionContent'
import { ViewModeSwitch } from '../features/files/components/ViewModeSwitch'
import { onStarredCleared, onTrashCleared } from '../features/files/data/filesEvents'
import { readDeletedItems, readStarredIds, writeDeletedItems, writeStarredIds } from '../features/files/data/filesStorage'
import {
  canDownloadFile as canDownloadFileRule,
  formatDisplayFileSize as formatDisplayFileSizeRule,
  getDeleteDialogDescription as getDeleteDialogDescriptionRule,
  getDeleteDialogTitle as getDeleteDialogTitleRule,
  getDeleteFeedbackText as getDeleteFeedbackTextRule,
  getTrashClearFeedbackText as getTrashClearFeedbackTextRule,
  isDirectoryItem,
  shouldShowCreateActions as shouldShowCreateActionsRule,
} from '../features/files/domain/rules'
import { deriveDriveItems as deriveDriveItemsSelector, formatModified, getRelativeBucket, matchesTimeFilter, matchesTypeFilter, mergeVirtualAndRemoteFiles as mergeVirtualAndRemoteFilesSelector } from '../features/files/domain/selectors'
import { getBaseName, normalizePath } from '../features/files/domain/path'
import { getDefaultViewModeForSection as getDefaultViewModeForSectionRule, shouldUseTopRightViewSwitch as shouldUseTopRightViewSwitchRule } from '../features/files/domain/viewMode'
import type { DeletedItem, FileItem, FileSection as Section, TimeFilter, TypeFilter } from '../features/files/domain/types'
import { useDriveNavigation } from '../features/files/hooks/useDriveNavigation'
import { useFileActions } from '../features/files/hooks/useFileActions'
import { useFilesData } from '../features/files/hooks/useFilesData'
import { useFilesFilters } from '../features/files/hooks/useFilesFilters'
import { useViewModeBySection } from '../features/files/hooks/useViewModeBySection'
import { CopyIcon, FolderPlusIcon, RefreshLineIcon, UploadIcon } from '../shared/icons/YourCloudIcons'

type Props = { searchQuery?: string; section?: Section }

export function getDefaultViewModeForSection(section: Section): 'grid' | 'list' {
  return getDefaultViewModeForSectionRule(section)
}

export function shouldUseTopRightViewSwitch(section: Section): boolean {
  return shouldUseTopRightViewSwitchRule(section)
}

export function shouldShowCreateActions(section: Section): boolean {
  return shouldShowCreateActionsRule(section)
}

export function getDeleteDialogTitle(file: FileItem | null): string {
  return getDeleteDialogTitleRule(file)
}

export function getDeleteDialogDescription(file: FileItem | null): string {
  return getDeleteDialogDescriptionRule(file)
}

export function getDeleteFeedbackText(file: FileItem): string {
  return getDeleteFeedbackTextRule(file)
}

export function getTrashClearFeedbackText(deletedItems: DeletedItem[]): string {
  return getTrashClearFeedbackTextRule(deletedItems)
}

export function canDownloadFile(file: FileItem): boolean {
  return canDownloadFileRule(file)
}

export function formatDisplayFileSize(file: FileItem): string {
  return formatDisplayFileSizeRule(file)
}

export function deriveDriveItems(files: FileItem[], currentPath: string): FileItem[] {
  return deriveDriveItemsSelector(files, currentPath)
}

export function mergeVirtualAndRemoteFiles(virtualFolders: FileItem[], remoteFiles: FileItem[]): FileItem[] {
  return mergeVirtualAndRemoteFilesSelector(virtualFolders, remoteFiles)
}


export default function FilesPage({ searchQuery = '', section = 'home' }: Props) {
  const [starredIds, setStarredIds] = useState<number[]>(() => readStarredIds())
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>(() => readDeletedItems())
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { viewMode, setViewMode } = useViewModeBySection(section)
  const { currentDrivePath, setCurrentDrivePath, openFolder } = useDriveNavigation(section)
  const dialogPaperSx = { borderRadius: 0, border: '1px solid #dfe3e8', minWidth: 560 }

  function showFeedback(type: 'success' | 'error', text: string) {
    setFeedback({ type, text })
  }

  function persistStarred(next: number[]) {
    setStarredIds(next)
    writeStarredIds(next)
  }

  function persistDeleted(next: DeletedItem[]) {
    setDeletedItems(next)
    writeDeletedItems(next)
  }

  const { files, setFiles, virtualFolders, setVirtualFolders, virtualFoldersRef, loading, load, upload } = useFilesData(
    showFeedback,
    (error) => toUserFriendlyErrorMessage(error, 'files'),
  )

  useEffect(() => {
    function handleStarredCleared() {
      setStarredIds([])
    }
    function handleTrashCleared() {
      setDeletedItems([])
    }
    const offStarred = onStarredCleared(handleStarredCleared as EventListener)
    const offTrash = onTrashCleared(handleTrashCleared as EventListener)
    return () => {
      offStarred()
      offTrash()
    }
  }, [])

  function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (file) void upload(file)
    input.value = ''
  }

  const actions = useFileActions({
    showFeedback,
    toErrorMessage: (error) => toUserFriendlyErrorMessage(error, 'files'),
    canDownloadFile,
    load,
    deletedItems,
    persistDeleted,
    starredIds,
    persistStarred,
    setVirtualFolders,
    setFiles,
    virtualFoldersRef,
  })

  const sectionFiles =
    section === 'starred'
      ? files.filter((f) => starredIds.includes(f.id))
      : section === 'recent'
        ? [...files].sort((a, b) => +new Date(b.updatedAt ?? b.createdAt ?? 0) - +new Date(a.updatedAt ?? a.createdAt ?? 0))
        : section === 'drive'
          ? deriveDriveItems(files, currentDrivePath)
        : files
  const { typeFilter, setTypeFilter, timeFilter, setTimeFilter, filterMenu, filterAnchor, openFilterMenu, closeFilterMenu, filteredFiles } = useFilesFilters(
    sectionFiles,
    searchQuery,
  )
  const recentGroups = {
    today: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'today'),
    lastMonth: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'lastMonth'),
    earlier: filteredFiles.filter((f) => getRelativeBucket(f.updatedAt ?? f.createdAt) === 'earlier'),
  }
  const recommendedFiles = [...files].sort((a, b) => +new Date(b.updatedAt ?? b.createdAt ?? 0) - +new Date(a.updatedAt ?? a.createdAt ?? 0)).slice(0, 4)
  const recommendedFolder = files.find((f) => f.filename.includes('/'))?.filename.split('/')[0] || (files[0]?.filename.replace(/\.[^/.]+$/, '') || '示例文件夹')
  const filterAndViewControls = (
    <FilesFilterBar
      onOpenTypeFilter={(e) => openFilterMenu('type', e)}
      onOpenTimeFilter={(e) => openFilterMenu('time', e)}
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
              <Button variant="outlined" startIcon={<RefreshLineIcon />} onClick={load} disabled={loading}>
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
          clearDeletedItems={() => persistDeleted([])}
          showFeedback={showFeedback}
          shouldUseTopRightViewSwitch={shouldUseTopRightViewSwitch}
          setViewMode={setViewMode}
        />

        {actions.shareLink && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField size="small" fullWidth value={actions.shareLink} slotProps={{ htmlInput: { readOnly: true } }} />
            <Tooltip title="复制链接">
              <IconButton aria-label="复制分享链接" onClick={actions.copyShareLink}>
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
