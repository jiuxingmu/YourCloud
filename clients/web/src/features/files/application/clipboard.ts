type ClipboardLike = {
  writeText?: (value: string) => Promise<void>
}

type TextAreaLike = {
  value: string
  setAttribute: (name: string, value: string) => void
  style: { position: string; left: string }
  select: () => void
}

type ClipboardDocumentLike = {
  body?: {
    appendChild: (node: unknown) => void
    removeChild: (node: unknown) => void
  }
  createElement?: (tagName: string) => TextAreaLike
  execCommand?: (command: string) => boolean
}

type ClipboardEnv = {
  clipboard?: ClipboardLike
  document?: ClipboardDocumentLike
}

export async function copyTextToClipboard(text: string, env: ClipboardEnv = {}): Promise<boolean> {
  if (!text) return false

  const clipboard = env.clipboard ?? globalThis.navigator?.clipboard
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy copy path for environments
      // where Clipboard API is unavailable or permission-gated.
    }
  }

  const doc = env.document ?? (globalThis.document as ClipboardDocumentLike | undefined)
  if (!doc?.createElement || !doc.body?.appendChild || !doc.body.removeChild || !doc.execCommand) return false

  const textarea = doc.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  doc.body.appendChild(textarea)
  textarea.select()

  try {
    return doc.execCommand('copy')
  } catch {
    return false
  } finally {
    doc.body.removeChild(textarea)
  }
}
