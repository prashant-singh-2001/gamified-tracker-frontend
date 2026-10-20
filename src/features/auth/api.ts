import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/api/types';
import { endSession, startSession } from '@/lib/auth/session';

export function useLogin() {
  return useMutation({
    mutationFn: async (body: LoginRequest) =>
      (await api.post<AuthResponse>(endpoints.auth.login, body)).data,
    onSuccess: startSession,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (body: RegisterRequest) =>
      (await api.post<AuthResponse>(endpoints.auth.register, body)).data,
    onSuccess: startSession,
  });
}

/** Always answers the same way, whether or not the address has an account. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) =>
      (await api.post<{ message: string }>(endpoints.auth.forgot, { email })).data,
  });
}

/** 204 on success; 400 for a token that is unknown, expired or already used. */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (body: { token: string; newPassword: string }) => {
      await api.post(endpoints.auth.reset, body);
    },
  });
}

/** Clears tokens, the auth store and every cached query, then returns to the landing page. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    endSession();
    queryClient.clear();
    void navigate('/', { replace: true });
  };
}
