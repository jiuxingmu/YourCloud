import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { FileItem } from '@yourcloud/sdk';
import { useAuthenticatedSession } from '../context/AuthenticatedSessionContext';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';
import { isDirectoryItem } from '../utils/previewKind';

export function FilesScreen() {
  const client = useSdkClient();
  const { onLogout, initialApiBaseUrl, onApiBaseUrlChange } = useAuthenticatedSession();
  const navigation = useNavigation();

  const [apiBaseUrl, setApiBaseUrl] = useState(initialApiBaseUrl);
  const [healthStatus, setHealthStatus] = useState('未检查');
  const [filesStatus, setFilesStatus] = useState('未加载');
  const [checking, setChecking] = useState(false);
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

  async function checkHealth() {
    setChecking(true);
    try {
      const data = await client.request<{ status: string }>('/health');
      setHealthStatus(`健康检查成功: ${data.status}`);
    } catch (error) {
      setHealthStatus(client.toUserFriendlyErrorMessage(error));
    } finally {
      setChecking(false);
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

  async function applyApiBaseUrl() {
    await onApiBaseUrlChange(apiBaseUrl.trim() || 'http://10.0.2.2:8080');
  }

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
      <Text style={styles.title}>YourCloud Files</Text>
      <Text style={styles.label}>API Base URL</Text>
      <TextInput value={apiBaseUrl} onChangeText={setApiBaseUrl} style={styles.input} autoCapitalize="none" />
      <Pressable style={styles.secondaryButton} onPress={applyApiBaseUrl}>
        <Text style={styles.secondaryButtonText}>应用地址</Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, checking && styles.buttonDisabled]} onPress={checkHealth} disabled={checking}>
          <Text style={styles.buttonText}>{checking ? '检查中...' : '检查 /health'}</Text>
        </Pressable>
        <Pressable style={[styles.button, loadingFiles && styles.buttonDisabled]} onPress={loadFiles} disabled={loadingFiles}>
          <Text style={styles.buttonText}>{loadingFiles ? '加载中...' : '加载文件列表'}</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.button, uploading && styles.buttonDisabled, { marginTop: 10 }]} onPress={pickAndUploadFile} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? '上传中...' : '选择文件并上传'}</Text>
      </Pressable>
      <View style={styles.folderRow}>
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

      <Pressable style={styles.secondaryButton} onPress={onLogout}>
        <Text style={styles.secondaryButtonText}>退出登录</Text>
      </Pressable>

      <Text style={styles.status}>{healthStatus}</Text>
      <Text style={styles.status}>{filesStatus}</Text>
      {shareStatus ? <Text style={styles.status}>{shareStatus}</Text> : null}

      <FlatList
        data={files}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.fileRowContainer}>
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryButton: {
    marginTop: 10,
    borderColor: '#1f6feb',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1f6feb',
    fontWeight: '600',
    fontSize: 14,
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  fileRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#222',
  },
  folderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  folderInput: {
    flex: 1,
    marginBottom: 0,
  },
  folderButton: {
    flex: 0,
    minWidth: 72,
  },
  fileRowContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  fileRowText: {
    color: '#222',
    flexBasis: '100%',
  },
  previewButton: {
    borderWidth: 1,
    borderColor: '#8250df',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewButtonText: {
    color: '#8250df',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#cf222e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: '#cf222e',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    borderWidth: 1,
    borderColor: '#1f6feb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shareButtonText: {
    color: '#1f6feb',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    borderWidth: 1,
    borderColor: '#656d76',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  downloadButtonText: {
    color: '#656d76',
    fontSize: 12,
    fontWeight: '600',
  },
});
