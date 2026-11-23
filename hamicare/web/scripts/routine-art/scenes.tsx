// Cenas das rotinas do Crescer (o Hami fazendo cada rotina). Gera src/assets/routines/*.webp:
//   npx esbuild scripts/routine-art/scenes.tsx --bundle --platform=node --jsx=automatic --outfile=/tmp/rt.cjs && node /tmp/rt.cjs /tmp/rt.html
//   depois tire um print de cada quadro (id = rotina) em 2x e salve como webp 640x480.
import { renderToStaticMarkup } from 'react-dom/server';
import { Hamster } from '../../src/components/Hamster';
import { Glyph } from '../../src/components/art';
import { ROUTINES } from '../../src/data/routines';

const E = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };
type Obj = { e: string; x: number; y: number; s: number; r?: number; front?: boolean };
type Scene = { mat?: string; mood?: any; prop?: any; pose?: any; shine?: boolean; outfit?: Record<string, string>; hx?: number; hs?: number; objs: Obj[]; lines?: 'l' | 'r' };
// Coordenadas num quadro de 400 x 300 (centro dos objetos; s = tamanho).
const S: Record<string, Scene> = {
  manha: { pose: 'tchau', mood: 'feliz', outfit: { roupa: 'pijama-nuvem-rosa' }, objs: [{ e: '🌅', x: 318, y: 78, s: 96 }, { e: '🛏️', x: 76, y: 236, s: 110, front: true }, { e: '💧', x: 336, y: 250, s: 58, front: true }] },
  noite: { mood: 'sono', outfit: { roupa: 'pijama' }, objs: [{ e: '🌙', x: 320, y: 70, s: 92 }, { e: '⭐', x: 70, y: 60, s: 40 }, { e: '⭐', x: 262, y: 40, s: 26 }, { e: '🕯️', x: 70, y: 238, s: 86, front: true }, { e: '🧸', x: 334, y: 244, s: 84, front: true }], lines: 'l' },
  ansiedade: { mood: 'calmo', objs: [{ e: '🌬️', x: 82, y: 92, s: 86 }, { e: '🫧', x: 322, y: 74, s: 70 }, { e: '🍃', x: 340, y: 170, s: 52 }, { e: '🍃', x: 334, y: 246, s: 66, front: true }, { e: '💬', x: 72, y: 228, s: 76, front: true }] },
  sol: { mood: 'animado', outfit: { chapeu: 'palha', oculos: 'sol' }, objs: [{ e: '☀️', x: 322, y: 70, s: 98 }, { e: '🌳', x: 70, y: 210, s: 130 }, { e: '🦋', x: 92, y: 66, s: 44 }, { e: '🚰', x: 336, y: 244, s: 74, front: true }] },
  gratidao: { mood: 'feliz', outfit: { chapeu: 'coroa' }, objs: [{ e: '🌻', x: 74, y: 220, s: 120, front: true }, { e: '💌', x: 330, y: 238, s: 72, front: true }, { e: '💛', x: 326, y: 80, s: 52 }, { e: '💛', x: 286, y: 44, s: 30 }], lines: 'l' },
  basico: { mood: 'feliz', shine: true, objs: [{ e: '🛁', x: 82, y: 232, s: 116, front: true }, { e: '🪥', x: 334, y: 236, s: 76, front: true }, { e: '🧴', x: 300, y: 250, s: 56, front: true }, { e: '🫧', x: 320, y: 80, s: 66 }, { e: '🫧', x: 76, y: 92, s: 40 }] },
  carinho: { mood: 'feliz', objs: [{ e: '🫶', x: 202, y: 198, s: 120, front: true }, { e: '💛', x: 78, y: 120, s: 44 }, { e: '💛', x: 330, y: 84, s: 56 }, { e: '🧸', x: 334, y: 246, s: 78, front: true }], lines: 'l' },
  foco: { mood: 'calmo', prop: 'livro', objs: [{ e: '⏰', x: 326, y: 80, s: 84 }, { e: '🧩', x: 76, y: 236, s: 86, front: true }, { e: '📝', x: 334, y: 242, s: 76, front: true }, { e: '⭐', x: 82, y: 74, s: 40 }] },
  cabeca: { mood: 'calmo', prop: 'desenho', objs: [{ e: '💭', x: 316, y: 72, s: 86 }, { e: '🌿', x: 66, y: 222, s: 100, front: true }, { e: '📔', x: 336, y: 242, s: 76, front: true }, { e: '🍃', x: 84, y: 74, s: 44 }] },
  mexer: { mood: 'risada', outfit: { roupa: 'regata' }, objs: [{ e: '🪩', x: 322, y: 70, s: 90 }, { e: '🎵', x: 76, y: 90, s: 56 }, { e: '🎵', x: 344, y: 180, s: 40 }, { e: '👟', x: 76, y: 248, s: 76, front: true }], lines: 'l' },
  energia: { mood: 'animado', outfit: { roupa: 'regata', chapeu: 'bone' }, objs: [{ e: '⚡', x: 324, y: 78, s: 80 }, { e: '👟', x: 74, y: 246, s: 80, front: true }, { e: '🚰', x: 336, y: 240, s: 78, front: true }], lines: 'l' },
  yoga: { mood: 'calmo', mat: '#8A63D2', objs: [{ e: '🌸', x: 80, y: 84, s: 56 }, { e: '🕯️', x: 72, y: 236, s: 86, front: true }, { e: '🌿', x: 332, y: 228, s: 96, front: true }, { e: '🫧', x: 322, y: 74, s: 56 }] },
  domingo: { mood: 'sono', prop: 'fones', objs: [{ e: '🛋️', x: 200, y: 232, s: 250 }, { e: '🎵', x: 318, y: 74, s: 56 }, { e: '🎵', x: 88, y: 84, s: 40 }, { e: '☕', x: 346, y: 254, s: 58, front: true }], hx: 200 },
  dormir: { mood: 'dormindo', outfit: { roupa: 'pijama-nuvem-azul' }, objs: [{ e: '🌙', x: 318, y: 72, s: 88 }, { e: '💤', x: 286, y: 150, s: 56 }, { e: '☁️', x: 82, y: 80, s: 76 }, { e: '⏰', x: 76, y: 244, s: 70, front: true }] },
  casa15: { mood: 'feliz', outfit: { roupa: 'avental' }, objs: [{ e: '🧹', x: 82, y: 210, s: 130, front: true }, { e: '🍽️', x: 336, y: 248, s: 70, front: true }, { e: '🫧', x: 322, y: 80, s: 60 }], lines: 'l' },
  quarto: { mood: 'feliz', outfit: { roupa: 'jardineira' }, objs: [{ e: '🪴', x: 72, y: 222, s: 110, front: true }, { e: '👕', x: 334, y: 244, s: 74, front: true }, { e: '🛏️', x: 326, y: 96, s: 90 }], lines: 'l' },
  estudo: { mood: 'feliz', prop: 'livro', outfit: { oculos: 'redondos' }, objs: [{ e: '💡', x: 322, y: 74, s: 80 }, { e: '📚', x: 74, y: 238, s: 96, front: true }, { e: '💧', x: 340, y: 250, s: 56, front: true }] },
  trabalho: { mood: 'feliz', outfit: { acessorio: 'gravata' }, objs: [{ e: '⏰', x: 324, y: 78, s: 86 }, { e: '💼', x: 78, y: 240, s: 90, front: true }, { e: '☕', x: 338, y: 250, s: 62, front: true }], lines: 'l' },
};

const shade = (hex: string) => `color-mix(in srgb, ${hex} 82%, #6b4a2a)`;
function Lines({ side }: { side: 'l' | 'r' }) {
  const x = side === 'l' ? 120 : 280;
  const f = side === 'l' ? 1 : -1;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }} width="400" height="300" viewBox="0 0 400 300">
      <g fill="#FFFFFF" opacity="0.75">
        <rect x={x - 6} y={52} width="12" height="34" rx="6" transform={`rotate(${-20 * f} ${x} 69)`} />
        <rect x={x - 38 * f - 6} y={74} width="12" height="30" rx="6" transform={`rotate(${-52 * f} ${x - 38 * f} 89)`} />
        <rect x={x - 50 * f - 6} y={112} width="12" height="26" rx="6" transform={`rotate(${-82 * f} ${x - 50 * f} 125)`} />
      </g>
    </svg>
  );
}

function Scene({ id, tone }: { id: string; tone: string }) {
  const sc = S[id];
  const hs = sc.hs ?? 244;
  const hx = sc.hx ?? 200;
  const obj = (o: Obj, i: number) => (
    <div key={i} style={{ position: 'absolute', left: o.x - o.s / 2, top: o.y - o.s / 2 - (o.front ? 12 : 0), width: o.s, height: o.s, transform: o.r ? `rotate(${o.r}deg)` : undefined, display: 'grid', placeItems: 'center' }}>
      <Glyph e={o.e} size={Math.round(o.s * 1.22)} />
    </div>
  );
  return (
    <div id={id} style={{ position: 'relative', width: 400, height: 300, background: tone, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 262, height: 30, borderRadius: '50%', background: shade(tone), opacity: 0.5 }} />
      {sc.mat && <div style={{ position: 'absolute', left: 96, right: 96, top: 258, height: 34, borderRadius: 18, background: sc.mat, opacity: 0.85 }} />}
      {sc.objs.filter((o) => !o.front).map(obj)}
      {sc.lines && <Lines side={sc.lines} />}
      <div style={{ position: 'absolute', left: hx - hs / 2, top: 290 - hs, width: hs, height: hs }}>
        <Hamster fur="caramelo" size={hs} idle={false} growth={1} mood={sc.mood} prop={sc.prop} pose={sc.pose} shine={sc.shine} outfit={{ ...E, ...(sc.outfit ?? {}) }} label="" />
      </div>
      {sc.objs.filter((o) => o.front).map(obj)}
    </div>
  );
}

const html = renderToStaticMarkup(
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: 1240, padding: 10, background: '#fff' }}>
    {ROUTINES.map((r) => <Scene key={r.id} id={r.id} tone={r.tone} />)}
  </div>,
);
require('fs').writeFileSync(process.argv[2], `<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box}body{margin:0;font-family:sans-serif}</style><body>${html}</body>`);
