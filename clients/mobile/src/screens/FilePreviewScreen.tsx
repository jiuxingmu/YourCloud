import { useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';
import { classifyPreviewKind, isDirectoryItem } from '../utils/previewKind';

type Route = RouteProp<RootStackParamList, 'FilePreview'>;

export function FilePreviewScreen() {
  const route = useRoute<Route>();
  const { fileId, filename, mimeType } = route.params;
  const client = useSdkClient();
  const kind = classifyPreviewKind(filename, mimeType);
  const isDir = isDirectoryItem(filename, mimeType);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isDir || kind === 'other' || kind === 'video') {
      setLoading(false);
      setError(isDir ? '文件夹不支持预览' : kind === 'video' ? '视频预览暂未支持' : '暂不支持预览此类型文件');
      return;
    }

    let cancelled = false;
    const headers = { ...client.authHeaders() };

    async function load() {
      setLoading(true);
      setError('');
      setImageUri(null);
      setTextContent('');
      setPdfUrl(null);
      try {
        const base = FileSystem.cacheDirectory ?? '';
        if (kind === 'image') {
          const url = client.files.buildThumbnailUrl(fileId);
          const dest = `${base}preview_thumb_${fileId}_${Date.now()}.bin`;
          const res = await FileSystem.downloadAsync(url, dest, { headers });
          if (!cancelled) setImageUri(res.uri);
        } else if (kind === 'text') {
          const url = client.files.buildDownloadUrl(fileId);
          const dest = `${base}preview_txt_${fileId}_${Date.now()}.txt`;
          await FileSystem.downloadAsync(url, dest, { headers });
          const raw = await FileSystem.readAsStringAsync(dest);
          if (!cancelled) setTextContent(raw.slice(0, 12000));
        } else if (kind === 'document') {
          if (!cancelled) setPdfUrl(client.files.buildDownloadUrl(fileId));
        }
      } catch (e) {
        if (!cancelled) setError(client.toUserFriendlyErrorMessage(e, 'files'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [client, fileId, filename, isDir, kind, mimeType]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.hint}>加载预览...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (kind === 'image' && imageUri) {
    return (
      <ScrollView contentContainerStyle={styles.imageScroll}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </ScrollView>
    );
  }

  if (kind === 'text') {
    return (
      <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
        <Text style={styles.mono}>{textContent || '（空文件）'}</Text>
      </ScrollView>
    );
  }

  if (kind === 'document' && pdfUrl) {
    return (
      <WebView
        style={styles.webview}
        source={{
          uri: pdfUrl,
          headers: { ...client.authHeaders() },
        }}
        originWhitelist={['*']}
      />
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.error}>无法显示预览</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  hint: {
    marginTop: 12,
    color: '#666',
  },
  error: {
    color: '#cf222e',
    textAlign: 'center',
  },
  imageScroll: {
    flexGrow: 1,
    padding: 8,
  },
  image: {
    width: '100%',
    minHeight: 320,
  },
  textScroll: {
    flex: 1,
  },
  textContent: {
    padding: 16,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#222',
  },
  webview: {
    flex: 1,
  },
});
