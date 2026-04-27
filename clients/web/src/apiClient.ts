const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

type ApiErr = { error?: { code?: string; message?: string } }

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErr
    throw new Error(body.error?.message || `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

export function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>)
}
