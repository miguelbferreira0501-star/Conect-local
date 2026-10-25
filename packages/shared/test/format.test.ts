import { describe, expect, it } from 'vitest';
import { comparePriceWithCity, median, reminderMessage, serviceReferenceCents, whatsappLink } from '../src';

describe('preço justo', () => {
  const ref = { medianCents: 10000, businesses: 4 };
  it('compara com a mediana da cidade', () => {
    expect(comparePriceWithCity({ priceType: 'fixed', priceMinCents: 8000, priceMaxCents: null }, ref)?.tone).toBe('below');
    expect(comparePriceWithCity({ priceType: 'fixed', priceMinCents: 10500, priceMaxCents: null }, ref)?.tone).toBe('average');
    expect(comparePriceWithCity({ priceType: 'range', priceMinCents: 10000, priceMaxCents: 16000 }, ref)?.tone).toBe('above');
  });
  it('não compara orçamento nem com poucas empresas', () => {
    expect(comparePriceWithCity({ priceType: 'quote', priceMinCents: null, priceMaxCents: null }, ref)).toBeNull();
    expect(comparePriceWithCity({ priceType: 'fixed', priceMinCents: 5000, priceMaxCents: null }, { medianCents: 9000, businesses: 2 })).toBeNull();
    expect(serviceReferenceCents({ priceType: 'range', priceMinCents: 100, priceMaxCents: 300 })).toBe(200);
  });
  it('mediana', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 10])).toBe(3);
  });
});

describe('WhatsApp', () => {
  it('monta link só com telefone válido', () => {
    expect(whatsappLink('(47) 99999-1234')).toBe('https://wa.me/5547999991234');
    expect(whatsappLink('+55 47 99999-1234', 'oi')).toBe('https://wa.me/5547999991234?text=oi');
    expect(whatsappLink('123')).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });
  it('lembrete com pessoas e horário', () => {
    const t = reminderMessage({ businessName: 'Cantina', customerName: 'Ana Souza', serviceName: 'Reserva de mesa', startsAt: '2026-11-03T22:30:00Z', mode: 'slot', period: null, partySize: 4, timezone: 'America/Sao_Paulo' });
    expect(t).toContain('Olá, Ana!');
    expect(t).toContain('para 4 pessoas');
    expect(t).toContain('19:30');
  });
});
