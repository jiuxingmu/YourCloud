import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ManagedShareItem } from '@yourcloud/sdk';
import { useSdkClient } from '../context/SdkClientContext';
import type { RootStackParamList } from '../navigation/types';

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
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>分享</Text>
        <View style={styles.topActions}>
          <Pressable style={styles.accessBtn} onPress={() => navigation.navigate('ShareAccess')}>
            <Ionicons name="enter-outline" size={17} color="#2463EB" />
            <Text style={styles.accessBtnText}>访问</Text>
          </Pressable>
          <Pressable style={styles.refreshBtn} onPress={loadShares} disabled={loading}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {!!status && <Text style={styles.status}>{status}</Text>}
      <Text style={styles.count}>{items.length} 条分享</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.share.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const revoked = Boolean(item.share.revokedAt);
          return (
            <View style={styles.card}>
              <View style={styles.left}>
                <Text style={styles.filename} numberOfLines={1}>
                  {item.filename}
                </Text>
                <Text style={styles.meta}>token: {shortToken(item.share.token)}</Text>
                {item.share.expiresAt ? <Text style={styles.meta}>过期: {item.share.expiresAt}</Text> : null}
              </View>
              <Pressable
                style={[styles.actionBtn, revoked && styles.actionBtnDisabled]}
                onPress={() => askRevoke(item)}
                disabled={revoked}
              >
                <Text style={[styles.actionText, revoked && styles.actionTextDisabled]}>{revoked ? '已撤销' : '撤销'}</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="share-social-outline" size={24} color="#9AA5B5" />
              <Text style={styles.emptyText}>还没有分享记录</Text>
            </View>
          ) : null
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessBtn: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CFE0FF',
    backgroundColor: '#EEF4FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessBtnText: {
    color: '#2463EB',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0B1324',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2463EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginTop: 8,
    color: '#66748A',
  },
  count: {
    marginTop: 6,
    marginBottom: 8,
    color: '#8A95A6',
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  left: {
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    marginTop: 3,
    color: '#999999',
    fontSize: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  actionText: {
    color: '#E11D48',
    fontWeight: '700',
  },
  actionTextDisabled: {
    color: '#94A3B8',
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
