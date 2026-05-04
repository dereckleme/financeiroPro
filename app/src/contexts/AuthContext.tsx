import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthUser } from '../types';
import { clearAuth, loadAuth, saveAuth, fetchUserInfo, findOrCreateSpreadsheet } from '../services/auth';

WebBrowser.maybeCompleteAuthSession();

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  useEffect(() => {
    loadAuth()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (!authentication?.accessToken) return;

      setIsLoading(true);
      Promise.all([
        fetchUserInfo(authentication.accessToken),
        findOrCreateSpreadsheet(authentication.accessToken),
      ])
        .then(([userInfo, spreadsheetId]) => {
          const authUser: AuthUser = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            accessToken: authentication.accessToken,
            refreshToken: authentication.refreshToken ?? undefined,
            expiresAt: authentication.expirationDate
              ? new Date(authentication.expirationDate).getTime()
              : Date.now() + 3600 * 1000,
            spreadsheetId,
          };
          return saveAuth(authUser).then(() => authUser);
        })
        .then(setUser)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [response]);

  async function signIn() {
    await promptAsync();
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
