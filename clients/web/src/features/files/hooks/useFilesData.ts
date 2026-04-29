import { useEffect, useRef, useState } from 'react'
import { listFiles, uploadFileWithProgress } from '../data/filesApi'
import { emitFilesChanged } from '../data/filesEvents'
import { mergeVirtualAndRemoteFiles, type FileItem } from '../domain'

type FeedbackFn = (type: 'success' | 'error', text: string) => void
type ErrorMessageFn = (error: unknown) => string

export function useFilesData(showFeedback: FeedbackFn, toErrorMessage: ErrorMessageFn) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [virtualFolders, setVirtualFolders] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFilename, setUploadingFilename] = useState('')
  const virtualFoldersRef = useRef<FileItem[]>([])

  async function load() {
    setLoading(true)
    try {
      const nextFiles = await listFiles()
      setFiles(mergeVirtualAndRemoteFiles(virtualFoldersRef.current, nextFiles))
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function upload(file: File, folderPath = '') {
    setUploading(true)
    setUploadProgress(0)
    setUploadingFilename(file.name)
    try {
      await uploadFileWithProgress(file, folderPath, setUploadProgress)
      showFeedback('success', '上传成功。')
      await load()
      emitFilesChanged()
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadingFilename('')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    virtualFoldersRef.current = virtualFolders
  }, [virtualFolders])

  useEffect(() => {
    setFiles((prev) => {
      const nonVirtual = prev.filter((item) => !virtualFolders.some((vf) => vf.id === item.id))
      return [...virtualFolders, ...nonVirtual]
    })
  }, [virtualFolders])

  return {
    files,
    setFiles,
    virtualFolders,
    setVirtualFolders,
    virtualFoldersRef,
    loading,
    uploading,
    uploadProgress,
    uploadingFilename,
    load,
    upload,
  }
}
