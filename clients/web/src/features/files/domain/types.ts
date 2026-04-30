import type { DeletedItem, FileItem } from '@yourcloud/sdk'

export type { DeletedItem, FileItem }

export type FileSection = 'drive' | 'recent' | 'starred' | 'trash'

export type TypeFilter = 'all' | 'doc' | 'sheet' | 'slide' | 'image' | 'pdf' | 'video' | 'archive' | 'audio'

export type TimeFilter = 'all' | 'today' | '7d' | '30d' | 'thisYear' | 'lastYear'
