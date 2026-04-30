type ApiErr = { error?: { code?: string; message?: string } }

export type RequestContext = 'auth' | 'files' | 'generic'

export type TokenStore = {
  getToken: () => string | null
}

export type SdkClientOptions = {
  apiBaseUrl: string
  tokenStore?: TokenStore
}

export type FileItem = {
  id: number
  filename: string
  size: number
  mimeType?: string
  updatedAt?: string
  createdAt?: string
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

export type UploadFilePayload = {
  uri: string
  name: string
  type?: string
}

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

export function createSdkClient(options: SdkClientOptions) {
  const apiBaseUrl = options.apiBaseUrl
  const inflightGetRequests = new Map<string, Promise<unknown>>()

  function authHeaders(): Record<string, string> {
    const token = options.tokenStore?.getToken()
    return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>)
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const method = (init?.method ?? 'GET').toUpperCase()
    const shouldDedupe = method === 'GET'
    const dedupeKey = shouldDedupe ? createRequestKey(path, init) : ''

    if (shouldDedupe) {
      const pending = inflightGetRequests.get(dedupeKey)
      if (pending) return pending as Promise<T>
    }

    const pending = (async () => {
      let res: Response
      try {
        res = await fetch(`${apiBaseUrl}${path}`, {
          ...init,
          headers: {
            ...(init?.headers || {}),
          },
        })
      } catch {
        throw new ApiRequestError('网络连接异常，请检查网络后重试。', { isNetworkError: true })
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErr
        throw new ApiRequestError(body.error?.message || `Request failed: ${res.status}`, {
          status: res.status,
          code: body.error?.code,
        })
      }
      const json = await res.json()
      return json.data as T
    })()

    if (shouldDedupe) {
      inflightGetRequests.set(dedupeKey, pending)
      pending.finally(() => {
        inflightGetRequests.delete(dedupeKey)
      })
    }

    return pending
  }

  return {
    getApiBaseUrl: () => apiBaseUrl,
    request,
    authHeaders,
    toUserFriendlyErrorMessage,
    auth: {
      register: async (email: string, password: string): Promise<{ token?: string }> => {
        return await request<{ token?: string }>('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
      },
      login: async (email: string, password: string): Promise<{ token?: string }> => {
        return await request<{ token?: string }>('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
      },
      me: async <T>(): Promise<T> => {
        return await request<T>('/api/v1/auth/me', { headers: { ...authHeaders() } })
      },
    },
    files: {
      list: async (): Promise<FileItem[]> => {
        return await request<FileItem[]>('/api/v1/files', { headers: { ...authHeaders() } })
      },
      delete: async (id: number): Promise<void> => {
        await request<void>(`/api/v1/files/${id}`, { method: 'DELETE', headers: { ...authHeaders() } })
      },
      move: async (id: number, filename: string): Promise<void> => {
        await request<void>(`/api/v1/files/${id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ filename }),
        })
      },
      createFolder: async (filename: string): Promise<FileItem> => {
        return await request<FileItem>('/api/v1/files/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ path: filename }),
        })
      },
      upload: async (file: UploadFilePayload, folderPath = ''): Promise<FileItem> => {
        const form = new FormData()
        form.append('file', file as unknown as Blob)
        form.append('path', folderPath)
        return await request<FileItem>('/api/v1/files', {
          method: 'POST',
          headers: { ...authHeaders() },
          body: form,
        })
      },
      buildDownloadUrl: (id: number): string => `${apiBaseUrl}/api/v1/files/${id}/download`,
      buildThumbnailUrl: (id: number): string => `${apiBaseUrl}/api/v1/files/${id}/thumbnail`,
    },
    shares: {
      create: async (fileId: number, expireHours = 72, extractCode = ''): Promise<{ token: string; url: string; expiresAt?: string; extractCode?: string }> => {
        return await request<{ token: string; url: string; expiresAt?: string; extractCode?: string }>('/api/v1/shares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ fileId, expireHours, extractCode }),
        })
      },
      getByToken: async (token: string, extractCode?: string): Promise<{ file: { filename: string; id: number; mimeType?: string } }> => {
        const path = withExtractCode(`/api/v1/shares/${token}`, extractCode)
        return await request<{ file: { filename: string; id: number; mimeType?: string } }>(path)
      },
      listMine: async (): Promise<ManagedShareItem[]> => {
        return await request<ManagedShareItem[]>('/api/v1/shares', { headers: { ...authHeaders() } })
      },
      revoke: async (shareId: number): Promise<void> => {
        await request<void>(`/api/v1/shares/${shareId}/revoke`, { method: 'PATCH', headers: { ...authHeaders() } })
      },
      buildDownloadUrl: (token: string): string => `${apiBaseUrl}/api/v1/shares/${token}/download`,
      buildThumbnailUrl: (token: string): string => `${apiBaseUrl}/api/v1/shares/${token}/thumbnail`,
      buildDownloadUrlWithCode: (token: string, extractCode?: string): string =>
        withExtractCode(`${apiBaseUrl}/api/v1/shares/${token}/download`, extractCode),
      buildThumbnailUrlWithCode: (token: string, extractCode?: string): string =>
        withExtractCode(`${apiBaseUrl}/api/v1/shares/${token}/thumbnail`, extractCode),
    },
  }
}

export { toUserFriendlyErrorMessage }
