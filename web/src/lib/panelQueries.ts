/** Dados do painel das empresas (React Query). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PanelBusinessDTO, PanelRequestDTO, PanelReviewDTO } from '@conecta/shared';
import { api } from './api';
import { useAuth } from './auth';

export const useMyBusinesses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['panel', 'mine'],
    queryFn: () => api.get<Array<{ id: string; slug: string; name: string; status: string; role: string }>>('/panel/businesses'),
    enabled: !!user,
  });
};

export const usePanelBusiness = (id: string | undefined) =>
  useQuery({ queryKey: ['panel', 'business', id], queryFn: () => api.get<PanelBusinessDTO>(`/panel/businesses/${id}`), enabled: !!id });

export const usePanelRequests = (id: string | undefined) =>
  useQuery({ queryKey: ['panel', 'requests', id], queryFn: () => api.get<PanelRequestDTO[]>(`/panel/businesses/${id}/requests`), enabled: !!id, staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true, refetchInterval: 30_000 });

export const usePanelReviews = (id: string | undefined) =>
  useQuery({ queryKey: ['panel', 'reviews', id], queryFn: () => api.get<PanelReviewDTO[]>(`/panel/businesses/${id}/reviews`), enabled: !!id });

/** Mutação genérica do painel que atualiza os dados da empresa ao terminar. */
export function usePanelMutation<TBody>(businessId: string | undefined, fn: (body: TBody) => Promise<unknown>, extraKeys: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['panel', 'business', businessId] });
      qc.invalidateQueries({ queryKey: ['panel', 'mine'] });
      for (const k of extraKeys) qc.invalidateQueries({ queryKey: ['panel', k, businessId] });
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['search'] });
      qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });
}
