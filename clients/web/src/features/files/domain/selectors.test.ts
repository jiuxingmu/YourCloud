import { describe, expect, it } from 'vitest'
import { getRelativeBucket, matchesTimeFilter } from './selectors'
import type { FileItem } from './types'

function makeFile(updatedAt: string): FileItem {
  return {
    id: 1,
    filename: 'demo.txt',
    size: 1,
    mimeType: 'text/plain',
    createdAt: updatedAt,
    updatedAt,
  }
}

describe('selectors time boundaries', () => {
  it('excludes future files from rolling 7-day and 30-day filters', () => {
    const future = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
    const file = makeFile(future)

    expect(matchesTimeFilter(file, '7d')).toBe(false)
    expect(matchesTimeFilter(file, '30d')).toBe(false)
  })

  it('does not classify future month files as lastMonth', () => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const bucket = getRelativeBucket(nextMonth.toISOString())
    expect(bucket).toBe('earlier')
  })
})
