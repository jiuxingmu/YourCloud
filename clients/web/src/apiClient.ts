import { ApiRequestError, createSdkClient, type RequestContext } from '@yourcloud/sdk'

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
export const sdkClient = createSdkClient({
  apiBaseUrl: API_BASE_URL,
  tokenStore: {
    getToken: () => localStorage.getItem('token'),
  },
})

export function getApiBaseUrl(): string {
  return sdkClient.getApiBaseUrl()
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return sdkClient.request<T>(path, init)
}

export function toUserFriendlyErrorMessage(error: unknown, context: RequestContext = 'generic'): string {
  return sdkClient.toUserFriendlyErrorMessage(error, context)
}

export function authHeaders() {
  return sdkClient.authHeaders()
}

export { ApiRequestError }
