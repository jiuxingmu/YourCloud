import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScalePressable } from '../ui/ScalePressable';

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
    <View className="flex-1 bg-slate-50 px-4 pt-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-slate-950">本地</Text>
        <ScalePressable
          className="flex-row items-center gap-1 rounded-2xl bg-blue-600 px-3 py-2 shadow-lg shadow-slate-300"
          onPress={chooseLocalFiles}
          disabled={loading}
        >
          <Feather name="folder-plus" size={15} color="#fff" />
          <Text className="text-sm font-semibold text-white">{loading ? '读取中' : '选择文件'}</Text>
        </ScalePressable>
      </View>

      <Text className="mb-3 text-sm text-slate-500">{countLabel}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 50, type: 'timing', duration: 240 }}
          >
            <View className="mb-2 flex-row items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-lg shadow-slate-200">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Feather name="file" size={16} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-800" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-sm text-slate-500">
                  {formatSize(item.size)} · {item.mimeType || 'unknown'}
                </Text>
              </View>
            </View>
          </MotiView>
        )}
        ListEmptyComponent={
          <View className="mt-28 items-center">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Feather name="package" size={18} color="#64748B" />
            </View>
            <Text className="text-sm text-slate-400">选择本地文件后会显示在这里</Text>
          </View>
        }
      />
    </View>
  );
}
