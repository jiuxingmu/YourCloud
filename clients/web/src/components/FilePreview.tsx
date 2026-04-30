import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { classifyPreviewKind, extensionOfFilename, shouldFetchPreviewSource } from '@yourcloud/sdk'
import { sdkClient } from '../apiClient'
type PreviewSource = { id: number; filename: string; mimeType?: string; shareToken?: string; shareExtractCode?: string; lazy?: boolean }

async function createVideoPoster(url: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url

    const fail = () => reject(new Error('failed to load video poster'))

    video.onerror = fail
    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 180
        const ctx = canvas.getContext('2d')
        if (!ctx) return fail()
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      } catch {
        fail()
      }
    }
  })
}

async function maybeReadText(blob: Blob): Promise<string> {
  const text = (await blob.text()).trim()
  if (!text) return ''
  const sample = text.slice(0, 2000)
  const nonPrintableRatio = sample.split('').filter((c) => c.charCodeAt(0) < 9).length / sample.length
  if (nonPrintableRatio > 0.01) return ''
  return sample
}

export default function FilePreview({ id, filename, mimeType, shareToken, shareExtractCode, lazy = false }: PreviewSource) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(!lazy)
  const [previewUrl, setPreviewUrl] = useState('')
  const [textPreview, setTextPreview] = useState('')
  const [loading, setLoading] = useState(!lazy)
  const kind = useMemo(() => classifyPreviewKind(filename, mimeType), [filename, mimeType])
  const ext = useMemo(() => extensionOfFilename(filename).toUpperCase() || 'FILE', [filename])

  useEffect(() => {
    if (!lazy || visible) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const target = rootRef.current
    if (!target) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
        }
      },
      { rootMargin: '180px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [lazy, visible])

  useEffect(() => {
    if (!visible) return
    if (!shouldFetchPreviewSource(id, mimeType)) {
      setLoading(false)
      setPreviewUrl('')
      setTextPreview('')
      return
    }
    let disposed = false
    let objectUrl = ''

    async function loadPreview() {
      setLoading(true)
      setPreviewUrl('')
      setTextPreview('')
      try {
        const blob =
          kind === 'image'
            ? shareToken
              ? await sdkClient.shareFetchThumbnailBlob(shareToken, shareExtractCode)
              : await sdkClient.fileFetchThumbnailBlob(id)
            : shareToken
              ? await sdkClient.shareFetchDownloadBlob(shareToken, shareExtractCode)
              : await sdkClient.fileFetchDownloadBlob(id)
        objectUrl = URL.createObjectURL(blob)

        if (kind === 'image') {
          if (!disposed) setPreviewUrl(objectUrl)
          return
        }
        if (kind === 'video') {
          const poster = await createVideoPoster(objectUrl)
          if (!disposed) setPreviewUrl(poster)
          return
        }

        const snippet = await maybeReadText(blob)
        if (!disposed) setTextPreview(snippet.slice(0, 420))
      } catch {
        if (!disposed) setTextPreview('')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void loadPreview()
    return () => {
      disposed = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, kind, mimeType, shareToken, shareExtractCode, visible])

  if (!visible) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', width: '100%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">预览待加载</Typography>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', width: '100%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">加载预览中...</Typography>
      </Box>
    )
  }

  if (previewUrl) {
    return (
      <Box
        ref={rootRef}
        component="img"
        src={previewUrl}
        alt={filename}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: kind === 'image' ? 'contain' : 'cover',
          objectPosition: 'center',
          borderRadius: 0,
          bgcolor: kind === 'image' ? '#f5f7fb' : 'transparent',
        }}
      />
    )
  }

  if (textPreview) {
    return (
      <Box ref={rootRef} sx={{ width: '100%', height: '100%', p: 1.2, overflow: 'hidden' }}>
        <Typography
          component="pre"
          sx={{
            m: 0,
            fontSize: 11,
            lineHeight: 1.35,
            color: '#243447',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {textPreview}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={rootRef}
      sx={{
        width: '100%',
        height: '100%',
        p: 1.2,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        background:
          kind === 'document'
            ? 'linear-gradient(160deg, rgba(255,99,71,0.18), rgba(255,255,255,0.6) 45%, rgba(255,140,0,0.15))'
            : 'linear-gradient(160deg, rgba(26,115,232,0.16), rgba(255,255,255,0.6) 45%, rgba(90,156,255,0.18))',
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 12, color: '#5a6370' }}>预览</Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#202731' }}>{ext}</Typography>
      </Box>
    </Box>
  )
}
