import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import type { ManagedShareItem } from '@yourcloud/sdk';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';
import { ScalePressable } from '../ui/ScalePressable';

export function SharesScreen() {
  const client = useSdkClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ManagedShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.shares.listMine();
      setItems(data);
      setStatus('');
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      void loadShares();
    }, [loadShares]),
  );

  function shortToken(token: string): string {
    if (token.length <= 18) return token;
    return `${token.slice(0, 8)}...${token.slice(-6)}`;
  }

  function askRevoke(item: ManagedShareItem) {
    Alert.alert('撤销分享', `确定撤销 "${item.filename}" 的分享链接吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '撤销',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.shares.revoke(item.share.id);
            await loadShares();
          } catch (error) {
            setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
          }
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-slate-950">分享</Text>
        <View className="flex-row items-center gap-2">
          <ScalePressable
            className="h-8 flex-row items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3"
            onPress={() => navigation.navigate('ShareAccess')}
          >
            <Feather name="log-in" size={14} color="#2563EB" />
            <Text className="text-sm font-semibold text-blue-600">访问</Text>
          </ScalePressable>
          <ScalePressable className="h-8 w-8 items-center justify-center rounded-full bg-blue-600" onPress={loadShares} disabled={loading}>
            <Feather name="refresh-cw" size={14} color="#fff" />
          </ScalePressable>
        </View>
      </View>

      {!!status && <Text className="mt-2 text-sm text-slate-500">{status}</Text>}
      <Text className="mb-3 mt-1 text-sm text-slate-500">{items.length} 条分享</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.share.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item, index }) => {
          const revoked = Boolean(item.share.revokedAt);
          return (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 50, type: 'timing', duration: 240 }}
            >
              <View className="mb-2 flex-row items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-lg shadow-slate-200">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-slate-800" numberOfLines={1}>
                    {item.filename}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">token: {shortToken(item.share.token)}</Text>
                  {item.share.expiresAt ? <Text className="text-sm text-slate-500">过期: {item.share.expiresAt}</Text> : null}
                </View>
                <ScalePressable
                  className={`rounded-xl border px-3 py-2 ${revoked ? 'border-slate-200 bg-slate-100' : 'border-slate-300 bg-slate-100'}`}
                  onPress={() => askRevoke(item)}
                  disabled={revoked}
                >
                  <Text className={`text-sm font-semibold ${revoked ? 'text-slate-400' : 'text-slate-600'}`}>{revoked ? '已撤销' : '撤销'}</Text>
                </ScalePressable>
              </View>
            </MotiView>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-24 items-center">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Feather name="share-2" size={16} color="#64748B" />
              </View>
              <Text className="text-sm text-slate-400">还没有分享记录</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
