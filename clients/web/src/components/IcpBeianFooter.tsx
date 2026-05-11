import { Box, Link } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

const MIIT_BEIAN_URL = 'https://beian.miit.gov.cn/'
const ICP_NUMBER = '沪ICP备2026019159号-1'

type Props = { sx?: SxProps<Theme> }

export default function IcpBeianFooter({ sx }: Props) {
  return (
    <Box
      component="footer"
      sx={[
        {
          py: 2,
          px: 2,
          textAlign: 'center',
          borderTop: '1px solid #edf0f2',
          bgcolor: 'background.default',
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Link href={MIIT_BEIAN_URL} target="_blank" rel="noopener noreferrer" underline="hover" color="text.secondary" sx={{ fontSize: 12 }}>
        {ICP_NUMBER}
      </Link>
    </Box>
  )
}
