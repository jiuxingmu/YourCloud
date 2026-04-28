import { describe, expect, it } from 'vitest'
import { getShareValidationError, SHARE_LINK_INVALID_TEXT } from './SharePage'

describe('SharePage helpers', () => {
  it('returns invalid-share error for empty token', () => {
    expect(getShareValidationError('')).toBe(SHARE_LINK_INVALID_TEXT)
  })

  it('accepts non-empty token', () => {
    expect(getShareValidationError('abc-token-1')).toBeNull()
  })
})
