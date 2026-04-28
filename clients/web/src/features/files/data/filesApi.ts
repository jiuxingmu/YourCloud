import { authHeaders, request } from '../../../apiClient'
import type { FileItem } from '../domain'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function buildFileDownloadUrl(id: number): string {
  return `${API_BASE_URL}/api/v1/files/${id}/download`
}

export function buildFileThumbnailUrl(id: number): string {
  return `${API_BASE_URL}/api/v1/files/${id}/thumbnail`
}

export function buildShareDownloadUrl(token: string): string {
  return `${API_BASE_URL}/api/v1/shares/${token}/download`
}

export function buildShareThumbnailUrl(token: string): string {
  return `${API_BASE_URL}/api/v1/shares/${token}/thumbnail`
}

function withExtractCode(url: string, extractCode?: string): string {
  const code = extractCode?.trim()
  if (!code) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}extractCode=${encodeURIComponent(code)}`
}

export function buildShareDownloadUrlWithCode(token: string, extractCode?: string): string {
  return withExtractCode(buildShareDownloadUrl(token), extractCode)
}

export function buildShareThumbnailUrlWithCode(token: string, extractCode?: string): string {
  return withExtractCode(buildShareThumbnailUrl(token), extractCode)
}

export async function listFiles(): Promise<FileItem[]> {
  return await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } })
}

export async function uploadFile(file: File, folderPath = ''): Promise<FileItem> {
  const form = new FormData()
  form.append('file', file)
  form.append('path', folderPath)
  return await request<FileItem>('/api/v1/files', { method: 'POST', headers: { ...authHeaders() }, body: form })
}

export async function deleteFile(id: number): Promise<void> {
  await request<void>(`/api/v1/files/${id}`, { method: 'DELETE', headers: { ...authHeaders() } })
}

export async function moveFile(id: number, filename: string): Promise<void> {
  await request<void>(`/api/v1/files/${id}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filename }),
  })
}

export async function createFolder(filename: string): Promise<FileItem> {
  return await request<FileItem>('/api/v1/files/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ path: filename }),
  })
}

export async function createShare(fileId: number, expireHours = 72, extractCode = ''): Promise<{ token: string; url: string; expiresAt?: string; extractCode?: string }> {
  return await request<{ token: string; url: string; expiresAt?: string; extractCode?: string }>('/api/v1/shares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ fileId, expireHours, extractCode }),
  })
}

export async function getShare(token: string, extractCode?: string): Promise<{ file: { filename: string; id: number; mimeType?: string } }> {
  const path = withExtractCode(`/api/v1/shares/${token}`, extractCode)
  return await request<{ file: { filename: string; id: number; mimeType?: string } }>(path)
}
