import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hamster } from '../components/Hamster';
import { ITEMS, LOOKS, WEARABLE_KINDS } from './items';
import { FURS } from './fur';
import { LIBRARY } from './tasks';

const empty = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };

describe('catálogo', () => {
  it('ids únicos e preços válidos', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of ITEMS) expect(i.price).toBeGreaterThanOrEqual(0);
    expect(new Set(FURS.map((f) => f.id)).size).toBe(FURS.length);
  });

  it('tem muita coisa para vestir', () => {
    const wear = ITEMS.filter((i) => WEARABLE_KINDS.includes(i.kind));
    expect(wear.length).toBeGreaterThan(150);
    expect(ITEMS.filter((i) => i.kind === 'efeito').length).toBeGreaterThanOrEqual(10);
  });

  it('toda peça aparece desenhada no Hami', () => {
    const base = renderToStaticMarkup(<Hamster fur="caramelo" outfit={empty} idle={false} />);
    const missing = ITEMS.filter((i) => WEARABLE_KINDS.includes(i.kind)).filter((i) => {
      const html = renderToStaticMarkup(<Hamster fur="caramelo" outfit={{ ...empty, [i.kind]: i.id }} idle={false} />);
      return html === base;
    });
    expect(missing.map((i) => i.id)).toEqual([]);
  });

  it('variações de cor mudam o desenho', () => {
    const a = renderToStaticMarkup(<Hamster fur="caramelo" outfit={{ ...empty, chapeu: 'gorro-rosa' }} idle={false} />);
    const b = renderToStaticMarkup(<Hamster fur="caramelo" outfit={{ ...empty, chapeu: 'gorro-roxo' }} idle={false} />);
    expect(a).not.toBe(b);
  });

  it('looks: peças existem e cada uma vai num lugar diferente', () => {
    for (const look of LOOKS) {
      const items = look.items.map((id) => ITEMS.find((i) => i.id === id));
      expect(items.every(Boolean), look.id).toBe(true);
      const slots = items.map((i) => i!.kind);
      expect(slots.every((k) => WEARABLE_KINDS.includes(k)), look.id).toBe(true);
      expect(new Set(slots).size, look.id).toBe(slots.length);
    }
  });

  it('missões são só hábitos: nenhuma comida na lista', () => {
    const food = /comer|fruta|lanche|vitamina|castanha|refei|salada|açúcar|refrigerante/i;
    expect(LIBRARY.filter((t) => food.test(t.title)).map((t) => t.id)).toEqual([]);
    expect(LIBRARY.filter((t) => (t.gain ?? 0) > 0).map((t) => t.id)).toEqual([]);
  });
});
