import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AppTheme } from '../ui/theme';

type LocalItem = {
  id: string;
  name: string;
  size?: number;
  mimeType?: string;
  uri: string;
};

export function LocalFilesScreen() {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('本地文件只读列表');

  async function pickLocalFiles() {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: false });
      if (result.canceled) {
        setStatus('已取消选择');
        return;
      }
      const next = result.assets.map((asset) => ({
        id: `${asset.uri}-${asset.name}`,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        uri: asset.uri,
      }));
      setItems(next);
      setStatus(`已加载 ${next.length} 个本地文件`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>本地</Text>
      <Text style={styles.subtitle}>浏览手机本地文件（本期仅只读，不做本地管理）</Text>
      <Pressable style={[styles.button, loading && styles.disabled]} onPress={pickLocalFiles} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '加载中...' : '选择本地文件'}</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.mimeType || 'unknown'} · {(item.size ?? 0).toString()} B</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>暂无本地文件</Text>}
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
    marginTop: 8,
    marginBottom: 14,
    color: AppTheme.colors.textSecondary,
    fontSize: 13,
  },
  button: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: AppTheme.radius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  status: {
    marginTop: 10,
    color: AppTheme.colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    backgroundColor: AppTheme.colors.card,
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: { color: AppTheme.colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: AppTheme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 24 },
});
