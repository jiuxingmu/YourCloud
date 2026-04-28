import { Box, Button, Card, CardContent, IconButton, Typography } from '@mui/material'
import FilePreview from '../../../components/FilePreview'
import { DownloadLineIcon, MoreIcon, ShareLineIcon } from '../../../shared/icons/YourCloudIcons'
import { canDownloadFile, formatDisplayFileSize, formatModified, getBaseName, isDirectoryItem, type FileItem, type FileSection } from '../domain'
import { FileTypeBadge } from './FileTypeBadge'

type Props = {
  section: FileSection
  items: FileItem[]
  downloadingId: number | null
  onOpenFolder: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, file: FileItem) => void
}

export function FilesGrid({ section, items, downloadingId, onOpenFolder, onDownload, onShare, onOpenMenu }: Props) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
      {items.map((file) => (
        <Card key={file.id} variant="outlined" sx={{ borderRadius: 0, borderColor: '#e4e8ed', boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(60,64,67,.15)', borderColor: '#d2d8df' } }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '16 / 9',
                minHeight: 132,
                maxHeight: 190,
                borderRadius: 0,
                mb: 1.25,
                border: '1px solid #eef1f4',
                bgcolor: '#f8fafd',
                backgroundImage:
                  'radial-gradient(220px 100px at 10% 15%, rgba(26,115,232,0.09), transparent 60%), radial-gradient(180px 90px at 90% 90%, rgba(66,133,244,0.08), transparent 62%)',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
              }}
            >
              {isDirectoryItem(file) ? (
                <Box sx={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
                  <FileTypeBadge file={file} size={32} />
                </Box>
              ) : (
                <FilePreview id={file.id} filename={file.filename} mimeType={file.mimeType} lazy />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <FileTypeBadge file={file} />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography
                  noWrap
                  sx={{ fontSize: 14, fontWeight: 500, cursor: section === 'drive' && file.mimeType === 'inode/directory' ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (section === 'drive' && file.mimeType === 'inode/directory') onOpenFolder(file)
                  }}
                >
                  {section === 'drive' ? getBaseName(file.filename) : file.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDisplayFileSize(file)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  修改于 {formatModified(file.updatedAt ?? file.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                {canDownloadFile(file) && (
                  <>
                    <Button size="small" startIcon={<DownloadLineIcon fontSize="small" />} onClick={() => onDownload(file)} disabled={downloadingId === file.id}>
                      下载
                    </Button>
                    <Button size="small" startIcon={<ShareLineIcon fontSize="small" />} onClick={() => onShare(file)}>
                      分享
                    </Button>
                  </>
                )}
                <IconButton size="small" aria-label={`打开文件操作菜单：${getBaseName(file.filename)}`} onClick={(e) => onOpenMenu(e, file)}>
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
