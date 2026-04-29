import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard } from './clipboard'

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const ok = await copyTextToClipboard('https://example.com/share/1', {
      clipboard: { writeText },
    })
    expect(ok).toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://example.com/share/1')
  })

  it('falls back to execCommand when Clipboard API is unavailable', async () => {
    const execCommand = vi.fn().mockReturnValue(true)
    const doc = {
      createElement: vi.fn().mockReturnValue({
        value: '',
        setAttribute: vi.fn(),
        style: { position: '', left: '' },
        select: vi.fn(),
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand,
    }

    const ok = await copyTextToClipboard('https://example.com/share/2', { document: doc })
    expect(ok).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('returns false when both clipboard paths fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const ok = await copyTextToClipboard('https://example.com/share/3', {
      clipboard: { writeText },
      document: {
        createElement: vi.fn().mockReturnValue({
          value: '',
          setAttribute: vi.fn(),
          style: { position: '', left: '' },
          select: vi.fn(),
        }),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        execCommand: vi.fn().mockImplementation(() => {
          throw new Error('copy failed')
        }),
      },
    })
    expect(ok).toBe(false)
  })
})
