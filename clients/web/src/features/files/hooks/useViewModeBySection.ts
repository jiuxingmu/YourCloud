import { useEffect, useState } from 'react'
import { getDefaultViewModeForSection } from '../domain/viewMode'
import type { FileSection } from '../domain/types'

export function useViewModeBySection(section: FileSection) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => getDefaultViewModeForSection(section))

  useEffect(() => {
    setViewMode(getDefaultViewModeForSection(section))
  }, [section])

  return { viewMode, setViewMode }
}
