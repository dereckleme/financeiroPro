import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { AuthUser } from '../types';
import { findOrCreateSpreadsheet } from './googleSheets';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const STORAGE_KEY = 'financeiro_pro_auth';

export function getClientId(): string {
  return (
    Constants.expoConfig?.extra?.googleClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
    ''
  );
}

export function getIosClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
}

export async function saveAuth(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(user));
}

export async function loadAuth(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AuthUser;
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export async function isTokenValid(user: AuthUser): Promise<boolean> {
  return user.expiresAt > Date.now() + 60_000;
}

export async function fetchUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  email: string;
  picture?: string;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}

export function buildAuthRequest(redirectUri: string) {
  return new AuthSession.AuthRequest({
    clientId: getClientId(),
    scopes: SCOPES,
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const clientId = getClientId();
  const res = await fetch(GOOGLE_DISCOVERY.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function signInWithGoogle(redirectUri: string): Promise<AuthUser> {
  const request = buildAuthRequest(redirectUri);
  await request.makeAuthUrlAsync(GOOGLE_DISCOVERY);
  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type !== 'success') {
    throw new Error('Auth cancelled or failed');
  }

  const { code } = result.params;
  const codeVerifier = request.codeVerifier ?? '';

  const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);
  const userInfo = await fetchUserInfo(tokens.accessToken);
  const spreadsheetId = await findOrCreateSpreadsheet(tokens.accessToken);

  const user: AuthUser = {
    id: userInfo.id,
    name: userInfo.name,
    email: userInfo.email,
    picture: userInfo.picture,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
    spreadsheetId,
  };

  await saveAuth(user);
  return user;
}
