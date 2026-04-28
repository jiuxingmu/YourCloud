import type { FileSection } from './types'

export function getDefaultViewModeForSection(section: FileSection): 'grid' | 'list' {
  return section === 'drive' || section === 'recent' || section === 'starred' ? 'list' : 'grid'
}

export function shouldUseTopRightViewSwitch(section: FileSection): boolean {
  return section === 'drive' || section === 'recent' || section === 'starred'
}
