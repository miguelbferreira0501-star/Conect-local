import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LiveUpdateDTO, PetDTO, PetInput } from '@conecta/shared';
import { api } from './api';
import { useAuth } from './auth';

export function usePets() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['pets'], queryFn: () => api.get<PetDTO[]>('/me/pets'), enabled: !!user, staleTime: 60_000 });
}

export function useSavePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, photo }: { id: string | null; data: PetInput; photo?: string | null }) =>
      (id ? api.put<PetDTO>(`/me/pets/${id}`, data) : api.post<PetDTO>('/me/pets', data)).then(async (pet) =>
        photo !== undefined ? api.put<PetDTO>(`/me/pets/${pet.id}/photo`, { dataUrl: photo }) : pet),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/pets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

/** Linha do tempo do Pet ao Vivo. Atualiza sozinha enquanto o atendimento está acontecendo. */
export function useLive(bookingId: string | undefined, opts: { live: boolean; panelBusinessId?: string }) {
  const path = opts.panelBusinessId ? `/panel/businesses/${opts.panelBusinessId}/bookings/${bookingId}/live` : `/bookings/${bookingId}/live`;
  return useQuery({
    queryKey: ['live', bookingId],
    queryFn: () => api.get<LiveUpdateDTO[]>(path),
    enabled: !!bookingId,
    refetchInterval: opts.live ? 15_000 : false,
    staleTime: 5_000,
  });
}
