import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createSdkClient } from '@yourcloud/sdk';
import './global.css';
import { AuthenticatedSessionProvider } from './src/context/AuthenticatedSessionContext';
import { SdkClientProvider } from './src/context/SdkClientContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { loadApiBaseUrl, saveApiBaseUrl } from './src/storage/appConfigStorage';
import { clearToken, loadToken, saveToken } from './src/storage/tokenStorage';

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://10.0.2.2:8080');
  const [token, setToken] = useState('');
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [animatingAuth, setAnimatingAuth] = useState(false);
  const authOpacity = useRef(new Animated.Value(1)).current;
  const authTranslateX = useRef(new Animated.Value(0)).current;

  const client = useMemo(() => {
    return createSdkClient({
      apiBaseUrl: apiBaseUrl.trim() || 'http://10.0.2.2:8080',
      tokenStore: {
        getToken: () => token || null,
      },
    });
  }, [apiBaseUrl, token]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrapToken() {
      try {
        const savedApiBaseUrl = await loadApiBaseUrl();
        if (!cancelled && savedApiBaseUrl?.trim()) {
          setApiBaseUrl(savedApiBaseUrl);
        }
        const cached = await loadToken();
        if (!cancelled && cached) {
          setToken(cached);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }
    bootstrapToken();
    return () => {
      cancelled = true;
    };
  }, []);

  function switchAuthPage(next: 'login' | 'register') {
    if (next === authPage || animatingAuth) return;
    const isForward = authPage === 'login' && next === 'register';
    const incomingStartX = isForward ? 24 : -24;
    const outgoingX = isForward ? -12 : 12;

    setAnimatingAuth(true);
    Animated.parallel([
      Animated.timing(authOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(authTranslateX, {
        toValue: outgoingX,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAuthPage(next);
      authOpacity.setValue(0);
      authTranslateX.setValue(incomingStartX);
      Animated.parallel([
        Animated.timing(authOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(authTranslateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatingAuth(false);
      });
    });
  }

  async function handleLoggedIn(nextToken: string) {
    await saveToken(nextToken);
    setToken(nextToken);
  }

  async function handleLogout() {
    await clearToken();
    setToken('');
  }

  async function handleApiBaseUrlChange(next: string) {
    setApiBaseUrl(next);
    await saveApiBaseUrl(next);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {bootstrapping ? (
          <View style={styles.bootContainer}>
            <ActivityIndicator />
          </View>
        ) : (
          <SdkClientProvider client={client}>
            {token ? (
              <AuthenticatedSessionProvider
                value={{
                  onLogout: handleLogout,
                  initialApiBaseUrl: apiBaseUrl,
                  onApiBaseUrlChange: handleApiBaseUrlChange,
                }}
              >
                <AppNavigator />
              </AuthenticatedSessionProvider>
            ) : (
              <Animated.View
                style={{
                  flex: 1,
                  opacity: authOpacity,
                  transform: [{ translateX: authTranslateX }],
                }}
              >
                {authPage === 'login' ? (
                  <LoginScreen onLoggedIn={handleLoggedIn} onGoRegister={() => switchAuthPage('register')} />
                ) : (
                  <RegisterScreen onLoggedIn={handleLoggedIn} onGoLogin={() => switchAuthPage('login')} />
                )}
              </Animated.View>
            )}
          </SdkClientProvider>
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
