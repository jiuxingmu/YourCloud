import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, request, toUserFriendlyErrorMessage } from './apiClient'

describe('toUserFriendlyErrorMessage', () => {
  it('maps auth credential errors to friendly Chinese copy', () => {
    const err = new ApiRequestError('invalid credentials', { status: 401, code: 'invalid_credentials' })
    expect(toUserFriendlyErrorMessage(err, 'auth')).toBe('账号或密码错误，请检查后重试。')
  })

  it('maps network errors to retry guidance', () => {
    const err = new ApiRequestError('Failed to fetch', { isNetworkError: true })
    expect(toUserFriendlyErrorMessage(err, 'files')).toBe('网络连接异常，请检查网络后重试。')
  })
})

describe('request', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deduplicates concurrent GET requests with same params', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: [{ id: 1 }] }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const [r1, r2] = await Promise.all([request('/api/v1/files'), request('/api/v1/files')])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(r1).toEqual([{ id: 1 }])
    expect(r2).toEqual([{ id: 1 }])
  })
})
