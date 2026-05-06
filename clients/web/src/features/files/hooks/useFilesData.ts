import { useEffect, useRef, useState } from 'react'
import { listFiles, uploadFileWithProgress } from '../data/filesApi'
import { emitFilesChanged } from '../data/filesEvents'
import { mergeVirtualAndRemoteFiles, type FileItem } from '../domain'

type FeedbackFn = (type: 'success' | 'error', text: string) => void
type ErrorMessageFn = (error: unknown) => string

export type WebUploadProgress = {
  percent: number
  loaded: number
  total: number
  speedBps: number | null
}

const initialUploadProgress: WebUploadProgress = {
  percent: 0,
  loaded: 0,
  total: 0,
  speedBps: null,
}

export function useFilesData(showFeedback: FeedbackFn, toErrorMessage: ErrorMessageFn) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [virtualFolders, setVirtualFolders] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<WebUploadProgress>(initialUploadProgress)
  const [uploadingFilename, setUploadingFilename] = useState('')
  const virtualFoldersRef = useRef<FileItem[]>([])
  const uploadSpeedSampleRef = useRef<{ loaded: number; time: number } | null>(null)
  const uploadSpeedSmoothedRef = useRef<number | null>(null)

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
    uploadSpeedSampleRef.current = null
    uploadSpeedSmoothedRef.current = null
    setUploadProgress(initialUploadProgress)
    setUploadingFilename(file.name)
    try {
      await uploadFileWithProgress(file, folderPath, (p) => {
        const now = performance.now()
        const prev = uploadSpeedSampleRef.current
        let speedBps: number | null = uploadSpeedSmoothedRef.current
        if (prev && p.loaded > prev.loaded) {
          const dt = now - prev.time
          if (dt >= 50) {
            const instant = ((p.loaded - prev.loaded) / dt) * 1000
            if (instant > 0) {
              speedBps = speedBps === null ? instant : speedBps * 0.65 + instant * 0.35
            }
          }
        }
        uploadSpeedSampleRef.current = { loaded: p.loaded, time: now }
        uploadSpeedSmoothedRef.current = speedBps
        setUploadProgress({
          percent: p.percent,
          loaded: p.loaded,
          total: p.total,
          speedBps,
        })
      })
      showFeedback('success', '上传成功。')
      await load()
      emitFilesChanged()
    } catch (error) {
      showFeedback('error', toErrorMessage(error))
    } finally {
      setUploading(false)
      setUploadProgress(initialUploadProgress)
      setUploadingFilename('')
      uploadSpeedSampleRef.current = null
      uploadSpeedSmoothedRef.current = null
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
