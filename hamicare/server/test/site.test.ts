import { describe, expect, it } from 'vitest';
import { app, setupDatabase } from './helpers';

setupDatabase();

describe('site do Lumbi', () => {
  it('mostra a página de apresentação com a Google Play e os Guardiões', async () => {
    const r = await app.request('/site');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('Seu novo melhor amigo de autocuidado.');
    expect(html).toContain('play.google.com/store/apps/details?id=com.hamicare.app');
    expect(html).toContain('Ser Aliado');
    expect(html).toContain('R$ 9,90');
  });
});
