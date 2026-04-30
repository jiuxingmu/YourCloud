import { sdkClient } from '../../../apiClient'
import type { FileItem } from '../domain'
import type { ManagedShareItem, ShareCreateResponse, ShareGetByTokenResponse } from '@yourcloud/sdk'
export type { ManagedShareItem, ShareCreateResponse, ShareGetByTokenResponse } from '@yourcloud/sdk'

export function getApiBaseUrl(): string {
  return sdkClient.getApiBaseUrl()
}

export function buildFileDownloadUrl(id: number): string {
  return sdkClient.fileBuildDownloadUrl(id)
}

export function buildFileThumbnailUrl(id: number): string {
  return sdkClient.fileBuildThumbnailUrl(id)
}

export function buildShareDownloadUrl(token: string): string {
  return sdkClient.shareBuildDownloadUrl(token)
}

export function buildShareThumbnailUrl(token: string): string {
  return sdkClient.shareBuildThumbnailUrl(token)
}

export function buildShareDownloadUrlWithCode(token: string, extractCode?: string): string {
  return sdkClient.shareBuildDownloadUrlWithCode(token, extractCode)
}

export function buildShareThumbnailUrlWithCode(token: string, extractCode?: string): string {
  return sdkClient.shareBuildThumbnailUrlWithCode(token, extractCode)
}

export async function listFiles(): Promise<FileItem[]> {
  return await sdkClient.filesList()
}

export async function uploadFile(file: File, folderPath = ''): Promise<FileItem> {
  return await uploadFileWithProgress(file, folderPath)
}

export async function uploadFileWithProgress(file: File, folderPath = '', onProgress?: (percent: number) => void): Promise<FileItem> {
  return await sdkClient.fileUploadWithProgress(file, folderPath, onProgress)
}

export async function deleteFile(id: number): Promise<void> {
  await sdkClient.fileDelete(id)
}

export async function moveFile(id: number, filename: string): Promise<void> {
  await sdkClient.fileMove(id, filename)
}

export async function createFolder(filename: string): Promise<FileItem> {
  return await sdkClient.folderCreate(filename)
}

export async function createShare(fileId: number, expireHours = 72, extractCode = ''): Promise<ShareCreateResponse> {
  return await sdkClient.shareCreate(fileId, expireHours, extractCode)
}

export async function getShare(token: string, extractCode?: string): Promise<ShareGetByTokenResponse> {
  return await sdkClient.shareGetByToken(token, extractCode)
}

export async function listMyShares(): Promise<ManagedShareItem[]> {
  return await sdkClient.shareListMine()
}

export async function revokeShare(shareId: number): Promise<void> {
  await sdkClient.shareRevoke(shareId)
}
