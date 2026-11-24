// Os Hamis 3D que estão na tela: um laço só (requestAnimationFrame) desenha cada um no renderizador compartilhado e
// copia para o quadrinho dele. Quem sai da tela (ou a aba fica escondida) para de ser desenhado.
import * as THREE from 'three';
import { HamiScene, sharedRenderer } from './stage';
import type { Hami3DAction, Hami3DLook, Hami3DMood } from './rig';

export interface ViewOpts {
  look: Hami3DLook;
  mood: Hami3DMood;
  action: Hami3DAction;
  wet?: boolean;
}

interface View {
  scene: HamiScene;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  still: boolean;
  drawn: boolean;
}

const views = new Set<View>();
let raf = 0;
const t0 = performance.now();
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function tick() {
  raf = 0;
  const t = (performance.now() - t0) / 1000;
  let any = false;
  for (const v of views) {
    if (!v.visible || document.hidden) continue;
    if (v.still && v.drawn) continue;
    paint(v, v.still ? 1.2 : t);
    any = true;
  }
  if (any || [...views].some((v) => !v.still)) raf = requestAnimationFrame(tick);
}

function paint(v: View, t: number) {
  const w = v.canvas.width;
  const h = v.canvas.height;
  const out = v.scene.draw(w, h, t);
  if (!out) return;
  v.ctx.clearRect(0, 0, w, h);
  v.ctx.drawImage(out.canvas, out.sx, out.sy, out.sw, out.sh, 0, 0, w, h);
  v.drawn = true;
}

const wake = () => {
  if (!raf) raf = requestAnimationFrame(tick);
};

/** O aparelho consegue desenhar em 3D? */
export const has3D = () => sharedRenderer() !== null;

/** Põe um Hami 3D num canvas. Devolve as funções para atualizar e para tirar. */
export function mountHami(canvas: HTMLCanvasElement, opts: ViewOpts, still: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !has3D()) return null;
  const scene = new HamiScene(opts.look);
  const v: View = { scene, canvas, ctx, visible: true, still: still || reduced(), drawn: false };
  const apply = (o: ViewOpts) => {
    scene.rig.setFur(o.look.fur);
    scene.rig.setMood(o.mood);
    scene.rig.setAction(o.action, (performance.now() - t0) / 1000);
    scene.rig.setWet(!!o.wet);
    scene.frame(canvas.width / canvas.height, o.action === 'dormir');
    v.drawn = false;
    wake();
  };
  apply(opts);
  views.add(v);
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => es.forEach((e) => ((v.visible = e.isIntersecting), wake()))) : null;
  io?.observe(canvas);
  wake();
  return {
    scene,
    update: apply,
    redraw: () => ((v.drawn = false), wake()),
    resize: () => (scene.frame(canvas.width / canvas.height, scene.rig.action === 'dormir'), (v.drawn = false), wake()),
    unmount: () => {
      views.delete(v);
      io?.disconnect();
      scene.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
    },
  };
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wake);
