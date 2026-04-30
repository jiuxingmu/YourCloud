import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ManagedShareItem } from '@yourcloud/sdk';
import { useSdkClient } from '../context/SdkClientContext';
import { AppTheme } from '../ui/theme';

export function SharesScreen() {
  const client = useSdkClient();
  const [items, setItems] = useState<ManagedShareItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    setStatus('加载中...');
    try {
      const data = await client.shares.listMine();
      setItems(data);
      setStatus(`共 ${data.length} 条分享`);
    } catch (e) {
      setStatus(client.toUserFriendlyErrorMessage(e, 'files'));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      void loadShares();
    }, [loadShares]),
  );

  async function revoke(shareId: number) {
    setRevokingId(shareId);
    try {
      await client.shares.revoke(shareId);
      await loadShares();
    } catch (e) {
      setStatus(client.toUserFriendlyErrorMessage(e, 'files'));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>我的分享</Text>
      <Text style={styles.subtitle}>管理你分享出去的链接</Text>
      <Pressable style={[styles.refresh, loading && styles.disabled]} onPress={loadShares} disabled={loading}>
        <Text style={styles.refreshText}>{loading ? '刷新中...' : '刷新'}</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.share.id)}
        renderItem={({ item }) => {
          const revoked = Boolean(item.share.revokedAt);
          return (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.filename}>{item.filename}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  token: {item.share.token}
                </Text>
                {item.share.expiresAt ? <Text style={styles.meta}>过期: {item.share.expiresAt}</Text> : null}
                {revoked ? <Text style={styles.revoked}>已撤销</Text> : null}
              </View>
              {!revoked ? (
                <Pressable
                  style={[styles.revokeBtn, revokingId === item.share.id && styles.disabled]}
                  onPress={() => revoke(item.share.id)}
                  disabled={revokingId === item.share.id}
                >
                  <Text style={styles.revokeText}>{revokingId === item.share.id ? '撤销中' : '撤销'}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无分享</Text> : null}
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
    color: AppTheme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  refresh: {
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AppTheme.radius.md,
    marginBottom: 8,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.55,
  },
  status: {
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.lg,
    backgroundColor: AppTheme.colors.card,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowMain: {
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  meta: {
    fontSize: 12,
    color: AppTheme.colors.textSecondary,
    marginTop: 4,
  },
  revoked: {
    marginTop: 4,
    color: '#656d76',
    fontSize: 12,
  },
  revokeBtn: {
    borderWidth: 1,
    borderColor: AppTheme.colors.danger,
    borderRadius: AppTheme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  revokeText: {
    color: AppTheme.colors.danger,
    fontWeight: '600',
    fontSize: 12,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: '#888',
  },
});
