import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSdkClient } from '../context/SdkClientContext';

type ResolvedShare = {
  token: string;
  filename: string;
  mimeType?: string;
};

export function ShareAccessScreen() {
  const client = useSdkClient();
  const [token, setToken] = useState('');
  const [extractCode, setExtractCode] = useState('');
  const [resolving, setResolving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState('');
  const [resolved, setResolved] = useState<ResolvedShare | null>(null);

  async function resolveShare() {
    const cleanedToken = token.trim();
    if (!cleanedToken) {
      setStatus('请输入分享 token');
      return;
    }

    setResolving(true);
    setStatus('');
    setResolved(null);
    try {
      const data = await client.shareGetByToken(cleanedToken, extractCode.trim());
      setResolved({
        token: cleanedToken,
        filename: data.file.filename,
        mimeType: data.file.mimeType,
      });
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setResolving(false);
    }
  }

  async function downloadSharedFile() {
    if (!resolved) return;
    setDownloading(true);
    setStatus('');
    try {
      await Linking.openURL(client.shareBuildDownloadUrlWithCode(resolved.token, extractCode.trim()));
      setStatus('正在下载分享文件...');
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'files'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>访问分享</Text>
      <Text style={styles.subtitle}>输入分享 token 和提取码后可访问分享文件</Text>

      <Text style={styles.label}>分享 token</Text>
      <TextInput
        value={token}
        onChangeText={(text) => {
          setToken(text);
          setResolved(null);
          setStatus('');
        }}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="例如：x7K9mP2Q"
      />

      <Text style={styles.label}>提取码（可选）</Text>
      <TextInput
        value={extractCode}
        onChangeText={setExtractCode}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="如有提取码请填写"
      />

      <Pressable style={[styles.primaryBtn, resolving && styles.btnDisabled]} onPress={resolveShare} disabled={resolving}>
        {resolving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>访问分享</Text>}
      </Pressable>

      {resolved ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultFilename} numberOfLines={1}>
            {resolved.filename}
          </Text>
          <Text style={styles.resultMeta}>{resolved.mimeType || 'unknown'}</Text>
          <Pressable style={[styles.secondaryBtn, downloading && styles.btnDisabled]} onPress={downloadSharedFile} disabled={downloading}>
            <Text style={styles.secondaryBtnText}>{downloading ? '处理中...' : '下载文件'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0B1324',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#EEF4FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  resultCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: 12,
  },
  resultFilename: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resultMeta: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
  },
  status: {
    marginTop: 12,
    color: '#475569',
  },
});
