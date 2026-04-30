import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { createSdkClient } from '@yourcloud/sdk';
import { AuthenticatedSessionProvider } from './src/context/AuthenticatedSessionContext';
import { SdkClientProvider } from './src/context/SdkClientContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { loadApiBaseUrl, saveApiBaseUrl } from './src/storage/appConfigStorage';
import { clearToken, loadToken, saveToken } from './src/storage/tokenStorage';

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://10.0.2.2:8080');
  const [token, setToken] = useState('');
  const [bootstrapping, setBootstrapping] = useState(true);

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
            <LoginScreen onLoggedIn={handleLoggedIn} />
          )}
        </SdkClientProvider>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
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
