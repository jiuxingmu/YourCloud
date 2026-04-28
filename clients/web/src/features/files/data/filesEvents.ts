export const FILES_EVENTS = {
  filesChanged: 'yourcloud:files-changed',
  starredCleared: 'yourcloud:starred-cleared',
  trashCleared: 'yourcloud:trash-cleared',
} as const

export function emitFilesChanged() {
  window.dispatchEvent(new CustomEvent(FILES_EVENTS.filesChanged))
}

export function onFilesChanged(listener: EventListener) {
  window.addEventListener(FILES_EVENTS.filesChanged, listener)
  return () => window.removeEventListener(FILES_EVENTS.filesChanged, listener)
}

export function emitStarredCleared() {
  window.dispatchEvent(new CustomEvent(FILES_EVENTS.starredCleared))
}

export function onStarredCleared(listener: EventListener) {
  window.addEventListener(FILES_EVENTS.starredCleared, listener)
  return () => window.removeEventListener(FILES_EVENTS.starredCleared, listener)
}

export function emitTrashCleared() {
  window.dispatchEvent(new CustomEvent(FILES_EVENTS.trashCleared))
}

export function onTrashCleared(listener: EventListener) {
  window.addEventListener(FILES_EVENTS.trashCleared, listener)
  return () => window.removeEventListener(FILES_EVENTS.trashCleared, listener)
}
