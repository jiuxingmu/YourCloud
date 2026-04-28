import { describe, expect, it } from 'vitest'
import { buildShareLinkFromResponse, validateMoveTargetName } from './fileActionsService'

describe('fileActionsService', () => {
  it('falls back to unknown share url when backend returns empty link', () => {
    expect(buildShareLinkFromResponse('', 'https://cloud.test')).toBe('https://cloud.test/?share=unknown')
  })

  it('rejects empty move target names after trimming', () => {
    expect(validateMoveTargetName('   ')).toBeNull()
  })
})
