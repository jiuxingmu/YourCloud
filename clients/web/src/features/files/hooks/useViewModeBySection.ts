import { useEffect, useState } from 'react'
import { getDefaultViewModeForSection, type FileSection } from '../domain'

export function useViewModeBySection(section: FileSection) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => getDefaultViewModeForSection(section))

  useEffect(() => {
    setViewMode(getDefaultViewModeForSection(section))
  }, [section])

  return { viewMode, setViewMode }
}
