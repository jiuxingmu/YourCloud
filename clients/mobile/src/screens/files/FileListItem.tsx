import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Image, Text, View } from 'react-native';
import { getBaseName, isDirectoryItem, type FileItem } from '@yourcloud/sdk';
import { ScalePressable } from '../../ui/ScalePressable';
import { filesStyles as styles } from './filesStyles';
import { formatFileDate, formatFileSize, getFilePlaceholderColor } from './fileFormatters';

type FileListItemProps = {
  item: FileItem;
  index: number;
  authHeaders: Record<string, string>;
  buildThumbnailUrl: (fileId: number) => string;
  onOpen: (item: FileItem) => void;
  onMore: (item: FileItem) => void;
};

export function FileListItem({ item, index, authHeaders, buildThumbnailUrl, onOpen, onMore }: FileListItemProps) {
  const isFolder = isDirectoryItem(item.filename, item.mimeType);
  const thumbnailUri = item.mimeType?.startsWith('image/') ? buildThumbnailUrl(item.id) : null;
  const displayName = getBaseName(item.filename) || item.filename;

  return (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: index * 50, type: 'timing', duration: 240 }}>
      <ScalePressable style={styles.fileCard} onPress={() => onOpen(item)}>
        <View style={styles.fileVisual}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri, headers: { ...authHeaders } }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.filePlaceholder, { backgroundColor: isFolder ? '#E8F0FF' : getFilePlaceholderColor(item.filename) }]}>
              <Feather name={isFolder ? 'folder' : 'file'} size={16} color={isFolder ? '#2563EB' : '#5B6677'} />
            </View>
          )}
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.fileMeta}>
            {isFolder ? formatFileDate(item.updatedAt || item.createdAt) : `${formatFileSize(item.size)} · ${formatFileDate(item.updatedAt || item.createdAt)}`}
          </Text>
        </View>
        <ScalePressable style={styles.moreButton} onPress={() => onMore(item)}>
          <Feather name="more-vertical" size={18} color="#7A8799" />
        </ScalePressable>
      </ScalePressable>
    </MotiView>
  );
}
