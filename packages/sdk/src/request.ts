import type {
  AuthTokenResponse,
  FileItem,
  ManagedShareItem,
  RequestContext,
  SdkClient,
  SdkClientOptions,
  ShareCreateResponse,
  ShareGetByTokenResponse,
  UploadFilePayload,
} from './models'

type ApiErr = { error?: { code?: string; message?: string } }

export class ApiRequestError extends Error {
  status?: number
  code?: string
  isNetworkError: boolean

  constructor(message: string, options?: { status?: number; code?: string; isNetworkError?: boolean }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options?.status
    this.code = options?.code
    this.isNetworkError = Boolean(options?.isNetworkError)
  }
}

function withExtractCode(url: string, extractCode?: string): string {
  const code = extractCode?.trim()
  if (!code) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}extractCode=${encodeURIComponent(code)}`
}

function createRequestKey(path: string, init?: RequestInit): string {
  return JSON.stringify({
    path,
    method: init?.method ?? 'GET',
    headers: init?.headers ?? {},
    body: init?.body ?? null,
  })
}

async function parseApiError(res: Response): Promise<ApiErr> {
  return (await res.json().catch(() => ({}))) as ApiErr
}

function toUserFriendlyErrorMessage(error: unknown, context: RequestContext = 'generic'): string {
  if (error instanceof ApiRequestError) {
    if (error.isNetworkError) return '网络连接异常，请检查网络后重试。'

    if (context === 'auth') {
      if (error.code === 'invalid_credentials' || error.status === 401) return '账号或密码错误，请检查后重试。'
      if (error.status === 429) return '登录尝试过于频繁，请稍后再试。'
    }

    if (error.status !== undefined && error.status >= 500) {
      return '服务暂时不可用，请稍后重试。'
    }
  }

  return '操作失败，请稍后重试。如仍有问题请联系管理员。'
}

class SdkClientImpl implements SdkClient {
  private readonly apiBaseUrl: string
  private readonly tokenStore?: SdkClientOptions['tokenStore']
  private readonly fileDownloader?: SdkClientOptions['fileDownloader']
  private readonly inflightGetRequests = new Map<string, Promise<unknown>>()

  constructor(options: SdkClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl
    this.tokenStore = options.tokenStore
    this.fileDownloader = options.fileDownloader
  }

  private clearSessionIfUnauthorized(path: string, init: RequestInit | undefined, status: number): void {
    if (status !== 401) return
    const method = (init?.method ?? 'GET').toUpperCase()
    if (method === 'POST' && (path.startsWith('/api/v1/auth/login') || path.startsWith('/api/v1/auth/register'))) {
      return
    }
    this.tokenStore?.clearToken?.()
  }

  private async requestRaw(path: string, init?: RequestInit): Promise<Response> {
    let res: Response
    try {
      res = await fetch(`${this.apiBaseUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.headers || {}),
        },
      })
    } catch {
      throw new ApiRequestError('网络连接异常，请检查网络后重试。', { isNetworkError: true })
    }

    if (!res.ok) {
      const body = await parseApiError(res)
      this.clearSessionIfUnauthorized(path, init, res.status)
      throw new ApiRequestError(body.error?.message || `Request failed: ${res.status}`, {
        status: res.status,
        code: body.error?.code,
      })
    }

    return res
  }

  private async requestBlob(path: string, init?: RequestInit): Promise<Blob> {
    const res = await this.requestRaw(path, init)
    return await res.blob()
  }

  private async downloadByUrl(url: string, destination: string, headers?: Record<string, string>): Promise<{ uri: string }> {
    if (!this.fileDownloader) throw new ApiRequestError('当前平台未配置文件下载器。')
    return await this.fileDownloader(url, destination, { headers })
  }

  getApiBaseUrl = (): string => this.apiBaseUrl

  authHeaders = (): Record<string, string> => {
    const token = this.tokenStore?.getToken()
    return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>)
  }

  request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const method = (init?.method ?? 'GET').toUpperCase()
    const shouldDedupe = method === 'GET'
    const dedupeKey = shouldDedupe ? createRequestKey(path, init) : ''

    // Any write may change resources fetched by pending GET requests.
    // Clear in-flight GET map so subsequent reads don't reuse stale promises.
    if (!shouldDedupe && this.inflightGetRequests.size > 0) {
      this.inflightGetRequests.clear()
    }

    if (shouldDedupe) {
      const pending = this.inflightGetRequests.get(dedupeKey)
      if (pending) return pending as Promise<T>
    }

    const pending = (async () => {
      const res = await this.requestRaw(path, init)
      const json = await res.json()
      return json.data as T
    })()

    if (shouldDedupe) {
      this.inflightGetRequests.set(dedupeKey, pending)
      pending.finally(() => {
        this.inflightGetRequests.delete(dedupeKey)
      })
    }

    return pending
  }

  toUserFriendlyErrorMessage = (error: unknown, context: RequestContext = 'generic'): string =>
    toUserFriendlyErrorMessage(error, context)

  authRegister = async (email: string, password: string): Promise<AuthTokenResponse> => {
    return await this.request<AuthTokenResponse>('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }

  authLogin = async (email: string, password: string): Promise<AuthTokenResponse> => {
    return await this.request<AuthTokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }

  authMe = async <T>(): Promise<T> => {
    return await this.request<T>('/api/v1/auth/me', { headers: { ...this.authHeaders() } })
  }

  filesList = async (path = ''): Promise<FileItem[]> => {
    const query = path.trim() ? `?path=${encodeURIComponent(path.trim())}` : ''
    return await this.request<FileItem[]>(`/api/v1/files${query}`, { headers: { ...this.authHeaders() } })
  }

  fileDelete = async (id: number): Promise<void> => {
    await this.request<void>(`/api/v1/files/${id}`, { method: 'DELETE', headers: { ...this.authHeaders() } })
  }

  fileMove = async (id: number, filename: string): Promise<void> => {
    await this.request<void>(`/api/v1/files/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ filename }),
    })
  }

  folderCreate = async (filename: string): Promise<FileItem> => {
    return await this.request<FileItem>('/api/v1/files/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ path: filename }),
    })
  }

  fileUpload = async (file: UploadFilePayload, folderPath = ''): Promise<FileItem> => {
    const form = new FormData()
    form.append('file', file as unknown as Blob)
    form.append('path', folderPath)
    return await this.request<FileItem>('/api/v1/files', {
      method: 'POST',
      headers: { ...this.authHeaders() },
      body: form,
    })
  }

  fileUploadWithProgress = async (
    file: UploadFilePayload | Blob,
    folderPath = '',
    onProgress?: (percent: number) => void,
  ): Promise<FileItem> => {
    const form = new FormData()
    form.append('file', file as unknown as Blob)
    form.append('path', folderPath)

    return await new Promise<FileItem>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${this.apiBaseUrl}/api/v1/files`)

      const headers = this.authHeaders()
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v)
      }

      xhr.upload.onprogress = (event) => {
        if (!onProgress || !event.lengthComputable) return
        const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)))
        onProgress(percent)
      }

      xhr.onerror = () => {
        reject(new ApiRequestError('网络连接异常，请检查网络后重试。', { isNetworkError: true }))
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
          if (xhr.status === 401) {
            this.clearSessionIfUnauthorized('/api/v1/files', { method: 'POST' }, 401)
          }
          const err = body as ApiErr
          reject(
            new ApiRequestError(err.error?.message || `Request failed: ${xhr.status}`, {
              status: xhr.status,
              code: err.error?.code,
            }),
          )
          return
        }

        const data = (body as { data?: FileItem }).data
        if (!data) {
          reject(new ApiRequestError('上传响应数据异常'))
          return
        }
        onProgress?.(100)
        resolve(data)
      }

      xhr.send(form)
    })
  }

  fileFetchDownloadBlob = async (id: number): Promise<Blob> => {
    return await this.requestBlob(`/api/v1/files/${id}/download`, { headers: { ...this.authHeaders() } })
  }

  fileFetchThumbnailBlob = async (id: number): Promise<Blob> => {
    return await this.requestBlob(`/api/v1/files/${id}/thumbnail`, { headers: { ...this.authHeaders() } })
  }

  fileDownloadToFile = async (id: number, destination: string): Promise<{ uri: string }> => {
    return await this.downloadByUrl(`${this.apiBaseUrl}/api/v1/files/${id}/download`, destination, this.authHeaders())
  }

  fileDownloadThumbnailToFile = async (id: number, destination: string): Promise<{ uri: string }> => {
    return await this.downloadByUrl(`${this.apiBaseUrl}/api/v1/files/${id}/thumbnail`, destination, this.authHeaders())
  }

  fileBuildDownloadUrl = (id: number): string => `${this.apiBaseUrl}/api/v1/files/${id}/download`

  fileBuildThumbnailUrl = (id: number): string => `${this.apiBaseUrl}/api/v1/files/${id}/thumbnail`

  shareCreate = async (fileId: number, expireHours = 72, extractCode = ''): Promise<ShareCreateResponse> => {
    return await this.request<ShareCreateResponse>('/api/v1/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify({ fileId, expireHours, extractCode }),
    })
  }

  shareGetByToken = async (token: string, extractCode?: string): Promise<ShareGetByTokenResponse> => {
    return await this.request<ShareGetByTokenResponse>(withExtractCode(`/api/v1/shares/${token}`, extractCode))
  }

  shareListMine = async (): Promise<ManagedShareItem[]> => {
    return await this.request<ManagedShareItem[]>('/api/v1/shares', { headers: { ...this.authHeaders() } })
  }

  shareRevoke = async (shareId: number): Promise<void> => {
    await this.request<void>(`/api/v1/shares/${shareId}/revoke`, { method: 'PATCH', headers: { ...this.authHeaders() } })
  }

  shareFetchDownloadBlob = async (token: string, extractCode?: string): Promise<Blob> => {
    return await this.requestBlob(withExtractCode(`/api/v1/shares/${token}/download`, extractCode))
  }

  shareFetchThumbnailBlob = async (token: string, extractCode?: string): Promise<Blob> => {
    return await this.requestBlob(withExtractCode(`/api/v1/shares/${token}/thumbnail`, extractCode))
  }

  shareBuildDownloadUrl = (token: string): string => `${this.apiBaseUrl}/api/v1/shares/${token}/download`

  shareBuildThumbnailUrl = (token: string): string => `${this.apiBaseUrl}/api/v1/shares/${token}/thumbnail`

  shareBuildDownloadUrlWithCode = (token: string, extractCode?: string): string =>
    withExtractCode(`${this.apiBaseUrl}/api/v1/shares/${token}/download`, extractCode)

  shareBuildThumbnailUrlWithCode = (token: string, extractCode?: string): string =>
    withExtractCode(`${this.apiBaseUrl}/api/v1/shares/${token}/thumbnail`, extractCode)
}

export function createSdkClient(options: SdkClientOptions): SdkClient {
  return new SdkClientImpl(options)
}

export { toUserFriendlyErrorMessage }
