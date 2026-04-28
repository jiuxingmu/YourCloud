import { useMemo, useState, type MouseEvent } from 'react'
import { matchesTimeFilter, matchesTypeFilter } from '../domain/selectors'
import type { FileItem, TimeFilter, TypeFilter } from '../domain/types'

export function useFilesFilters(files: FileItem[], query: string) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [filterMenu, setFilterMenu] = useState<'type' | 'time' | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)
  const normalizedQuery = query.trim().toLowerCase()

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (normalizedQuery && !file.filename.toLowerCase().includes(normalizedQuery)) return false
      if (!matchesTypeFilter(file, typeFilter)) return false
      if (!matchesTimeFilter(file, timeFilter)) return false
      return true
    })
  }, [files, normalizedQuery, typeFilter, timeFilter])

  function openFilterMenu(menu: 'type' | 'time', e: MouseEvent<HTMLElement>) {
    setFilterMenu(menu)
    setFilterAnchor(e.currentTarget)
  }

  function closeFilterMenu() {
    setFilterMenu(null)
    setFilterAnchor(null)
  }

  return {
    typeFilter,
    setTypeFilter,
    timeFilter,
    setTimeFilter,
    filterMenu,
    filterAnchor,
    openFilterMenu,
    closeFilterMenu,
    filteredFiles,
  }
}
