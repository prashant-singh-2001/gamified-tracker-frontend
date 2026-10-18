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
