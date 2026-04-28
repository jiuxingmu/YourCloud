import FilesPageContainer from './FilesPageContainer'
import type { FileSection } from '../features/files/domain'

export type FilesPageProps = { searchQuery?: string; section?: FileSection }

export default function FilesPage({ searchQuery = '', section = 'home' }: FilesPageProps) {
  return <FilesPageContainer searchQuery={searchQuery} section={section} />
}
