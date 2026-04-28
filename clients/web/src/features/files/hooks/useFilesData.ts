import { useEffect, useRef, useState } from 'react'
import { listFiles, uploadFile } from '../data/filesApi'
import { emitFilesChanged } from '../data/filesEvents'
import { mergeVirtualAndRemoteFiles } from '../domain/selectors'
import type { FileItem } from '../domain/types'

type FeedbackFn = (type: 'success' | 'error', text: string) => void
type ErrorMessageFn = (error: unknown) => string

export function useFilesData(showFeedback: FeedbackFn, toErrorMessage: ErrorMessageFn) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [virtualFolders, setVirtualFolders] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
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

  async function upload(file: File) {
    try {
      await uploadFile(file)
      showFeedback('success', '上传成功。')
      await load()
      emitFilesChanged()
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
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
    load,
    upload,
  }
}
