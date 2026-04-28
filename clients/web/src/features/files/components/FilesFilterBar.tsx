import { Box, Button, Stack } from '@mui/material'
import type { MouseEvent } from 'react'
import { ArrowDownIcon } from '../../../shared/icons/YourCloudIcons'
import { ViewModeSwitch } from './ViewModeSwitch'

type Props = {
  onOpenTypeFilter: (event: MouseEvent<HTMLElement>) => void
  onOpenTimeFilter: (event: MouseEvent<HTMLElement>) => void
  showViewSwitch: boolean
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function FilesFilterBar({ onOpenTypeFilter, onOpenTimeFilter, showViewSwitch, viewMode, onViewModeChange }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" aria-label="打开类型筛选菜单" endIcon={<ArrowDownIcon fontSize="small" />} onClick={onOpenTypeFilter}>
          类型
        </Button>
        <Button size="small" variant="outlined" aria-label="打开修改时间筛选菜单" endIcon={<ArrowDownIcon fontSize="small" />} onClick={onOpenTimeFilter}>
          修改时间
        </Button>
      </Stack>
      {showViewSwitch ? <ViewModeSwitch viewMode={viewMode} onChange={onViewModeChange} /> : null}
    </Box>
  )
}
