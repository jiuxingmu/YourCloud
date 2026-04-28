import { useEffect, useState } from 'react'
import { getParentPath } from '../domain/path'
import type { FileItem, FileSection } from '../domain/types'

export function useDriveNavigation(section: FileSection) {
  const [currentDrivePath, setCurrentDrivePath] = useState('')

  useEffect(() => {
    if (section !== 'drive') setCurrentDrivePath('')
  }, [section])

  function openFolder(file: FileItem) {
    if (section !== 'drive' || file.mimeType !== 'inode/directory') return
    setCurrentDrivePath((prev) => {
      const parent = getParentPath(file.filename)
      if (!prev) return file.filename
      if (parent === prev || file.filename.startsWith(`${prev}/`)) return file.filename
      return prev
    })
  }

  return { currentDrivePath, setCurrentDrivePath, openFolder }
}
