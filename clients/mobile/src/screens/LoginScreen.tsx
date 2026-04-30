import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSdkClient } from '../context/SdkClientContext';

type Props = {
  onLoggedIn: (token: string) => Promise<void>;
};

export function LoginScreen({ onLoggedIn }: Props) {
  const client = useSdkClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('请登录');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    setStatus('登录中...');
    try {
      const data = await client.auth.login(email.trim().toLowerCase(), password);
      if (!data.token) {
        setStatus('登录失败：未返回 token');
        return;
      }
      await onLoggedIn(data.token);
      setStatus('登录成功');
    } catch (error) {
      setStatus(client.toUserFriendlyErrorMessage(error, 'auth'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YourCloud Login</Text>
      <Text style={styles.label}>邮箱</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <Text style={styles.label}>密码</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry autoCapitalize="none" />
      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} disabled={submitting} onPress={handleLogin}>
        <Text style={styles.buttonText}>{submitting ? '登录中...' : '登录'}</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#1f6feb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  status: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
  },
});
