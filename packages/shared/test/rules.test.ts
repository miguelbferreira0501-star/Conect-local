import { describe, expect, it } from 'vitest';
import {
  bayesianRating, rankBusiness, interleaveNewcomers, isNewcomer, computeBadges,
  formatRating, formatServicePrice, textRelevance, normalize, isOpenAt, publicAuthorName,
  reviewInputSchema, registerSchema, searchQuerySchema, profileCompleteness, haversineKm,
} from '../src';

const now = new Date('2026-10-01T12:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

describe('ranking', () => {
  it('uma única avaliação 5 estrelas não supera centenas de avaliações consistentes', () => {
    const base = { completeness: 0.8, textRelevance: 1, location: 'establishmentInCity' as const };
    const one = rankBusiness({ ...base, stats: { count: 1, average: 5, stddev: 0, lastReviewAt: daysAgo(2) } }, 4.2, now);
    const many = rankBusiness({ ...base, stats: { count: 240, average: 4.7, stddev: 0.5, lastReviewAt: daysAgo(3) } }, 4.2, now);
    expect(many.score).toBeGreaterThan(one.score);
  });

  it('média bayesiana aproxima-se da média real com mais avaliações', () => {
    expect(bayesianRating({ count: 0, average: null, stddev: null, lastReviewAt: null }, 4)).toBe(4);
    expect(bayesianRating({ count: 1000, average: 4.9, stddev: 0.2, lastReviewAt: null }, 4)).toBeCloseTo(4.89, 2);
  });

  it('relevância textual e localização multiplicam o resultado', () => {
    const stats = { count: 50, average: 4.5, stddev: 0.6, lastReviewAt: daysAgo(10) };
    const local = rankBusiness({ stats, completeness: 1, textRelevance: 1, location: 'establishmentInCity' }, 4, now);
    const remote = rankBusiness({ stats, completeness: 1, textRelevance: 1, location: 'servesCity' }, 4, now);
    const weakText = rankBusiness({ stats, completeness: 1, textRelevance: 0.4, location: 'establishmentInCity' }, 4, now);
    expect(local.score).toBeGreaterThan(remote.score);
    expect(local.score).toBeGreaterThan(weakText.score);
  });

  it('reserva vagas de descoberta para empresas novas', () => {
    const list = Array.from({ length: 10 }, (_, i) => ({ id: i, isNew: i === 9 }));
    const out = interleaveNewcomers(list, (x) => x.isNew, 6);
    expect(out[5].id).toBe(9);
    expect(out).toHaveLength(10);
  });

  it('identifica empresas novas', () => {
    expect(isNewcomer(daysAgo(10), 2, now)).toBe(true);
    expect(isNewcomer(daysAgo(200), 0, now)).toBe(false);
  });
});

describe('selos', () => {
  const base = {
    verifiedAt: null, reviewCount: 0, average: null, stddev: null, firstReviewAt: null, lastReviewAt: null,
    requestsReceived: 0, requestsAnswered: 0, acceptsBooking: false, hasBookableService: false, hasOpeningHours: false,
  };
  it('não concede selos sem critérios', () => expect(computeBadges(base)).toEqual([]));
  it('concede histórico consistente apenas com critérios cumpridos', () => {
    const ok = computeBadges({ ...base, reviewCount: 30, average: 4.6, stddev: 0.5, firstReviewAt: daysAgo(400), lastReviewAt: daysAgo(5) });
    expect(ok).toContain('consistent_history');
    const tooShort = computeBadges({ ...base, reviewCount: 30, average: 4.6, stddev: 0.5, firstReviewAt: daysAgo(60), lastReviewAt: daysAgo(5) });
    expect(tooShort).not.toContain('consistent_history');
  });
  it('agenda disponível exige serviço agendável e horários', () => {
    expect(computeBadges({ ...base, acceptsBooking: true, hasBookableService: true, hasOpeningHours: true })).toContain('booking_available');
    expect(computeBadges({ ...base, acceptsBooking: true, hasBookableService: false, hasOpeningHours: true })).not.toContain('booking_available');
  });
  it('completude do perfil vai de 0 a 1', () => {
    expect(profileCompleteness({ servicesCount: 0, servicesWithPrice: 0, photosCount: 0, hasAddressOrArea: false })).toBe(0);
  });
});

describe('formatação', () => {
  it('nunca arredonda a nota para cima', () => {
    expect(formatRating(4.86)).toBe('4,8');
    expect(formatRating(4.8)).toBe('4,8');
    expect(formatRating(5)).toBe('5,0');
  });
  it('não inventa preços', () => {
    expect(formatServicePrice({ priceType: 'quote', priceMinCents: null, priceMaxCents: null })).toBe('Solicitar orçamento');
    expect(formatServicePrice({ priceType: 'fixed', priceMinCents: null, priceMaxCents: null })).toBe('Consulte o preço');
    expect(formatServicePrice({ priceType: 'from', priceMinCents: 8000, priceMaxCents: null })).toBe('A partir de R$ 80,00');
  });
  it('nome público do autor protege o sobrenome', () => {
    expect(publicAuthorName('maria da silva')).toBe('Maria S.');
  });
});

describe('busca textual', () => {
  const doc = {
    name: 'Luz & Força Instalações', categoryName: 'Reformas e manutenção residencial',
    categoryKeywords: ['eletricista', 'encanador'], services: ['Troca de disjuntor', 'Instalação de chuveiro'],
    neighborhood: 'América', description: 'Serviços elétricos residenciais',
  };
  it('ignora acentos e maiúsculas', () => {
    expect(normalize('Ação Elétrica')).toBe('acao eletrica');
    expect(textRelevance('ELETRICISTA', doc)).toBeGreaterThan(0.8);
    expect(textRelevance('chuveiro', doc)).toBeCloseTo(0.8);
  });
  it('retorna zero quando um termo não aparece', () => {
    expect(textRelevance('eletricista tatuagem', doc)).toBe(0);
  });
  it('trata plural simples', () => {
    expect(textRelevance('eletricistas', doc)).toBeGreaterThan(0);
  });
});

describe('horários', () => {
  it('respeita o fuso horário da cidade', () => {
    const hours = { '4': [['08:00', '18:00']] as Array<[string, string]> };
    // 2026-10-01 é quinta-feira; 12:00Z = 09:00 em São Paulo
    expect(isOpenAt(hours, now, 'America/Sao_Paulo')).toBe(true);
    expect(isOpenAt(hours, new Date('2026-10-01T22:00:00Z'), 'America/Sao_Paulo')).toBe(false);
  });
});

describe('validação', () => {
  const valid = {
    businessId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', activityType: 'booking', activityId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    rating: 5, comment: 'Atendimento excelente e pontual, recomendo muito.',
  };
  it('aceita avaliação válida', () => expect(reviewInputSchema.safeParse(valid).success).toBe(true));
  it('bloqueia links e telefones na avaliação', () => {
    expect(reviewInputSchema.safeParse({ ...valid, comment: 'Muito bom, veja www.site.com.br para mais' }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ ...valid, comment: 'Liguem para 99999-1234 que é ótimo' }).success).toBe(false);
  });
  it('exige senha com letras e números', () => {
    expect(registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'abcdefgh', acceptTerms: true }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'abcd1234', acceptTerms: true }).success).toBe(true);
  });
  it('interpreta filtros da busca', () => {
    const q = searchQuerySchema.parse({ city: '4209102', modes: 'online,at_customer', bookable: 'true' });
    expect(q.modes).toEqual(['online', 'at_customer']);
    expect(q.bookable).toBe(true);
    expect(searchQuerySchema.safeParse({ city: '123' }).success).toBe(false);
  });
});

it('distância entre Joinville e Florianópolis ~ 130 km', () => {
  expect(haversineKm(-26.3045, -48.8487, -27.5954, -48.548)).toBeGreaterThan(120);
});

it('muitas avaliações medianas não superam uma empresa nova bem avaliada', () => {
  const base = { completeness: 0.7, textRelevance: 1, location: 'establishmentInCity' as const };
  const mediocre = rankBusiness({ ...base, stats: { count: 40, average: 3.2, stddev: 1.2, lastReviewAt: daysAgo(10) } }, 4.3, now);
  const fresh = rankBusiness({ ...base, stats: { count: 1, average: 5, stddev: 0, lastReviewAt: daysAgo(10) } }, 4.3, now);
  expect(fresh.score).toBeGreaterThan(mediocre.score);
});
