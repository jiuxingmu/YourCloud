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

export async function listFiles(): Promise<FileItem[]> {
  return await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } })
}

export async function uploadFile(file: File): Promise<FileItem> {
  const form = new FormData()
  form.append('file', file)
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
    body: JSON.stringify({ filename }),
  })
}

export async function createShare(fileId: number, expireHours = 24): Promise<{ url: string }> {
  return await request<{ url: string }>('/api/v1/shares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ fileId, expireHours }),
  })
}

export async function getShare(token: string): Promise<{ file: { filename: string; id: number; mimeType?: string } }> {
  return await request<{ file: { filename: string; id: number; mimeType?: string } }>(`/api/v1/shares/${token}`)
}
