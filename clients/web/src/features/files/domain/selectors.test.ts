import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => {
    vi.useRealTimers()
  })

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

  it('classifies only previous calendar month as lastMonth', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T10:00:00.000Z'))

    const sameMonth = getRelativeBucket('2026-04-10T10:00:00.000Z')
    const prevMonth = getRelativeBucket('2026-03-20T10:00:00.000Z')

    expect(sameMonth).toBe('earlier')
    expect(prevMonth).toBe('lastMonth')
  })
})
