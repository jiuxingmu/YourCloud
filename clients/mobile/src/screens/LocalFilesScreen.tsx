import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

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

  const countLabel = useMemo(() => `${items.length} 个本地文件`, [items.length]);

  async function chooseLocalFiles() {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: false,
      });
      if (result.canceled || result.assets.length === 0) return;
      setItems(
        result.assets.map((asset) => ({
          id: `${asset.uri}-${asset.name}`,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
          uri: asset.uri,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  function formatSize(size?: number): string {
    const value = size ?? 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>本地</Text>
        <Pressable style={styles.pickBtn} onPress={chooseLocalFiles} disabled={loading}>
          <Ionicons name="folder-open-outline" size={18} color="#fff" />
          <Text style={styles.pickBtnText}>{loading ? '读取中' : '选择文件'}</Text>
        </Pressable>
      </View>

      <Text style={styles.count}>{countLabel}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-outline" size={20} color="#4B5563" />
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.meta}>
                {formatSize(item.size)} · {item.mimeType || 'unknown'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="phone-portrait-outline" size={24} color="#9AA5B5" />
            <Text style={styles.emptyText}>选择本地文件后会显示在这里</Text>
          </View>
        }
      />
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0B1324',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2463EB',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  count: {
    marginTop: 8,
    marginBottom: 8,
    color: '#8A95A6',
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    marginTop: 2,
    color: '#999999',
    fontSize: 12,
  },
  empty: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#9AA5B5',
  },
});
