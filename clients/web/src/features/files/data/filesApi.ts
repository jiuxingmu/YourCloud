import { authHeaders, sdkClient } from '../../../apiClient'
import type { FileItem } from '../domain'
import type { ManagedShareItem } from '@yourcloud/sdk'
export type { ManagedShareItem } from '@yourcloud/sdk'

export function getApiBaseUrl(): string {
  return sdkClient.getApiBaseUrl()
}

export function buildFileDownloadUrl(id: number): string {
  return sdkClient.files.buildDownloadUrl(id)
}

export function buildFileThumbnailUrl(id: number): string {
  return sdkClient.files.buildThumbnailUrl(id)
}

export function buildShareDownloadUrl(token: string): string {
  return sdkClient.shares.buildDownloadUrl(token)
}

export function buildShareThumbnailUrl(token: string): string {
  return sdkClient.shares.buildThumbnailUrl(token)
}

export function buildShareDownloadUrlWithCode(token: string, extractCode?: string): string {
  return sdkClient.shares.buildDownloadUrlWithCode(token, extractCode)
}

export function buildShareThumbnailUrlWithCode(token: string, extractCode?: string): string {
  return sdkClient.shares.buildThumbnailUrlWithCode(token, extractCode)
}

export async function listFiles(): Promise<FileItem[]> {
  return await sdkClient.files.list()
}

export async function uploadFile(file: File, folderPath = ''): Promise<FileItem> {
  return await uploadFileWithProgress(file, folderPath)
}

export async function uploadFileWithProgress(file: File, folderPath = '', onProgress?: (percent: number) => void): Promise<FileItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('path', folderPath)

  return await new Promise<FileItem>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${sdkClient.getApiBaseUrl()}/api/v1/files`)

    const headers = authHeaders()
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v)
    }

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
      onProgress(percent)
    }

    xhr.onerror = () => {
      reject(new Error('网络连接异常，请检查网络后重试。'))
    }

    xhr.onload = () => {
      const text = xhr.responseText || ''
      let body: unknown = {}
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        body = {}
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const message = (body as { error?: { message?: string } })?.error?.message || `Request failed: ${xhr.status}`
        reject(new Error(message))
        return
      }

      const data = (body as { data?: FileItem }).data
      if (!data) {
        reject(new Error('上传响应数据异常'))
        return
      }
      onProgress?.(100)
      resolve(data)
    }

    xhr.send(form)
  })
}

export async function deleteFile(id: number): Promise<void> {
  await sdkClient.files.delete(id)
}

export async function moveFile(id: number, filename: string): Promise<void> {
  await sdkClient.files.move(id, filename)
}

export async function createFolder(filename: string): Promise<FileItem> {
  return await sdkClient.files.createFolder(filename)
}

export async function createShare(fileId: number, expireHours = 72, extractCode = ''): Promise<{ token: string; url: string; expiresAt?: string; extractCode?: string }> {
  return await sdkClient.shares.create(fileId, expireHours, extractCode)
}

export async function getShare(token: string, extractCode?: string): Promise<{ file: { filename: string; id: number; mimeType?: string } }> {
  return await sdkClient.shares.getByToken(token, extractCode)
}

export async function listMyShares(): Promise<ManagedShareItem[]> {
  return await sdkClient.shares.listMine()
}

export async function revokeShare(shareId: number): Promise<void> {
  await sdkClient.shares.revoke(shareId)
}
