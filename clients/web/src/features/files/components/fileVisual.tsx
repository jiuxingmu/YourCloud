import type { SvgIconProps } from '@mui/material'
import { ArchiveIcon, AudioIcon, FileIcon, FolderIcon, ImageIcon, PdfIcon, VideoIcon } from '../../../shared/icons/YourCloudIcons'
import { isArchiveFile, isAudioFile, isImageFile, isPdfFile, isVideoFile, type FileItem } from '../domain'

export function resolveFileVisual(file: FileItem): { icon: (props: SvgIconProps) => JSX.Element; color: string; bg: string } {
  if (isImageFile(file.filename, file.mimeType)) return { icon: ImageIcon, color: '#1a73e8', bg: '#e8f0fe' }
  if (isPdfFile(file.filename, file.mimeType)) return { icon: PdfIcon, color: '#d93025', bg: '#fce8e6' }
  if (isVideoFile(file.filename, file.mimeType)) return { icon: VideoIcon, color: '#188038', bg: '#e6f4ea' }
  if (isAudioFile(file.filename, file.mimeType)) return { icon: AudioIcon, color: '#9334e6', bg: '#f3e8fd' }
  if (isArchiveFile(file.filename, file.mimeType)) return { icon: ArchiveIcon, color: '#b06000', bg: '#fef7e0' }
  if (file.mimeType === 'inode/directory') return { icon: FolderIcon, color: '#8d6e00', bg: '#fff8e1' }
  return { icon: FileIcon, color: '#5f6368', bg: '#eef1f4' }
}
