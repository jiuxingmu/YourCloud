import { describe, expect, it } from 'vitest'
import { ApiRequestError } from '../apiClient'
import { getShareValidationError, isExtractCodeError, mapShareErrorMessage, SHARE_LINK_INVALID_TEXT } from './SharePage'

describe('SharePage helpers', () => {
  it('returns invalid-share error for empty token', () => {
    expect(getShareValidationError('')).toBe(SHARE_LINK_INVALID_TEXT)
  })

  it('accepts non-empty token', () => {
    expect(getShareValidationError('abc-token-1')).toBeNull()
  })

  it('detects extract-code forbidden errors', () => {
    const error = new ApiRequestError('forbidden', { status: 403, code: 'EXTRACT_CODE_INVALID' })
    expect(isExtractCodeError(error)).toBe(true)
    expect(isExtractCodeError(new Error('other'))).toBe(false)
  })

  it('maps share errors to user-friendly messages by status code', () => {
    expect(mapShareErrorMessage(new ApiRequestError('expired', { status: 410, code: 'EXPIRED' }))).toBe('分享链接已过期')
    expect(mapShareErrorMessage(new ApiRequestError('missing', { status: 404, code: 'NOT_FOUND' }))).toBe('分享内容不存在或已被删除')
    expect(mapShareErrorMessage(new Error('unknown'))).toBe(SHARE_LINK_INVALID_TEXT)
  })
})
