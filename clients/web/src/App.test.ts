import { describe, expect, it } from 'vitest'
import { avatarTextFromName, displayNameFromEmail, getShareTokenFromLocation, isShareRoute } from './App'

describe('getShareTokenFromLocation', () => {
  it('parses token from query string', () => {
    expect(getShareTokenFromLocation('/', '?share=query-token-1')).toBe('query-token-1')
  })

  it('parses token from /share/:token path', () => {
    expect(getShareTokenFromLocation('/share/invalid-token-123', '')).toBe('invalid-token-123')
    expect(getShareTokenFromLocation('/share/token%2Fwith-escape', '')).toBe('token/with-escape')
  })

  it('returns null when no share token present', () => {
    expect(getShareTokenFromLocation('/drive', '')).toBeNull()
  })

  it('falls back to raw path segment when decoding fails', () => {
    expect(getShareTokenFromLocation('/share/%E0%A4%A', '')).toBe('%E0%A4%A')
  })
})

describe('isShareRoute', () => {
  it('detects share route even without token segment', () => {
    expect(isShareRoute('/share')).toBe(true)
    expect(isShareRoute('/share/')).toBe(true)
    expect(isShareRoute('/share/invalid-token-123')).toBe(true)
  })

  it('does not match non-share routes', () => {
    expect(isShareRoute('/')).toBe(false)
    expect(isShareRoute('/drive')).toBe(false)
    expect(isShareRoute('/sharex')).toBe(false)
  })
})

describe('displayNameFromEmail', () => {
  it('derives readable display name from email local part', () => {
    expect(displayNameFromEmail('xuegao.wu@yourcloud.app')).toBe('Xuegao Wu')
    expect(displayNameFromEmail('dev_ops-team@yourcloud.app')).toBe('Dev Ops Team')
  })

  it('falls back for invalid empty local part', () => {
    expect(displayNameFromEmail('@yourcloud.app')).toBe('YourCloud 用户')
  })
})

describe('avatarTextFromName', () => {
  it('uses first two initials for multi-word names', () => {
    expect(avatarTextFromName('Xuegao Wu')).toBe('XW')
  })

  it('uses first two letters for single-word names', () => {
    expect(avatarTextFromName('Xuegao')).toBe('XU')
  })
})
