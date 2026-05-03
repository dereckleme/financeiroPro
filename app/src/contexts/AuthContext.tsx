import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { AuthUser } from '../types';
import {
  clearAuth,
  loadAuth,
  saveAuth,
  signInWithGoogle,
} from '../services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const redirectUri = Linking.createURL('/');

  async function signIn() {
    setIsLoading(true);
    try {
      const authUser = await signInWithGoogle(redirectUri);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await clearAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
