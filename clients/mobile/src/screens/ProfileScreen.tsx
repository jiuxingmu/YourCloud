import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthenticatedSession } from '../context/AuthenticatedSessionContext';
import { useSdkClient } from '../context/SdkClientContext';
import { AppTheme } from '../ui/theme';

type Me = { id: number; email: string };

export function ProfileScreen() {
  const client = useSdkClient();
  const { onLogout, initialApiBaseUrl, onApiBaseUrlChange } = useAuthenticatedSession();
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState(initialApiBaseUrl);

  const loadMe = useCallback(async () => {
    try {
      const data = await client.auth.me<Me>();
      setMe(data);
      setStatus('');
    } catch (e) {
      setStatus(client.toUserFriendlyErrorMessage(e, 'auth'));
    }
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      void loadMe();
    }, [loadMe]),
  );

  async function applyApiBaseUrl() {
    await onApiBaseUrlChange(apiBaseUrl.trim() || 'http://10.0.2.2:8080');
    setStatus('API 地址已保存');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>我的</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>账号信息</Text>
        <Text style={styles.kv}>用户 ID：{me?.id ?? '-'}</Text>
        <Text style={styles.kv}>邮箱：{me?.email ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>连接配置</Text>
        <TextInput value={apiBaseUrl} onChangeText={setApiBaseUrl} style={styles.input} autoCapitalize="none" />
        <Pressable style={styles.primaryBtn} onPress={applyApiBaseUrl}>
          <Text style={styles.primaryBtnText}>保存 API 地址</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>功能入口</Text>
        <Pressable style={styles.entry}>
          <Text style={styles.entryText}>收藏（即将支持）</Text>
        </Pressable>
        <Pressable style={styles.entry}>
          <Text style={styles.entryText}>回收站（即将支持）</Text>
        </Pressable>
        <Pressable style={styles.entry}>
          <Text style={styles.entryText}>设置（即将支持）</Text>
        </Pressable>
      </View>

      {!!status && <Text style={styles.status}>{status}</Text>}

      <Pressable style={styles.dangerBtn} onPress={onLogout}>
        <Text style={styles.dangerBtnText}>退出登录</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: AppTheme.colors.card,
    borderRadius: AppTheme.radius.lg,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginBottom: 10,
  },
  kv: {
    color: AppTheme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.md,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: AppTheme.radius.md,
    alignItems: 'center',
    paddingVertical: 11,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  entry: {
    backgroundColor: AppTheme.colors.cardSoft,
    borderRadius: AppTheme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    marginBottom: 8,
  },
  entryText: { color: AppTheme.colors.textSecondary },
  status: {
    color: AppTheme.colors.success,
    marginBottom: 10,
  },
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: AppTheme.radius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerBtnText: {
    color: AppTheme.colors.danger,
    fontWeight: '700',
  },
});
