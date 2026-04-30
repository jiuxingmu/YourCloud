import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Linking, Platform, RefreshControl, Share, Text, View } from 'react-native';
import { MotiPressable } from 'moti/interactions';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getBaseName, isDirectoryItem, type FileItem } from '@yourcloud/sdk';
import { useSdkClient } from '../../context/SdkClientContext';
import type { RootStackParamList } from '../../navigation/types';
import { AppTheme } from '../../ui/theme';
import { FileListItem } from './FileListItem';
import { CreateFolderModal, FileActionPalette, QuickActionsModal, ShareDialogModal } from './FilesModals';
import { FilesPathBar } from './FilesPathBar';
import { filesStyles as styles } from './filesStyles';

export function FilesScreen() {
  const client = useSdkClient();
  const navigation = useNavigation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('');
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
  const [shareExpireHours, setShareExpireHours] = useState('72');
  const [shareExtractCode, setShareExtractCode] = useState('');
  const [creatingShare, setCreatingShare] = useState(false);
  const [pathStack, setPathStack] = useState<string[]>(['/']);
  const latestLoadRequestRef = useRef(0);

  const currentPath = pathStack[pathStack.length - 1] || '/';
  const pathLabel = useMemo(() => (currentPath === '/' ? '根目录 /' : currentPath), [currentPath]);

  useFocusEffect(
    useCallback(() => {
      void loadFiles(currentPath);
    }, [currentPath]),
  );

  useEffect(() => {
    void loadFiles(currentPath);
  }, [currentPath]);

  function sortFileItems(items: FileItem[]): FileItem[] {
    return [...items].sort((a, b) => {
      const aIsDir = isDirectoryItem(a.filename, a.mimeType);
      const bIsDir = isDirectoryItem(b.filename, b.mimeType);

      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }

      return a.filename.localeCompare(b.filename, 'en', {
        sensitivity: 'base',
        numeric: true,
      });
    });
  }

  async function loadFiles(path = '/') {
    const requestId = ++latestLoadRequestRef.current;
    setLoading(true);
    try {
      const data = await client.filesList(path === '/' ? '' : path);
      if (requestId !== latestLoadRequestRef.current) return;
      setFiles(sortFileItems(data));
      setStatus('');
    } catch (error) {
      if (requestId !== latestLoadRequestRef.current) return;
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      if (requestId !== latestLoadRequestRef.current) return;
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadFiles(currentPath);
    setRefreshing(false);
  }

  async function pickAndUploadFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) return;
      const picked = result.assets[0];
      await client.fileUpload(
        {
          uri: picked.uri,
          name: picked.name || 'upload.bin',
          type: picked.mimeType || 'application/octet-stream',
        },
        currentPath === '/' ? '' : currentPath,
      );
      await loadFiles(currentPath);
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    }
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    try {
      const fullPath = currentPath === '/' ? name : `${currentPath}/${name}`;
      await client.folderCreate(fullPath);
      setFolderName('');
      setCreateFolderVisible(false);
      await loadFiles(currentPath);
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setCreatingFolder(false);
    }
  }

  function openFileOrFolder(item: FileItem) {
    if (isDirectoryItem(item.filename, item.mimeType)) {
      const folderName = getBaseName(item.filename) || item.filename;
      const nextPath = currentPath === '/' ? folderName : `${currentPath}/${folderName}`;
      setPathStack((prev) => [...prev, nextPath]);
      return;
    }
    const parent = navigation.getParent();
    if (!parent) return;
    parent.navigate('FilePreview' as keyof RootStackParamList, {
      fileId: item.id,
      filename: item.filename,
      mimeType: item.mimeType,
    });
  }

  async function deleteFile(fileId: number) {
    try {
      await client.fileDelete(fileId);
      await loadFiles(currentPath);
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    }
  }

  function buildShareUrl(token: string, fallbackUrl?: string): string {
    if (fallbackUrl) return fallbackUrl;
    const base = client.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}/share/${token}`;
  }

  function openShareDialog(item: FileItem) {
    setShareTarget(item);
    setShareExpireHours('72');
    setShareExtractCode('');
    setShareDialogVisible(true);
  }

  async function shareFileWithOptions() {
    if (!shareTarget) return;
    const expireHoursNum = Number.parseInt(shareExpireHours.trim(), 10);
    const normalizedExpireHours = Number.isFinite(expireHoursNum) && expireHoursNum > 0 ? expireHoursNum : 72;
    const normalizedExtractCode = shareExtractCode.trim();
    setCreatingShare(true);
    try {
      const share = await client.shareCreate(shareTarget.id, normalizedExpireHours, normalizedExtractCode);
      const shareUrl = buildShareUrl(share.token, share.url);
      setStatus(`分享已创建: ${share.token}`);
      setShareDialogVisible(false);
      Alert.alert('分享创建成功', shareUrl, [
        { text: '关闭', style: 'cancel' },
        { text: '打开链接', onPress: () => void Linking.openURL(shareUrl) },
        { text: '系统分享', onPress: () => void Share.share({ message: shareUrl, url: shareUrl }) },
      ]);
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setCreatingShare(false);
    }
  }

  async function downloadFile(fileId: number) {
    if (downloadingFileId === fileId) return;
    setDownloadingFileId(fileId);
    try {
      const cacheDir = FileSystem.cacheDirectory ?? '';
      const target = `${cacheDir}yourcloud_download_${fileId}_${Date.now()}`;
      const result = await client.fileDownloadToFile(fileId, target);
      setStatus('下载完成，已保存到应用缓存目录');
      await Linking.openURL(result.uri);
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setDownloadingFileId(null);
    }
  }

  function askDelete(item: FileItem) {
    Alert.alert('删除文件', `确认删除 "${item.filename}" 吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void deleteFile(item.id) },
    ]);
  }

  function openQuickActions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '上传文件', '新建文件夹'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void pickAndUploadFile();
          if (idx === 2) setCreateFolderVisible(true);
        },
      );
      return;
    }
    setQuickSheetVisible(true);
  }

  return (
    <View style={styles.container}>
      <FilesPathBar
        pathLabel={pathLabel}
        canGoBack={pathStack.length > 1}
        onBack={() => {
          if (pathStack.length <= 1) return;
          const nextStack = pathStack.slice(0, -1);
          setPathStack(nextStack);
        }}
      />

      {!!status && <Text style={styles.status}>{status}</Text>}

      <FlatList
        data={files}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.primary} />}
        renderItem={({ item, index }) => (
          <FileListItem
            item={item}
            index={index}
            authHeaders={client.authHeaders()}
            buildThumbnailUrl={client.fileBuildThumbnailUrl}
            onOpen={openFileOrFolder}
            onMore={(value) => {
              setSelectedFile(value);
              setMenuVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Feather name="cloud-off" size={24} color="#98A3B3" />
              <Text style={styles.emptyText}>暂无文件</Text>
            </View>
          )
        }
      />

      <MotiPressable style={styles.fab} animate={({ pressed }) => ({ scale: pressed ? 0.95 : 1 })} transition={{ type: 'timing', duration: 120 }} onPress={openQuickActions}>
        <Feather name="plus" size={22} color="#fff" />
      </MotiPressable>

      <QuickActionsModal visible={quickSheetVisible} onClose={() => setQuickSheetVisible(false)} onUpload={() => void pickAndUploadFile()} onCreateFolder={() => setCreateFolderVisible(true)} />

      <CreateFolderModal
        visible={createFolderVisible}
        folderName={folderName}
        creatingFolder={creatingFolder}
        onClose={() => setCreateFolderVisible(false)}
        onChangeFolderName={setFolderName}
        onCreateFolder={() => void createFolder()}
      />

      <FileActionPalette
        visible={menuVisible}
        selectedFile={selectedFile}
        downloadingFileId={downloadingFileId}
        onClose={() => {
          setMenuVisible(false);
          setSelectedFile(null);
        }}
        onDownload={(item) => void downloadFile(item.id)}
        onShare={openShareDialog}
        onDelete={askDelete}
      />

      <ShareDialogModal
        visible={shareDialogVisible}
        shareTarget={shareTarget}
        shareExpireHours={shareExpireHours}
        shareExtractCode={shareExtractCode}
        creatingShare={creatingShare}
        onClose={() => setShareDialogVisible(false)}
        onChangeExpireHours={setShareExpireHours}
        onChangeExtractCode={setShareExtractCode}
        onCreateShare={() => void shareFileWithOptions()}
      />
    </View>
  );
}
