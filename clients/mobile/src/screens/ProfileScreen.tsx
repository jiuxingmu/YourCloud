import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useAuthenticatedSession } from '../context/AuthenticatedSessionContext';
import { useSdkClient } from '../context/SdkClientContext';
import { ScalePressable } from '../ui/ScalePressable';

type Me = { id: number; email: string };

export function ProfileScreen() {
  const client = useSdkClient();
  const { onLogout, initialApiBaseUrl, onApiBaseUrlChange } = useAuthenticatedSession();
  const [me, setMe] = useState<Me | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(initialApiBaseUrl);
  const [status, setStatus] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

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
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="overflow-hidden px-4 pb-5 pt-6">
        <View className="absolute inset-0 bg-blue-100" />
        <View className="absolute -left-8 -top-5 h-32 w-32 rounded-full bg-blue-200/40" />
        <View className="absolute -right-10 top-2 h-40 w-40 rounded-full bg-indigo-200/30" />
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <Feather name="user" size={24} color="#fff" />
          </View>
          <Text className="mt-3 text-2xl font-bold text-slate-900">YourCloud 用户</Text>
          <Text className="mt-1 text-sm text-slate-600">{me?.email ?? '-'}</Text>
        </View>
      </View>

      <View className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-lg shadow-slate-200">
        <Text className="mb-3 text-lg font-semibold text-slate-800">云盘功能</Text>
        <View className="rounded-2xl bg-slate-100 px-2 py-3">
          <View className="flex-row">
            {[
              ['star', '收藏'],
              ['share-2', '分享'],
              ['trash-2', '回收站'],
              ['download', '已下载'],
            ].map(([icon, label]) => (
              <ScalePressable key={label} className="w-1/4 items-center gap-2 py-1.5">
                <Feather name={icon as keyof typeof Feather.glyphMap} size={16} color="#2563EB" />
                <Text className="text-sm text-slate-700">{label}</Text>
              </ScalePressable>
            ))}
          </View>
        </View>
      </View>

      <View className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-lg shadow-slate-200">
        <Text className="mb-3 text-lg font-semibold text-slate-800">连接配置</Text>
        <TextInput
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          className={`mb-3 rounded-2xl px-4 py-3 text-sm text-slate-800 ${inputFocused ? 'border border-blue-500 bg-white' : 'bg-slate-100'}`}
          autoCapitalize="none"
        />
        <ScalePressable className="items-center rounded-2xl bg-blue-600 py-3" onPress={saveApiBaseUrl}>
          <Text className="text-sm font-semibold text-white">保存 API 地址</Text>
        </ScalePressable>
      </View>

      <View className="mx-4 mt-3 rounded-2xl bg-white p-4 shadow-lg shadow-slate-200">
        <View className="flex-row items-center gap-3 py-2">
          <Feather name="moon" size={16} color="#64748B" />
          <Text className="text-base text-slate-700">夜间模式（即将支持）</Text>
        </View>
        <View className="flex-row items-center gap-3 py-2">
          <Feather name="settings" size={16} color="#64748B" />
          <Text className="text-base text-slate-700">设置</Text>
        </View>
        <View className="flex-row items-center gap-3 py-2">
          <Feather name="message-circle" size={16} color="#64748B" />
          <Text className="text-base text-slate-700">反馈</Text>
        </View>
      </View>

      {!!status && <Text className="mx-4 mt-3 text-sm text-emerald-600">{status}</Text>}

      <ScalePressable className="mx-4 mt-3 items-center rounded-2xl bg-rose-50 py-3" onPress={onLogout}>
        <Text className="text-sm font-semibold text-rose-600">退出登录</Text>
      </ScalePressable>
    </ScrollView>
  );
}
