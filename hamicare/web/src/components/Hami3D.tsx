// O Hami 3D na tela: o boneco de verdade (hami3d/), com a pelagem e a roupa da pessoa, o humor e a ação de agora
// (parado, acenando, festa, andando, dormindo). A estampa da roupa (coração, ursinho, listras…) é a mesma da Loja,
// aplicada no tecido; chapéu, óculos, colar e fantasias vão presos na cabeça e no pescoço. Sem WebGL no aparelho,
// mostra o Hami desenhado de antes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { mountHami } from '../hami3d/view';
import type { Hami3DAction, Hami3DLook, Hami3DMood } from '../hami3d/rig';
import { FabricFilter, Hamster } from './Hamster';
import { Accessory, Clothes, CostumeBack, CostumeFront, EffectFront, Glasses, Hat, costumeOf, garmentColor, garmentShape } from './Wear';
import type { Outfit, PetMood } from '../types';

const MOOD: Record<string, Hami3DMood> = {
  feliz: 'feliz',
  animado: 'feliz',
  comendo: 'feliz',
  boca: 'surpreso',
  surpreso: 'surpreso',
  risada: 'risada',
  calmo: 'calmo',
  sono: 'sono',
  dormindo: 'dormindo',
  manha: 'triste',
  choro: 'triste',
};

const shade = (hex: string, t: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - t);
  return `#${c.getHexString()}`;
};

/** A roupa vira o tecido do boneco: cor principal, cor de detalhe e o formato. */
export function clothOf(roupa: string | null | undefined): Hami3DLook['cloth'] {
  if (!roupa) return null;
  const it = itemById(roupa);
  const costume = costumeOf(roupa);
  if (costume) return { c1: costume.c1, c2: costume.c2, shape: 'costume' };
  const c1 = garmentColor(roupa) ?? it?.c1 ?? null;
  if (!c1) return null;
  return { c1, c2: it?.c2 ?? shade(c1, 0.15), shape: garmentShape(roupa) === 'dress' ? 'dress' : 'top' };
}

const BODY_GEO = { top: 30, w: 52, h: 163, eyeY: 72 };
const HEAD_GEO = { top: 40, w: 46, h: 150, eyeY: 70 };
const SVG = (inner: string, view = '0 0 200 200') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" width="512" height="${view === '0 0 200 200' ? 512 : 300}">${inner}</svg>`;

/** Desenha um SVG num canvas e devolve a textura (carrega sozinho). */
function svgTexture(svg: string, w = 512, h = 512): Promise<THREE.Texture | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      res(tex);
    };
    img.onerror = () => res(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const markup = (el: JSX.Element) => renderToStaticMarkup(el);

async function decorTextures(outfit: Outfit | undefined) {
  if (!outfit) return { front: null, back: null, neck: null, cloth: null };
  const costume = costumeOf(outfit.roupa);
  const filt = markup(
    <defs>
      <FabricFilter id="t" />
    </defs>,
  );
  const head =
    outfit.chapeu || outfit.oculos || costume
      ? markup(
          <g filter="url(#t)">
            {costume && <CostumeFront id={outfit.roupa} geo={HEAD_GEO} />}
            <Glasses id={outfit.oculos} eyeY={80} ex={25} />
            <Hat id={outfit.chapeu} geo={HEAD_GEO} />
          </g>,
        )
      : null;
  const back = costume ? markup(<CostumeBack id={outfit.roupa} geo={{ ...HEAD_GEO, top: 37, w: 62 }} />) : null;
  const neck =
    outfit.acessorio || outfit.efeito
      ? markup(
          <g>
            <g filter="url(#t)">
              <Accessory id={outfit.acessorio} geo={{ top: 86, h: 64, w: 52, eyeY: 72 }} paw="#FFF4EE" head={{ cx: 99, cy: 78, rx: 66, ry: 45 }} />
            </g>
            <EffectFront id={outfit.efeito} geo={BODY_GEO} />
          </g>,
        )
      : null;
  const cl = clothOf(outfit.roupa);
  const cloth =
    cl && !costume
      ? markup(
          <g>
            <rect x="0" y="0" width="200" height="200" fill={cl.c1} />
            <Clothes id={outfit.roupa} geo={BODY_GEO} />
          </g>,
        )
      : null;
  const [front, backT, neckT, clothT] = await Promise.all([
    head ? svgTexture(SVG(filt + head)) : null,
    back ? svgTexture(SVG(filt + back)) : null,
    neck ? svgTexture(SVG(filt + neck)) : null,
    cloth ? svgTexture(SVG(cloth, '40 118 120 70'), 512, 300) : null,
  ]);
  return { front, back: backT, neck: neckT, cloth: clothT };
}

export interface Hami3DProps {
  fur: string;
  outfit?: Outfit;
  mood?: PetMood;
  action?: Hami3DAction;
  /** Largura em px (a altura acompanha). */
  size?: number;
  /** Desenha uma vez só (sem animar). */
  still?: boolean;
  wet?: boolean;
  label?: string;
  className?: string;
}

export function Hami3D({ fur, outfit, mood = 'feliz', action = 'parado', size = 170, still = false, wet, label, className }: Hami3DProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ReturnType<typeof mountHami>>(null);
  const [fallback, setFallback] = useState(false);
  const f = furById(fur);
  const cloth = clothOf(outfit?.roupa);
  const look = useMemo<Hami3DLook>(
    () => ({ fur: { body: f.body, belly: `#${new THREE.Color(f.belly).lerp(new THREE.Color('#FFFFFF'), 0.6).getHexString()}`, ear: f.ear }, cloth }),
    [f.body, f.belly, f.ear, cloth?.c1, cloth?.c2, cloth?.shape],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const m3 = MOOD[mood] ?? 'feliz';
  const lying = action === 'dormir';
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const w = size;
  const h = Math.round(size * (lying ? 0.78 : 1.12));

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const hd = mountHami(c, { look, mood: m3, action, wet }, still);
    if (!hd) {
      setFallback(true);
      return;
    }
    handle.current = hd;
    return () => {
      hd.unmount();
      handle.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handle.current?.scene.rig.setCloth(look.cloth ?? null);
  }, [look]);
  useEffect(() => {
    handle.current?.update({ look, mood: m3, action, wet });
  }, [look, m3, action, wet, w, h]);

  // estampa da roupa e enfeites (carregam do desenho de cada peça)
  const decoKey = outfit ? [outfit.roupa, outfit.chapeu, outfit.oculos, outfit.acessorio, outfit.efeito].join('|') : '';
  useEffect(() => {
    let alive = true;
    decorTextures(outfit).then((d) => {
      const hd = handle.current;
      if (!alive || !hd) return;
      hd.scene.rig.setDecor(d.front, d.back, d.neck);
      hd.scene.rig.setClothMap(d.cloth);
      hd.redraw();
    });
    return () => {
      alive = false;
    };
  }, [decoKey, !!handle.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (fallback) return <Hamster fur={fur} outfit={outfit} mood={lying ? 'dormindo' : mood} size={size} label={label} wet={wet} />;
  return <canvas ref={ref} className={className} width={Math.round(w * dpr)} height={Math.round(h * dpr)} style={{ width: w, height: h, display: 'block' }} role="img" aria-label={label ?? 'Hami'} />;
}
