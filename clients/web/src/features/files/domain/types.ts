export type FileItem = {
  id: number
  filename: string
  size: number
  mimeType?: string
  updatedAt?: string
  createdAt?: string
}

export type DeletedItem = { id: number; filename: string; deletedAt: string }

export type FileSection = 'drive' | 'recent' | 'starred' | 'trash'

export type TypeFilter = 'all' | 'doc' | 'sheet' | 'slide' | 'image' | 'pdf' | 'video' | 'archive' | 'audio'

export type TimeFilter = 'all' | 'today' | '7d' | '30d' | 'thisYear' | 'lastYear'
