import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { FileItem } from '@yourcloud/sdk';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';
import { AppTheme } from '../ui/theme';
import { isDirectoryItem } from '../utils/previewKind';

export function FilesScreen() {
  const client = useSdkClient();
  const navigation = useNavigation();
  const [filesStatus, setFilesStatus] = useState('未加载');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);

  function openPreview(item: FileItem) {
    if (isDirectoryItem(item.filename, item.mimeType)) {
      setFilesStatus('文件夹不支持预览');
      return;
    }
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('FilePreview' as keyof RootStackParamList, {
        fileId: item.id,
        filename: item.filename,
        mimeType: item.mimeType,
      });
    }
  }

  async function loadFiles() {
    setLoadingFiles(true);
    setFilesStatus('加载中...');
    try {
      const data = await client.files.list();
      setFiles(data);
      setFilesStatus(`已加载 ${data.length} 个文件`);
    } catch (error) {
      setFilesStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setLoadingFiles(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadFiles();
    }, []),
  );

  async function pickAndUploadFile() {
    setUploading(true);
    setFilesStatus('选择文件中...');
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
      if (result.canceled || result.assets.length === 0) {
        setFilesStatus('已取消选择');
        return;
      }
      const picked = result.assets[0];
      await client.files.upload({
        uri: picked.uri,
        name: picked.name || 'upload.bin',
        type: picked.mimeType || 'application/octet-stream',
      });
      setFilesStatus('上传成功，正在刷新列表...');
      await loadFiles();
    } catch (error) {
      setFilesStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setUploading(false);
    }
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name) {
      setFilesStatus('请输入文件夹名称');
      return;
    }
    setCreatingFolder(true);
    try {
      await client.files.createFolder(name);
      setFolderName('');
      setFilesStatus('文件夹创建成功，正在刷新列表...');
      await loadFiles();
    } catch (error) {
      setFilesStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setCreatingFolder(false);
    }
  }

  async function deleteFile(id: number) {
    setDeletingId(id);
    try {
      await client.files.delete(id);
      setFilesStatus('删除成功，正在刷新列表...');
      await loadFiles();
    } catch (error) {
      setFilesStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setDeletingId(null);
    }
  }

  async function createShare(fileId: number) {
    setSharingId(fileId);
    try {
      const data = await client.shares.create(fileId);
      setShareStatus(`分享创建成功: ${data.url}`);
    } catch (error) {
      setShareStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setSharingId(null);
    }
  }

  async function downloadFile(fileId: number) {
    try {
      const url = client.files.buildDownloadUrl(fileId);
      await Linking.openURL(url);
    } catch (error) {
      setFilesStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>云盘</Text>
      <Text style={styles.subtitle}>你的云端文件与文件夹</Text>

      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, loadingFiles && styles.buttonDisabled]} onPress={loadFiles} disabled={loadingFiles}>
          <Text style={styles.buttonText}>{loadingFiles ? '加载中...' : '刷新列表'}</Text>
        </Pressable>
        <Pressable style={[styles.button, uploading && styles.buttonDisabled]} onPress={pickAndUploadFile} disabled={uploading}>
          <Text style={styles.buttonText}>{uploading ? '上传中...' : '上传文件'}</Text>
        </Pressable>
      </View>

      <View style={[styles.folderBox, styles.card]}>
        <Text style={styles.label}>新建文件夹</Text>
        <TextInput
          value={folderName}
          onChangeText={setFolderName}
          style={[styles.input, styles.folderInput]}
          placeholder="新文件夹名称"
          autoCapitalize="none"
        />
        <Pressable style={[styles.button, styles.folderButton, creatingFolder && styles.buttonDisabled]} onPress={createFolder} disabled={creatingFolder}>
          <Text style={styles.buttonText}>{creatingFolder ? '创建中' : '新建'}</Text>
        </Pressable>
      </View>

      <Text style={styles.status}>{filesStatus}</Text>
      {shareStatus ? <Text style={styles.status}>{shareStatus}</Text> : null}

      <FlatList
        data={files}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.fileRowContainer, styles.card]}>
            <Text style={styles.fileRowText}>
              {item.filename} ({item.size} B)
            </Text>
            {!isDirectoryItem(item.filename, item.mimeType) ? (
              <Pressable style={styles.previewButton} onPress={() => openPreview(item)}>
                <Text style={styles.previewButtonText}>预览</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.deleteButton, deletingId === item.id && styles.buttonDisabled]}
              onPress={() => deleteFile(item.id)}
              disabled={deletingId === item.id}
            >
              <Text style={styles.deleteButtonText}>{deletingId === item.id ? '删除中' : '删除'}</Text>
            </Pressable>
            <Pressable
              style={[styles.shareButton, sharingId === item.id && styles.buttonDisabled]}
              onPress={() => createShare(item.id)}
              disabled={sharingId === item.id}
            >
              <Text style={styles.shareButtonText}>{sharingId === item.id ? '分享中' : '分享'}</Text>
            </Pressable>
            <Pressable style={styles.downloadButton} onPress={() => downloadFile(item.id)}>
              <Text style={styles.downloadButtonText}>下载</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.fileRow}>暂无文件</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: AppTheme.colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: AppTheme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  folderBox: {
    marginTop: 12,
    marginBottom: 2,
    padding: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: AppTheme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.md,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  folderInput: { marginBottom: 8 },
  folderButton: {
    marginTop: 2,
    minWidth: 84,
    alignSelf: 'flex-end',
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
  },
  fileRow: {
    paddingVertical: 8,
    color: AppTheme.colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  fileRowContainer: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  fileRowText: {
    color: AppTheme.colors.text,
    flexBasis: '100%',
    fontWeight: '600',
  },
  previewButton: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: AppTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewButtonText: { color: '#7C3AED', fontSize: 12, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: AppTheme.colors.danger,
    borderRadius: AppTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteButtonText: { color: AppTheme.colors.danger, fontSize: 12, fontWeight: '600' },
  shareButton: {
    borderWidth: 1,
    borderColor: AppTheme.colors.primary,
    borderRadius: AppTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shareButtonText: { color: AppTheme.colors.primary, fontSize: 12, fontWeight: '600' },
  downloadButton: {
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: AppTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  downloadButtonText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: AppTheme.colors.card,
    borderRadius: AppTheme.radius.lg,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
});
