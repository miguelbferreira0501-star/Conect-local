/** Contratos de dados da API (compartilhados entre servidor, app e futuro painel empresarial). */
import type { BadgeId } from './badges';
import type { OpeningHours } from './hours';
import type { PriceType } from './format';
import type { ReviewAspect, ServiceMode } from './schemas';

export interface StateDTO { uf: string; name: string; region: string }
export interface CityDTO { ibge: number; name: string; uf: string; lat: number; lon: number; timezone: string }

export interface CategoryDTO {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
}

export interface RatingSummary {
  count: number;
  average: number | null;
}

export interface BusinessCardDTO {
  id: string;
  slug: string;
  name: string;
  professionalName: string | null;
  category: Pick<CategoryDTO, 'slug' | 'name' | 'shortName' | 'icon'>;
  shortDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  rating: RatingSummary;
  city: { ibge: number; name: string; uf: string };
  neighborhood: string | null;
  /** Relação com a cidade buscada. */
  locationMatch: 'establishmentInCity' | 'servesCity' | 'onlineOnly';
  distanceKm: number | null;
  topServices: string[];
  priceLevel: number | null;
  modes: ServiceMode[];
  acceptsBooking: boolean;
  acceptsQuote: boolean;
  openNow: boolean | null;
  badges: BadgeId[];
  isNewcomer: boolean;
  isDemo: boolean;
  createdAt: string;
  rankingExplanation?: string[];
}

export interface SearchResponse {
  items: BusinessCardDTO[];
  total: number;
  page: number;
  pageSize: number;
  city: CityDTO;
  appliedSort: string;
  distanceAvailable: boolean;
  /** Cidades próximas com empresas, quando a busca não encontra nada. */
  nearbyCities?: Array<{ ibge: number; name: string; uf: string; distanceKm: number; businesses: number }>;
}

export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  priceType: PriceType;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  durationMinutes: number | null;
  bookable: boolean;
  bookingMode: 'slot' | 'period' | 'day';
  notes: string | null;
}

export interface PublicStaffDTO {
  id: string;
  name: string;
  roleTitle: string | null;
  kind: 'person' | 'resource';
  /** Serviços que faz; vazio = todos */
  serviceIds: string[];
}

export interface PhotoDTO { id: string; url: string; caption: string | null }

export interface BusinessDetailDTO extends BusinessCardDTO {
  description: string | null;
  address: { street: string | null; neighborhood: string | null; postalCode: string | null; public: boolean };
  coordinates: { lat: number; lon: number } | null;
  serviceAreaCities: Array<{ ibge: number; name: string; uf: string }>;
  openingHours: OpeningHours | null;
  hoursUpdatedAt: string | null;
  hoursFresh: boolean;
  timezone: string;
  contact: {
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    email: string | null;
  };
  services: ServiceDTO[];
  photos: PhotoDTO[];
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  aspectAverages: Partial<Record<ReviewAspect, number>>;
  verifiedAt: string | null;
  isFavorite: boolean;
  staff: PublicStaffDTO[];
  /** Como o app chama quem atende nesta categoria ("Profissional", "Quadra"...) */
  staffLabel: string;
}

export interface ReviewDTO {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  aspects: Partial<Record<ReviewAspect, number>>;
  verifiedInteraction: boolean;
  serviceName: string | null;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  business?: { id: string; slug: string; name: string };
}

export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'declined';
export type QuoteStatus = 'sent' | 'answered' | 'hired' | 'closed';

export interface ActivityDTO {
  id: string;
  type: 'booking' | 'quote';
  status: BookingStatus | QuoteStatus;
  business: { id: string; slug: string; name: string; logoUrl: string | null; categoryName: string };
  serviceName: string | null;
  startsAt: string | null;
  preferredDate: string | null;
  description: string | null;
  createdAt: string;
  canReview: boolean;
  reviewId: string | null;
  canMarkDone: boolean;
  canCancel: boolean;
  /** Mensagem da empresa (resposta ao orçamento ou observação no agendamento). */
  businessMessage: string | null;
  bookingMode?: 'slot' | 'period' | 'day';
  period?: string | null;
  staffName?: string | null;
  partySize?: number | null;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cityIbge: number | null;
  createdAt: string;
}

export interface DiscoverSection {
  id: string;
  title: string;
  subtitle?: string;
  items: BusinessCardDTO[];
}

export interface DiscoverResponse {
  city: CityDTO;
  totalBusinesses: number;
  sections: DiscoverSection[];
  popularServices: Array<{ name: string; requests: number }>;
}

export interface SuggestionDTO {
  type: 'category' | 'service' | 'business';
  label: string;
  value: string;
  slug?: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
