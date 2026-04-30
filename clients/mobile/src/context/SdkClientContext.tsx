import { createContext, useContext, type ReactNode } from 'react';
import type { ReturnTypeCreateClient } from '../types/sdk';

const SdkClientContext = createContext<ReturnTypeCreateClient | null>(null);

export function SdkClientProvider({ client, children }: { client: ReturnTypeCreateClient; children: ReactNode }) {
  return <SdkClientContext.Provider value={client}>{children}</SdkClientContext.Provider>;
}

export function useSdkClient(): ReturnTypeCreateClient {
  const ctx = useContext(SdkClientContext);
  if (!ctx) {
    throw new Error('useSdkClient must be used within SdkClientProvider');
  }
  return ctx;
}
