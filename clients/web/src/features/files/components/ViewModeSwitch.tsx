import { Box, IconButton } from '@mui/material'
import { GridIcon, ListIcon } from '../../../shared/icons/YourCloudIcons'

type Props = {
  viewMode: 'grid' | 'list'
  onChange: (mode: 'grid' | 'list') => void
}

export function ViewModeSwitch({ viewMode, onChange }: Props) {
  return (
    <Box>
      <IconButton size="small" aria-label="切换为列表视图" color={viewMode === 'list' ? 'primary' : 'default'} onClick={() => onChange('list')}>
        <ListIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="切换为网格视图" color={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => onChange('grid')}>
        <GridIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
