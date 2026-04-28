import { Box } from '@mui/material'
import { resolveFileVisual } from './fileVisual'
import type { FileItem } from '../domain'

export function FileTypeBadge({ file, size = 18 }: { file: FileItem; size?: number }) {
  const visual = resolveFileVisual(file)
  const Icon = visual.icon
  return (
    <Box sx={{ width: size + 8, height: size + 8, borderRadius: 0, bgcolor: visual.bg, color: visual.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon sx={{ fontSize: size }} />
    </Box>
  )
}
