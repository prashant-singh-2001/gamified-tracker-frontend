import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/auth/authStore';
import { refreshSession } from '@/lib/auth/session';
import { API_BASE_URL } from './config';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

function isAuthRequest(url: string | undefined): boolean {
  return !!url && url.includes('/auth/');
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;

    const original = error.config as RetriableConfig | undefined;
    if (!original || original._retried || isAuthRequest(original.url)) throw error;
    original._retried = true;

    const sentWith = String(original.headers.get('Authorization') ?? '');
    const current = useAuthStore.getState().accessToken;

    // Another request already refreshed while this one was in flight: just retry with the new token.
    const token = current && sentWith !== `Bearer ${current}` ? current : await refreshSession();

    original.headers.set('Authorization', `Bearer ${token}`);
    return api(original);
  },
);
