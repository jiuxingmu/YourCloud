import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthenticatedSession } from '../context/AuthenticatedSessionContext';
import { useSdkClient } from '../context/SdkClientContext';

type Me = { id: number; email: string };

export function ProfileScreen() {
  const client = useSdkClient();
  const { onLogout, initialApiBaseUrl, onApiBaseUrlChange } = useAuthenticatedSession();
  const [me, setMe] = useState<Me | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(initialApiBaseUrl);
  const [status, setStatus] = useState('');

  const loadMe = useCallback(async () => {
    try {
      const data = await client.auth.me<Me>();
      setMe(data);
      setStatus('');
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'auth'));
    }
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      void loadMe();
    }, [loadMe]),
  );

  async function saveApiBaseUrl() {
    await onApiBaseUrlChange(apiBaseUrl.trim() || 'http://10.0.2.2:8080');
    setStatus('连接地址已保存');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.name}>YourCloud 用户</Text>
        <Text style={styles.email}>{me?.email ?? '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>云盘功能</Text>
        <View style={styles.grid}>
          {[
            ['star-outline', '收藏'],
            ['share-social-outline', '分享'],
            ['trash-outline', '回收站'],
            ['download-outline', '已下载'],
          ].map(([icon, label]) => (
            <Pressable key={label} style={styles.gridItem}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color="#3D73F5" />
              <Text style={styles.gridText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>连接配置</Text>
        <TextInput value={apiBaseUrl} onChangeText={setApiBaseUrl} style={styles.input} autoCapitalize="none" />
        <Pressable style={styles.primaryBtn} onPress={saveApiBaseUrl}>
          <Text style={styles.primaryBtnText}>保存 API 地址</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.rowItem}>
          <Ionicons name="moon-outline" size={20} color="#64748B" />
          <Text style={styles.rowText}>夜间模式（即将支持）</Text>
        </View>
        <View style={styles.rowItem}>
          <Ionicons name="settings-outline" size={20} color="#64748B" />
          <Text style={styles.rowText}>设置</Text>
        </View>
        <View style={styles.rowItem}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color="#64748B" />
          <Text style={styles.rowText}>反馈</Text>
        </View>
      </View>

      {!!status && <Text style={styles.status}>{status}</Text>}

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#DDEAFF',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#4C7BF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    marginTop: 4,
    color: '#526074',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF2',
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
  },
  gridText: {
    fontSize: 13,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  rowText: {
    fontSize: 15,
    color: '#334155',
  },
  status: {
    marginHorizontal: 16,
    marginTop: 10,
    color: '#16A34A',
  },
  logout: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    color: '#E11D48',
    fontWeight: '700',
  },
});
