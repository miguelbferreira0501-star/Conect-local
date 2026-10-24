/** Hooks de dados (React Query). Componentes visuais não chamam fetch diretamente. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActivityDTO, BusinessCardDTO, BusinessDetailDTO, CategoryDTO, CityDTO, DiscoverResponse, ReviewDTO, SearchResponse, StateDTO, SuggestionDTO,
} from '@conecta/shared';
import { api, qs } from './api';
import { useAuth } from './auth';

export const useConfig = () =>
  useQuery({ queryKey: ['config'], queryFn: () => api.get<{ demoMode: boolean }>('/config'), staleTime: Infinity });

export const useStates = () => useQuery({ queryKey: ['states'], queryFn: () => api.get<StateDTO[]>('/locations/states'), staleTime: Infinity });

export const useCities = (uf: string | null) =>
  useQuery({
    queryKey: ['cities', uf],
    queryFn: () => api.get<Array<{ ibge: number; name: string }>>(`/locations/states/${uf}/cities`),
    enabled: !!uf,
    staleTime: Infinity,
  });

export const fetchCity = (ibge: number) => api.get<CityDTO>(`/locations/cities/${ibge}`);
export const fetchNearestCity = (lat: number, lon: number) => api.get<CityDTO>(`/locations/nearest${qs({ lat, lon })}`);

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api.get<CategoryDTO[]>('/categories'), staleTime: 10 * 60_000 });

export const useDiscover = (city: number | undefined) =>
  useQuery({ queryKey: ['discover', city], queryFn: () => api.get<DiscoverResponse>(`/discover?city=${city}`), enabled: !!city });

export interface SearchParams {
  city: number;
  q?: string;
  category?: string;
  neighborhood?: string;
  minRating?: number;
  minReviews?: number;
  priceLevels?: number[];
  modes?: string[];
  bookable?: boolean;
  sort?: string;
  lat?: number;
  lon?: number;
  page?: number;
}

export const useSearch = (p: SearchParams | null) =>
  useQuery({
    queryKey: ['search', p],
    queryFn: () => api.get<SearchResponse>(`/search${qs({ ...p })}`),
    enabled: !!p,
    placeholderData: keepPreviousData,
  });

export const useSuggest = (city: number | undefined, q: string) =>
  useQuery({
    queryKey: ['suggest', city, q],
    queryFn: () => api.get<SuggestionDTO[]>(`/search/suggest${qs({ city, q })}`),
    enabled: !!city && q.trim().length >= 2,
    staleTime: 60_000,
  });

export const useBusiness = (slug: string | undefined) =>
  useQuery({ queryKey: ['business', slug], queryFn: () => api.get<BusinessDetailDTO>(`/businesses/${slug}`), enabled: !!slug });

export const useReviews = (businessId: string | undefined, sort: string, page: number, rating?: number) =>
  useQuery({
    queryKey: ['reviews', businessId, sort, page, rating],
    queryFn: () =>
      api.get<{ items: Array<ReviewDTO & { replyBody?: string; replyAt?: string }>; total: number; page: number; pageSize: number }>(
        `/businesses/${businessId}/reviews${qs({ sort, page, rating })}`,
      ),
    enabled: !!businessId,
    placeholderData: keepPreviousData,
  });

export const useAvailability = (businessId: string | undefined, serviceId: string | undefined, date: string | undefined) =>
  useQuery({
    queryKey: ['availability', businessId, serviceId, date],
    queryFn: () =>
      api.get<{ date: string; durationMinutes: number; slots: Array<{ startsAt: string; label: string }> }>(
        `/businesses/${businessId}/availability${qs({ serviceId, date })}`,
      ),
    enabled: !!businessId && !!serviceId && !!date,
  });

export const useFavorites = () => {
  const { user } = useAuth();
  return useQuery({ queryKey: ['favorites'], queryFn: () => api.get<BusinessCardDTO[]>('/me/favorites'), enabled: !!user });
};

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      favorite ? api.put(`/me/favorites/${id}`) : api.delete(`/me/favorites/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['business'] });
    },
  });
};

export const useActivities = () => {
  const { user } = useAuth();
  return useQuery({ queryKey: ['activities'], queryFn: () => api.get<ActivityDTO[]>('/me/activities'), enabled: !!user });
};

export const useMyReviews = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => api.get<Array<ReviewDTO & { status: string; business: { id: string; slug: string; name: string } }>>('/me/reviews'),
    enabled: !!user,
  });
};
