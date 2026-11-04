import { describe, expect, it } from 'vitest';
import { app } from './helpers';
import { assetLinks, normalizeFingerprint } from '../src/routes/stores';

const FP = 'AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89';

describe('o que as lojas pedem do site', () => {
  it('vínculo do app Android: aceita impressões com ou sem dois-pontos, várias chaves, e recusa as inválidas', () => {
    expect(normalizeFingerprint(FP.toLowerCase().replace(/:/g, ''))).toBe(FP);
    expect(normalizeFingerprint('123')).toBeNull();
    expect(assetLinks(undefined, FP)).toBeNull();
    expect(assetLinks('com.hamicare.app', '')).toBeNull();
    const other = FP.replace(/^AB/, 'CC');
    const links = assetLinks('com.hamicare.app', `${FP}, ${other.toLowerCase()}, lixo, ${FP}`)!;
    expect(links[0].relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(links[0].target).toEqual({ namespace: 'android_app', package_name: 'com.hamicare.app', sha256_cert_fingerprints: [FP, other] });
  });

  it('sem o app configurado, o arquivo de vínculo não existe; a página de excluir conta abre', async () => {
    expect((await app.request('/.well-known/assetlinks.json')).status).toBe(404);
    const r = await app.request('/excluir-conta');
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toMatch(/Excluir minha conta/);
    expect(html).toMatch(/até 30 dias/);
  });
});
