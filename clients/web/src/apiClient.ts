function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim()
  if (import.meta.env.DEV) {
    if (!configured || configured === '/cloud' || configured.startsWith('/cloud/')) {
      return 'http://localhost:8080'
    }
  }
  return configured || 'http://localhost:8080'
}

const API_BASE_URL = resolveApiBaseUrl()

type ApiErr = { error?: { code?: string; message?: string } }
type RequestContext = 'auth' | 'files' | 'generic'

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

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

const inflightGetRequests = new Map<string, Promise<unknown>>()

function createRequestKey(path: string, init?: RequestInit): string {
  return JSON.stringify({
    path,
    method: init?.method ?? 'GET',
    headers: init?.headers ?? {},
    body: init?.body ?? null,
  })
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
      res = await fetch(`${API_BASE_URL}${path}`, {
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

export function toUserFriendlyErrorMessage(error: unknown, context: RequestContext = 'generic'): string {
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

export function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>)
}
