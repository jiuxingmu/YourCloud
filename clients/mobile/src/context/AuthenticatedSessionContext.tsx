import { createContext, useContext, type ReactNode } from 'react';

export type AuthenticatedSessionValue = {
  onLogout: () => Promise<void>;
  initialApiBaseUrl: string;
  onApiBaseUrlChange: (next: string) => Promise<void>;
};

const AuthenticatedSessionContext = createContext<AuthenticatedSessionValue | null>(null);

export function AuthenticatedSessionProvider({ value, children }: { value: AuthenticatedSessionValue; children: ReactNode }) {
  return <AuthenticatedSessionContext.Provider value={value}>{children}</AuthenticatedSessionContext.Provider>;
}

export function useAuthenticatedSession(): AuthenticatedSessionValue {
  const ctx = useContext(AuthenticatedSessionContext);
  if (!ctx) {
    throw new Error('useAuthenticatedSession must be used within AuthenticatedSessionProvider');
  }
  return ctx;
}
