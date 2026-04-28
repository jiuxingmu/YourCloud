import { useEffect, useState, type ChangeEvent } from 'react'
import { toUserFriendlyErrorMessage } from '../apiClient'
import { onStarredCleared, onTrashCleared } from '../features/files/data/filesEvents'
import { readDeletedItems, readStarredIds, writeDeletedItems, writeStarredIds } from '../features/files/data/filesStorage'
import { canDownloadFile, deriveDriveItems, getParentPath, matchesTimeFilter, normalizePath, shouldShowCreateActions, shouldUseTopRightViewSwitch, type DeletedItem } from '../features/files/domain'
import { useDriveNavigation } from '../features/files/hooks/useDriveNavigation'
import { useFileActions } from '../features/files/hooks/useFileActions'
import { useFilesData } from '../features/files/hooks/useFilesData'
import { useFilesFilters } from '../features/files/hooks/useFilesFilters'
import { useViewModeBySection } from '../features/files/hooks/useViewModeBySection'
import type { FilesPageProps } from './FilesPage'
import FilesPageView from './FilesPageView'

export default function FilesPageContainer({ searchQuery = '', section = 'drive' }: FilesPageProps) {
  const [starredIds, setStarredIds] = useState<number[]>(() => readStarredIds())
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>(() => readDeletedItems())
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { viewMode, setViewMode } = useViewModeBySection(section)
  const { currentDrivePath, setCurrentDrivePath, openFolder } = useDriveNavigation(section)

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

  const { files, setFiles, setVirtualFolders, virtualFoldersRef, loading, load, upload } = useFilesData(
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

  function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (file) {
      const uploadPath = section === 'drive' ? currentDrivePath : ''
      void upload(file, uploadPath)
    }
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
    currentDrivePath,
  })

  const sectionFiles =
    section === 'starred'
      ? files.filter((file) => starredIds.includes(file.id))
      : section === 'recent'
        ? [...files].sort((a, b) => +new Date(b.updatedAt ?? b.createdAt ?? 0) - +new Date(a.updatedAt ?? a.createdAt ?? 0))
        : section === 'drive'
          ? deriveDriveItems(files, currentDrivePath)
          : files

  const { setTypeFilter, setTimeFilter, filterMenu, filterAnchor, openFilterMenu, closeFilterMenu, filteredFiles } = useFilesFilters(sectionFiles, searchQuery)

  const recentGroups = {
    today: filteredFiles.filter((file) => matchesTimeFilter(file, 'today')),
    past7Days: filteredFiles.filter((file) => matchesTimeFilter(file, '7d') && !matchesTimeFilter(file, 'today')),
    past30Days: filteredFiles.filter((file) => matchesTimeFilter(file, '30d') && !matchesTimeFilter(file, '7d')),
    thisYear: filteredFiles.filter((file) => matchesTimeFilter(file, 'thisYear') && !matchesTimeFilter(file, '30d')),
    lastYear: filteredFiles.filter((file) => matchesTimeFilter(file, 'lastYear')),
    earlier: filteredFiles.filter((file) => {
      const raw = file.updatedAt ?? file.createdAt
      if (!raw) return true
      const date = new Date(raw)
      if (Number.isNaN(date.getTime())) return true
      return !matchesTimeFilter(file, 'thisYear') && !matchesTimeFilter(file, 'lastYear')
    }),
  }
  const moveFolderOptions = Array.from(
    files.reduce((acc, file) => {
      const normalized = normalizePath(file.filename)
      if (!normalized) return acc
      if (file.mimeType === 'inode/directory') acc.add(normalized)
      const parent = getParentPath(normalized)
      if (parent) acc.add(parent)
      return acc
    }, new Set<string>()),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

  return (
    <FilesPageView
      section={section}
      loading={loading}
      viewMode={viewMode}
      setViewMode={setViewMode}
      handleUploadChange={handleUploadChange}
      load={load}
      filteredFiles={filteredFiles}
      recentGroups={recentGroups}
      openFolder={openFolder}
      currentDrivePath={currentDrivePath}
      setCurrentDrivePath={setCurrentDrivePath}
      deletedItems={deletedItems}
      clearDeletedItems={() => persistDeleted([])}
      showFeedback={showFeedback}
      shouldShowCreateActions={shouldShowCreateActions}
      shouldUseTopRightViewSwitch={shouldUseTopRightViewSwitch}
      feedback={feedback}
      setFeedback={setFeedback}
      actions={actions}
      starredIds={starredIds}
      filterMenu={filterMenu}
      filterAnchor={filterAnchor}
      openFilterMenu={openFilterMenu}
      closeFilterMenu={closeFilterMenu}
      setTypeFilter={setTypeFilter}
      setTimeFilter={setTimeFilter}
      moveFolderOptions={moveFolderOptions}
    />
  )
}
