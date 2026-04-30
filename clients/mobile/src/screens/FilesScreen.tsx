import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { ActionSheetIOS, Alert, FlatList, Image, Linking, Modal, Platform, RefreshControl, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { FileItem } from '@yourcloud/sdk';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';
import { AppTheme } from '../ui/theme';
import { ScalePressable } from '../ui/ScalePressable';
import { isDirectoryItem } from '../utils/previewKind';

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

  const currentPath = pathStack[pathStack.length - 1] || '/';
  const pathLabel = useMemo(() => (currentPath === '/' ? '根目录 /' : currentPath), [currentPath]);

  useFocusEffect(
    useCallback(() => {
      void loadFiles(currentPath);
    }, []),
  );

  async function loadFiles(path = '/') {
    setLoading(true);
    try {
      const endpoint = path === '/' ? '/api/v1/files' : `/api/v1/files?path=${encodeURIComponent(path)}`;
      const data = await client.request<FileItem[]>(endpoint, { headers: { ...client.authHeaders() } });
      setFiles(data);
      setStatus('');
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
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
      await client.files.upload(
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
      await client.files.createFolder(fullPath);
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
      const nextPath = currentPath === '/' ? item.filename : `${currentPath}/${item.filename}`;
      setPathStack((prev) => [...prev, nextPath]);
      void loadFiles(nextPath);
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
      await client.files.delete(fileId);
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
      const share = await client.shares.create(shareTarget.id, normalizedExpireHours, normalizedExtractCode);
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
      const result = await FileSystem.downloadAsync(client.files.buildDownloadUrl(fileId), target, { headers: { ...client.authHeaders() } });
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

  function formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = size / 1024;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
  }

  function formatDate(iso?: string): string {
    if (!iso) return '--/--';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '--/--';
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }

  function placeholderColor(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) return '#DBEAFE';
    return '#EEF2FF';
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

  function renderFileItem({ item, index }: { item: FileItem; index: number }) {
    const isFolder = isDirectoryItem(item.filename, item.mimeType);
    const thumbnailUri = item.mimeType?.startsWith('image/') ? client.files.buildThumbnailUrl(item.id) : null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 50, type: 'timing', duration: 240 }}
      >
        <ScalePressable style={styles.fileCard} onPress={() => openFileOrFolder(item)}>
          <View style={styles.fileVisual}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri, headers: { ...client.authHeaders() } }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.filePlaceholder, { backgroundColor: isFolder ? '#E8F0FF' : placeholderColor(item.filename) }]}>
                <Feather name={isFolder ? 'folder' : 'file'} size={16} color={isFolder ? '#2563EB' : '#5B6677'} />
              </View>
            )}
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.filename}
            </Text>
            <Text style={styles.fileMeta}>
              {formatSize(item.size)} · {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </View>
          <ScalePressable
            style={styles.moreButton}
            onPress={() => {
              setSelectedFile(item);
              setMenuVisible(true);
            }}
          >
            <Feather name="more-vertical" size={18} color="#7A8799" />
          </ScalePressable>
        </ScalePressable>
      </MotiView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pathBar}>
        <ScalePressable
          onPress={() => {
            if (pathStack.length <= 1) return;
            const nextStack = pathStack.slice(0, -1);
            setPathStack(nextStack);
            void loadFiles(nextStack[nextStack.length - 1] || '/');
          }}
          style={[styles.pathBack, pathStack.length <= 1 && styles.pathBackDisabled]}
          disabled={pathStack.length <= 1}
        >
          <Feather name="chevron-left" size={14} color={pathStack.length <= 1 ? '#A7B0BE' : '#4B5563'} />
        </ScalePressable>
        <Text style={styles.pathText} numberOfLines={1}>
          {pathLabel}
        </Text>
      </View>

      {!!status && <Text style={styles.status}>{status}</Text>}

      <FlatList
        data={files}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFileItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.primary} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Feather name="cloud-off" size={24} color="#98A3B3" />
              <Text style={styles.emptyText}>暂无文件</Text>
            </View>
          )
        }
      />

      <MotiPressable
        style={styles.fab}
        animate={({ pressed }) => ({ scale: pressed ? 0.95 : 1 })}
        transition={{ type: 'timing', duration: 120 }}
        onPress={openQuickActions}
      >
        <Feather name="plus" size={22} color="#fff" />
      </MotiPressable>

      <Modal transparent visible={quickSheetVisible && Platform.OS !== 'ios'} animationType="fade" onRequestClose={() => setQuickSheetVisible(false)}>
        <ScalePressable style={styles.modalMask} onPress={() => setQuickSheetVisible(false)} />
        <View style={styles.nativeSheet}>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              setQuickSheetVisible(false);
              void pickAndUploadFile();
            }}
          >
            <Feather name="upload-cloud" size={18} color="#1E2C45" />
            <Text style={styles.sheetActionText}>上传文件</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.sheetAction}
            onPress={() => {
              setQuickSheetVisible(false);
              setCreateFolderVisible(true);
            }}
          >
            <Feather name="folder-plus" size={18} color="#1E2C45" />
            <Text style={styles.sheetActionText}>新建文件夹</Text>
          </ScalePressable>
        </View>
      </Modal>

      <Modal transparent visible={createFolderVisible} animationType="slide" onRequestClose={() => setCreateFolderVisible(false)}>
        <ScalePressable style={styles.modalMask} onPress={() => setCreateFolderVisible(false)} />
        <View style={styles.bottomSheet}>
          <Text style={styles.bottomSheetTitle}>新建文件夹</Text>
          <TextInput value={folderName} onChangeText={setFolderName} style={styles.input} placeholder="输入文件夹名称" autoCapitalize="none" />
          <View style={styles.bottomSheetButtons}>
            <ScalePressable style={[styles.btn, styles.btnGhost]} onPress={() => setCreateFolderVisible(false)}>
              <Text style={styles.btnGhostText}>取消</Text>
            </ScalePressable>
            <ScalePressable style={[styles.btn, styles.btnPrimary, creatingFolder && styles.btnDisabled]} onPress={createFolder} disabled={creatingFolder}>
              <Text style={styles.btnPrimaryText}>{creatingFolder ? '创建中...' : '创建'}</Text>
            </ScalePressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <ScalePressable
          style={styles.modalMask}
          onPress={() => {
            setMenuVisible(false);
            setSelectedFile(null);
          }}
        />
        <View style={styles.actionPalette}>
          <ScalePressable
            style={styles.paletteAction}
            onPress={() => {
              if (selectedFile) void downloadFile(selectedFile.id);
              setMenuVisible(false);
            }}
            disabled={selectedFile ? downloadingFileId === selectedFile.id : false}
          >
            <Feather name="download" size={18} color="#2A67F7" />
            <Text style={styles.paletteText}>{selectedFile && downloadingFileId === selectedFile.id ? '下载中...' : '下载'}</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.paletteAction}
            onPress={() => {
              if (selectedFile) openShareDialog(selectedFile);
              setMenuVisible(false);
            }}
          >
            <Feather name="share-2" size={18} color="#2A67F7" />
            <Text style={styles.paletteText}>分享</Text>
          </ScalePressable>
          <ScalePressable
            style={styles.paletteAction}
            onPress={() => {
              if (selectedFile) askDelete(selectedFile);
              setMenuVisible(false);
            }}
          >
            <Feather name="trash-2" size={18} color="#E11D48" />
            <Text style={[styles.paletteText, { color: '#E11D48' }]}>删除</Text>
          </ScalePressable>
        </View>
      </Modal>

      <Modal transparent visible={shareDialogVisible} animationType="slide" onRequestClose={() => setShareDialogVisible(false)}>
        <ScalePressable style={styles.modalMask} onPress={() => setShareDialogVisible(false)} />
        <View style={styles.bottomSheet}>
          <Text style={styles.bottomSheetTitle}>创建分享</Text>
          {shareTarget ? (
            <Text style={styles.shareTarget} numberOfLines={1}>
              文件：{shareTarget.filename}
            </Text>
          ) : null}
          <Text style={styles.shareLabel}>有效期（小时）</Text>
          <TextInput value={shareExpireHours} onChangeText={setShareExpireHours} style={styles.input} keyboardType="number-pad" placeholder="默认 72" />
          <Text style={styles.shareLabel}>提取码（可选）</Text>
          <TextInput value={shareExtractCode} onChangeText={setShareExtractCode} style={styles.input} placeholder="例如 abcd" autoCapitalize="none" />
          <View style={styles.bottomSheetButtons}>
            <ScalePressable style={[styles.btn, styles.btnGhost]} onPress={() => setShareDialogVisible(false)} disabled={creatingShare}>
              <Text style={styles.btnGhostText}>取消</Text>
            </ScalePressable>
            <ScalePressable style={[styles.btn, styles.btnPrimary, creatingShare && styles.btnDisabled]} onPress={shareFileWithOptions} disabled={creatingShare}>
              <Text style={styles.btnPrimaryText}>{creatingShare ? '创建中...' : '创建分享'}</Text>
            </ScalePressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  pathBar: {
    marginTop: 2,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pathBack: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EAEFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathBackDisabled: {
    backgroundColor: '#F2F4F8',
  },
  pathText: {
    flex: 1,
    color: '#66748A',
    fontSize: 12,
  },
  status: {
    color: '#66748A',
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  fileCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fileVisual: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  filePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  fileMeta: {
    marginTop: 1,
    color: '#64748B',
    fontSize: 12,
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyWrap: {
    marginTop: 52,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#98A3B3',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: AppTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
    overflow: 'hidden',
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.30)',
  },
  nativeSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: '#E9EDF2',
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  sheetActionText: {
    fontSize: 16,
    color: '#1E2C45',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#E9EDF2',
  },
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  shareTarget: {
    marginBottom: 10,
    color: '#475569',
    fontSize: 13,
  },
  shareLabel: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  bottomSheetButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  btnGhostText: {
    color: '#64748B',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: AppTheme.colors.primary,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionPalette: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  paletteAction: {
    alignItems: 'center',
    width: 72,
  },
  paletteText: {
    marginTop: 6,
    fontSize: 14,
    color: '#1F2937',
  },
});
