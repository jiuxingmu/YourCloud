import type { DeletedItem } from '../domain'

export const FILES_STORAGE_KEYS = {
  searchHistory: 'search_history_files',
  starredIds: 'starred_file_ids',
  deletedItems: 'deleted_file_items',
} as const

export function readSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEYS.searchHistory)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function writeSearchHistory(value: string[]) {
  localStorage.setItem(FILES_STORAGE_KEYS.searchHistory, JSON.stringify(value))
}

export function clearSearchHistory() {
  localStorage.removeItem(FILES_STORAGE_KEYS.searchHistory)
}

export function readStarredIds(): number[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEYS.starredIds)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function writeStarredIds(value: number[]) {
  localStorage.setItem(FILES_STORAGE_KEYS.starredIds, JSON.stringify(value))
}

export function clearStarredIds() {
  localStorage.removeItem(FILES_STORAGE_KEYS.starredIds)
}

export function readDeletedItems(): DeletedItem[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEYS.deletedItems)
    return raw ? (JSON.parse(raw) as DeletedItem[]) : []
  } catch {
    return []
  }
}

export function writeDeletedItems(value: DeletedItem[]) {
  localStorage.setItem(FILES_STORAGE_KEYS.deletedItems, JSON.stringify(value))
}

export function clearDeletedItems() {
  localStorage.removeItem(FILES_STORAGE_KEYS.deletedItems)
}
