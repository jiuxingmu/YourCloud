import * as SecureStore from 'expo-secure-store';

const API_BASE_URL_KEY = 'yourcloud_api_base_url';

export async function loadApiBaseUrl(): Promise<string | null> {
  return await SecureStore.getItemAsync(API_BASE_URL_KEY);
}

export async function saveApiBaseUrl(apiBaseUrl: string): Promise<void> {
  await SecureStore.setItemAsync(API_BASE_URL_KEY, apiBaseUrl);
}
