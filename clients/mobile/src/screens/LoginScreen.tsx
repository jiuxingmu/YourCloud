import { Feather, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSdkClient } from '../context/SdkClientContext';
import { AppTheme } from '../ui/theme';
import { ToastMessage } from '../ui/ToastMessage';

type Props = {
  onLoggedIn: (token: string) => Promise<void>;
  onGoRegister: () => void;
};

export function LoginScreen({ onLoggedIn, onGoRegister }: Props) {
  const client = useSdkClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function normalizeEmailInput(input: string): string {
    return input.replace(/[。．]/g, '.').replace(/＠/g, '@');
  }

  function validate(): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !password) {
      setStatus({ type: 'error', message: '请输入邮箱和密码' });
      return false;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setStatus({ type: 'error', message: '请输入有效的邮箱地址' });
      return false;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: '密码至少需要 6 位' });
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setStatus({ type: 'info', message: '登录中...' });
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = await client.auth.login(normalizedEmail, password);
      if (!data.token) {
        setStatus({ type: 'error', message: '登录失败：未返回 token' });
        return;
      }
      await onLoggedIn(data.token);
      setStatus({ type: 'success', message: '登录成功' });
    } catch (error) {
      setStatus({ type: 'error', message: client.toUserFriendlyErrorMessage(error, 'auth') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YourCloud</Text>
      <Text style={styles.subtitle}>不限速、跨平台、可自部署的云盘</Text>
      <Text style={styles.label}>邮箱</Text>
      <View style={styles.inputWrap}>
        <Feather name="mail" size={18} color="#6B7280" style={styles.leftIcon} />
        <TextInput
          value={email}
          onChangeText={(text) => setEmail(normalizeEmailInput(text))}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
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
          placeholder="请输入密码"
          placeholderTextColor="#94A3B8"
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
        </Pressable>
      </View>

      <View style={styles.rememberRow}>
        <Pressable style={styles.rememberToggle} onPress={() => setRememberMe((v) => !v)}>
          <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={20} color={AppTheme.colors.primary} />
          <Text style={styles.rememberText}>记住我</Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.button, submitting && styles.buttonDisabled, pressed && styles.buttonPressed]} disabled={submitting} onPress={submit}>
        <Text style={styles.buttonText}>{submitting ? '处理中...' : '登录'}</Text>
      </Pressable>

      <Pressable>
        <Text style={styles.linkText}>忘记密码？</Text>
      </Pressable>

      <Pressable onPress={onGoRegister}>
        <Text style={styles.secondaryLink}>没有账号？去注册</Text>
      </Pressable>

      {status ? <ToastMessage type={status.type} message={status.message} onHidden={() => setStatus(null)} /> : null}
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rememberToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    color: AppTheme.colors.textSecondary,
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
  linkText: {
    color: AppTheme.colors.primary,
    marginTop: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  secondaryLink: {
    marginTop: 16,
    textAlign: 'center',
    color: AppTheme.colors.textSecondary,
  },
});
