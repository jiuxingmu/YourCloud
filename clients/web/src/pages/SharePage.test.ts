import { describe, expect, it } from 'vitest'
import { ApiRequestError } from '../apiClient'
import { getShareValidationError, isExtractCodeError, SHARE_LINK_INVALID_TEXT } from './SharePage'

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
})
