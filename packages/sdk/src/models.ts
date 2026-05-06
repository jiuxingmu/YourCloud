export type RequestContext = 'auth' | 'files' | 'generic'

export type TokenStore = {
  getToken: () => string | null
  /** Called when the server rejects the session (e.g. expired JWT). Host should clear persisted credentials. */
  clearToken?: () => void
}

export type SdkClientOptions = {
  apiBaseUrl: string
  tokenStore?: TokenStore
  fileDownloader?: FileDownloader
}

export type FileItem = {
  id: number
  filename: string
  size: number
  mimeType?: string
  updatedAt?: string
  createdAt?: string
}

export type DeletedItem = {
  id: number
  filename: string
  deletedAt: string
}

export type ManagedShareItem = {
  share: {
    id: number
    token: string
    fileId: number
    createdBy: number
    expiresAt?: string | null
    revokedAt?: string | null
    createdAt?: string
    updatedAt?: string
  }
  fileId: number
  filename: string
  mimeType?: string
  extractCode?: string
}

export type AuthTokenResponse = {
  token?: string
}

export type ShareCreateResponse = {
  token: string
  url: string
  expiresAt?: string
  extractCode?: string
}

export type SharedFileSummary = {
  filename: string
  id: number
  mimeType?: string
}

export type ShareGetByTokenResponse = {
  file: SharedFileSummary
}

export type UploadFilePayload = {
  uri: string
  name: string
  type?: string
}

/** Progress snapshot for multipart uploads (browser XMLHttpRequest). */
export type FileUploadProgress = {
  loaded: number
  total: number
  percent: number
}

export type DownloadResult = {
  uri: string
}

export type FileDownloader = (
  url: string,
  destination: string,
  options?: { headers?: Record<string, string> },
) => Promise<DownloadResult>

export type SdkClient = {
  getApiBaseUrl: () => string
  request: <T>(path: string, init?: RequestInit) => Promise<T>
  authHeaders: () => Record<string, string>
  toUserFriendlyErrorMessage: (error: unknown, context?: RequestContext) => string
  authRegister: (email: string, password: string) => Promise<AuthTokenResponse>
  authLogin: (email: string, password: string) => Promise<AuthTokenResponse>
  authMe: <T>() => Promise<T>
  filesList: (path?: string) => Promise<FileItem[]>
  fileDelete: (id: number) => Promise<void>
  fileMove: (id: number, filename: string) => Promise<void>
  folderCreate: (filename: string) => Promise<FileItem>
  fileUpload: (file: UploadFilePayload, folderPath?: string) => Promise<FileItem>
  fileUploadWithProgress: (
    file: UploadFilePayload | Blob,
    folderPath?: string,
    onProgress?: (progress: FileUploadProgress) => void,
  ) => Promise<FileItem>
  fileFetchDownloadBlob: (id: number) => Promise<Blob>
  fileFetchThumbnailBlob: (id: number) => Promise<Blob>
  fileDownloadToFile: (id: number, destination: string) => Promise<DownloadResult>
  fileDownloadThumbnailToFile: (id: number, destination: string) => Promise<DownloadResult>
  fileBuildDownloadUrl: (id: number) => string
  fileBuildThumbnailUrl: (id: number) => string
  shareCreate: (fileId: number, expireHours?: number, extractCode?: string) => Promise<ShareCreateResponse>
  shareGetByToken: (token: string, extractCode?: string) => Promise<ShareGetByTokenResponse>
  shareListMine: () => Promise<ManagedShareItem[]>
  shareRevoke: (shareId: number) => Promise<void>
  shareFetchDownloadBlob: (token: string, extractCode?: string) => Promise<Blob>
  shareFetchThumbnailBlob: (token: string, extractCode?: string) => Promise<Blob>
  shareBuildDownloadUrl: (token: string) => string
  shareBuildThumbnailUrl: (token: string) => string
  shareBuildDownloadUrlWithCode: (token: string, extractCode?: string) => string
  shareBuildThumbnailUrlWithCode: (token: string, extractCode?: string) => string
}
