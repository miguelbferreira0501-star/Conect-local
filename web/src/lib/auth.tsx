import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput, UserDTO } from '@conecta/shared';
import { api } from './api';

interface AuthState {
  user: UserDTO | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<UserDTO>;
  register: (input: RegisterInput) => Promise<UserDTO>;
  logout: () => Promise<void>;
  refresh: () => void;
}

const PUBLIC_KEYS = new Set(['me', 'config', 'states', 'cities', 'categories']);

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: UserDTO | null }>('/auth/me').then((r) => r.user),
    staleTime: 5 * 60_000,
  });

  const afterAuth = (user: UserDTO) => {
    qc.setQueryData(['me'], user);
    // Dados que dependem de quem está logado (favoritos, "isMine" etc.) são descartados para não exibir estado antigo.
    qc.removeQueries({ predicate: (q) => !PUBLIC_KEYS.has(String(q.queryKey[0])) });
    return user;
  };

  const value: AuthState = {
    user: me.data ?? null,
    loading: me.isLoading,
    login: async (input) => afterAuth((await api.post<{ user: UserDTO }>('/auth/login', input)).user),
    register: async (input) => afterAuth((await api.post<{ user: UserDTO }>('/auth/register', input)).user),
    logout: async () => {
      await api.post('/auth/logout');
      qc.setQueryData(['me'], null);
      qc.removeQueries({ predicate: (q) => !PUBLIC_KEYS.has(String(q.queryKey[0])) });
    },
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider ausente');
  return ctx;
}
