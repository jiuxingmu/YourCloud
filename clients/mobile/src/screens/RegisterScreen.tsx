import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSdkClient } from '../context/SdkClientContext';
import { AppTheme } from '../ui/theme';

type Props = {
  onLoggedIn: (token: string) => Promise<void>;
  onGoLogin: () => void;
};

export function RegisterScreen({ onLoggedIn, onGoLogin }: Props) {
  const client = useSdkClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  function validate(): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !password) {
      Alert.alert('提示', '请输入邮箱和密码');
      return false;
    }
    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('提示', '注册密码至少需要 6 位');
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setStatus('注册中...');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await client.auth.register(normalizedEmail, password);
      const loginData = await client.auth.login(normalizedEmail, password);
      if (!loginData.token) {
        setStatus('注册成功，请返回登录');
        return;
      }
      await onLoggedIn(loginData.token);
      setStatus('注册并登录成功');
    } catch (e) {
      setStatus(client.toUserFriendlyErrorMessage(e, 'auth'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>创建账号</Text>
      <Text style={styles.subtitle}>注册后即可访问你的云盘</Text>

      <Text style={styles.label}>邮箱</Text>
      <View style={styles.inputWrap}>
        <Feather name="mail" size={18} color="#6B7280" style={styles.leftIcon} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <Text style={styles.label}>密码</Text>
      <View style={styles.inputWrap}>
        <Feather name="lock" size={18} color="#6B7280" style={styles.leftIcon} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholder="至少 6 位"
          placeholderTextColor="#94A3B8"
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.button, submitting && styles.buttonDisabled, pressed && styles.buttonPressed]} disabled={submitting} onPress={submit}>
        <Text style={styles.buttonText}>{submitting ? '处理中...' : '创建账户'}</Text>
      </Pressable>

      <Pressable onPress={onGoLogin}>
        <Text style={styles.secondaryLink}>已有账号？返回登录</Text>
      </Pressable>

      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 84,
    backgroundColor: AppTheme.colors.bg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: AppTheme.colors.textSecondary,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: AppTheme.colors.text,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.radius.md,
    backgroundColor: '#EEF2F9',
    marginBottom: 14,
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 2,
  },
  input: {
    borderRadius: AppTheme.radius.md,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 15,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 11,
  },
  button: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: AppTheme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryLink: {
    marginTop: 16,
    textAlign: 'center',
    color: AppTheme.colors.textSecondary,
  },
  status: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
  },
});
