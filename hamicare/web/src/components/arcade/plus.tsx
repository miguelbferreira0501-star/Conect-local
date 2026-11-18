// Jogos do HamiCare+: vôlei na praia, skate radical e pula nuvens.
import { useEffect, useRef, useState } from 'react';
import { Glyph } from '../art';
import { play } from '../../lib/sound';
import { Ball, HoldPad, Hud, Me, Sprite, useBox, useLoop } from './kit';

type End = (score: number) => void;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Setas do teclado viram os mesmos comandos dos botões da tela. */
function useKeys(map: Record<string, (down: boolean) => void>) {
  useEffect(() => {
    const on = (down: boolean) => (e: KeyboardEvent) => {
      const f = map[e.key];
      if (f) (e.preventDefault(), f(down));
    };
    const d = on(true);
    const u = on(false);
    window.addEventListener('keydown', d);
    window.addEventListener('keyup', u);
    return () => (window.removeEventListener('keydown', d), window.removeEventListener('keyup', u));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ---------- Vôlei na praia ----------

const WIN = 5;
interface Body { x: number; y: number; vx: number; vy: number; cd: number }

export function Volley({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const PR = 32;
  const BR = 17;
  const me = useRef<Body>({ x: -1, y: 0, vx: 0, vy: 0, cd: 0 });
  const cpu = useRef<Body>({ x: -1, y: 0, vx: 0, vy: 0, cd: 0 });
  const ball = useRef({ x: -1, y: 0, vx: 0, vy: 0, rot: 0 });
  const keys = useRef({ l: false, r: false, j: false });
  const pause = useRef(1);
  const [pts, setPts] = useState({ me: 0, cpu: 0 });
  const ptsRef = useRef({ me: 0, cpu: 0 });
  const [banner, setBanner] = useState<string | null>(null);
  const over = useRef(false);
  const serve = (side: 'me' | 'cpu') => {
    const { w, h } = size.current;
    Object.assign(ball.current, { x: side === 'me' ? w * 0.25 : w * 0.75, y: h * 0.25, vx: 0, vy: 0 });
    pause.current = 0.8;
  };
  useLoop(true, (dt) => {
    const { w, h } = size.current;
    const gy = h - 26;
    const net = { x: w / 2, top: gy - h * 0.32 };
    if (me.current.x < 0) Object.assign(me.current, { x: w * 0.25, y: gy });
    if (cpu.current.x < 0) Object.assign(cpu.current, { x: w * 0.75, y: gy });
    if (ball.current.x < 0) serve('me');
    if (over.current) return;
    const b = ball.current;
    // Jogadores: você nos botões, o rival segue a bola.
    const m = me.current;
    m.vx = ((keys.current.r ? 1 : 0) - (keys.current.l ? 1 : 0)) * 280;
    if (keys.current.j && m.y >= gy) (m.vy = -600), play('pulo');
    const c = cpu.current;
    let target = w * 0.75;
    if (b.x > w / 2 - 30 || b.vx > 0) {
      const fall = Math.max(0.05, (gy - PR * 2 - b.y) / Math.max(120, b.vy + 260));
      target = clamp(b.x + b.vx * fall * 0.6 + 16, w / 2 + PR, w - PR);
    }
    c.vx = clamp((target - c.x) * 6, -235, 235);
    if (c.y >= gy && Math.abs(b.x - c.x) < 70 && b.y < gy - 110 && b.y > gy - 240 && b.vy > 0) c.vy = -560;
    for (const p of [m, c]) {
      p.vy += 1500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > gy) (p.y = gy), (p.vy = 0);
      p.cd = Math.max(0, p.cd - dt);
    }
    m.x = clamp(m.x, PR, w / 2 - 6 - PR);
    c.x = clamp(c.x, w / 2 + 6 + PR, w - PR);
    if (pause.current > 0) {
      pause.current -= dt;
      return;
    }
    // Bola
    b.vy += 560 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rot += b.vx * dt * 2;
    if (b.x < BR) (b.x = BR), (b.vx = Math.abs(b.vx));
    if (b.x > w - BR) (b.x = w - BR), (b.vx = -Math.abs(b.vx));
    if (b.y < BR) (b.y = BR), (b.vy = Math.abs(b.vy) * 0.5);
    if (Math.abs(b.x - net.x) < BR + 5 && b.y > net.top) {
      if (b.y - net.top < BR && b.vy > 0) b.vy = -Math.abs(b.vy) * 0.7;
      else (b.x = net.x + Math.sign(b.x - net.x || -b.vx) * (BR + 6)), (b.vx = -b.vx * 0.7);
    }
    for (const [p, dir] of [[m, 1], [c, -1]] as const) {
      const cx = p.x;
      const cy = p.y - PR * 1.4;
      const dx = b.x - cx;
      const dy = b.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < PR + BR && p.cd <= 0) {
        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        b.x = cx + nx * (PR + BR + 1);
        b.y = cy + ny * (PR + BR + 1);
        const sp = Math.max(520, Math.hypot(b.vx, b.vy) * 0.9);
        b.vx = nx * sp + p.vx * 0.35 + dir * 140;
        b.vy = Math.min(ny * sp, -430) + Math.min(0, p.vy * 0.2);
        p.cd = 0.18;
        play('quica');
      }
    }
    if (b.y > gy - BR) {
      const mine = b.x > w / 2;
      const next = { me: ptsRef.current.me + (mine ? 1 : 0), cpu: ptsRef.current.cpu + (mine ? 0 : 1) };
      ptsRef.current = next;
      setPts(next);
      play(mine ? 'brilho' : 'quica');
      if (next.me >= WIN || next.cpu >= WIN) {
        over.current = true;
        const won = next.me >= WIN;
        setBanner(won ? 'Você venceu!' : 'Quase lá!');
        setTimeout(() => end(next.me * 2 + (won ? 4 : 0)), 1100);
      } else {
        setBanner(mine ? 'Ponto seu!' : 'Ponto do rival');
        setTimeout(() => setBanner(null), 800);
        serve(mine ? 'me' : 'cpu');
      }
    }
  });
  const set = (k: 'l' | 'r' | 'j') => (down: boolean) => (keys.current[k] = down);
  useKeys({ ArrowLeft: set('l'), ArrowRight: set('r'), ArrowUp: set('j'), ' ': set('j') });
  const { w, h } = size.current;
  const gy = h - 26;
  const netTop = gy - h * 0.32;
  const b = ball.current;
  return (
    <>
      <Hud
        items={[
          { icon: '🏐', text: `Você ${pts.me} × ${pts.cpu} Rival`, label: 'Placar' },
          { icon: '🏆', text: `até ${WIN}`, label: 'Vence quem fizer' },
        ]}
      />
      <div ref={ref} className="arc-stage arc-beach">
        <span className="arc-sea" />
        <span className="arc-sun" />
        <span className="arc-boat" style={{ left: '70%' }}>⛵</span>
        <span className="arc-net" style={{ left: w / 2 - 4, top: netTop, height: gy - netTop }} />
        <div className="arc-obj" style={{ transform: `translate(${me.current.x - 40}px, ${me.current.y - 84}px)` }}>
          <Me size={80} mood="animado" />
        </div>
        <div className="arc-obj" style={{ transform: `translate(${cpu.current.x - 40}px, ${cpu.current.y - 84}px)` }}>
          <Sprite fur="nuvem" size={80} mood="feliz" />
        </div>
        <div className="arc-obj" style={{ transform: `translate(${b.x - BR}px, ${b.y - BR}px) rotate(${b.rot}deg)` }}>
          <Ball r={BR} kind="volei" />
        </div>
        {banner && <p className={`arc-banner ${banner.includes('seu') || banner.includes('venceu') ? 'is-good' : ''}`}>{banner}</p>}
      </div>
      <div className="arc-pads">
        <HoldPad label="Andar para a esquerda" onChange={set('l')}>◀</HoldPad>
        <HoldPad label="Pular" onChange={set('j')} className="arc-pad-jump">
          ⤒
        </HoldPad>
        <HoldPad label="Andar para a direita" onChange={set('r')}>▶</HoldPad>
      </div>
    </>
  );
}

// ---------- Skate radical ----------

interface Block { id: number; x: number; w: number; h: number; kind: 'cone' | 'caixa' | 'banco' }
interface Seed { id: number; x: number; y: number }
const CITY = Array.from({ length: 9 }, (_, i) => ({ w: 46 + ((i * 37) % 40), h: 70 + ((i * 53) % 90), c: ['#C9B8F2', '#B4DBFA', '#FFC6DA', '#AEE6CC'][i % 4] }));

function Board({ tilt }: { tilt: number }) {
  return (
    <svg width="92" height="26" viewBox="0 0 92 26" aria-hidden="true" className="block" style={{ transform: `rotate(${tilt}deg)` }}>
      <path d="M6 6 H86 Q92 6 90 12 L88 14 H4 L2 12 Q0 6 6 6Z" fill="#FF6F91" stroke="#fff" strokeWidth="2.5" />
      <path d="M20 9 H72" stroke="#FFE27A" strokeWidth="3" strokeDasharray="6 5" />
      <circle cx="20" cy="20" r="5.5" fill="#3a2f55" />
      <circle cx="72" cy="20" r="5.5" fill="#3a2f55" />
    </svg>
  );
}

export function Skate({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const hami = useRef({ y: -1, vy: 0, jumps: 0 });
  const blocks = useRef<Block[]>([]);
  const seeds = useRef<Seed[]>([]);
  const dist = useRef(0);
  const time = useRef(0);
  const next = useRef(1.2);
  const nextSeed = useRef(0.8);
  const got = useRef(0);
  const over = useRef(false);
  const [, setScore] = useState(0);
  const score = () => Math.floor(dist.current / 40) + got.current * 3;
  useLoop(true, (dt) => {
    const { w, h } = size.current;
    const gy = h - 46;
    const hx = w * 0.22;
    const p = hami.current;
    if (p.y < 0) p.y = gy;
    if (over.current) return;
    time.current += dt;
    const speed = Math.min(560, 250 + time.current * 9);
    dist.current += speed * dt;
    p.vy += 1900 * dt;
    p.y += p.vy * dt;
    if (p.y >= gy) (p.y = gy), (p.vy = 0), (p.jumps = 0);
    next.current -= dt;
    if (next.current <= 0) {
      const r = Math.random();
      const kind: Block['kind'] = r < 0.45 ? 'cone' : r < 0.8 ? 'caixa' : 'banco';
      blocks.current.push({ id: performance.now(), x: w + 30, kind, w: kind === 'banco' ? 84 : kind === 'caixa' ? 46 : 34, h: kind === 'banco' ? 34 : kind === 'caixa' ? 46 : 44 });
      next.current = (0.85 + Math.random() * 0.9) * (300 / speed) + 0.35;
    }
    nextSeed.current -= dt;
    if (nextSeed.current <= 0) {
      seeds.current.push({ id: performance.now(), x: w + 30, y: gy - 50 - Math.random() * 130 });
      nextSeed.current = 0.6 + Math.random() * 1.1;
    }
    for (const o of blocks.current) o.x -= speed * dt;
    for (const s of seeds.current) s.x -= speed * dt;
    blocks.current = blocks.current.filter((o) => o.x > -100);
    seeds.current = seeds.current.filter((s) => {
      if (Math.abs(s.x - hx) < 34 && Math.abs(s.y - (p.y - 50)) < 46) {
        got.current += 1;
        play('pega', { step: Math.min(7, got.current % 8) });
        return false;
      }
      return s.x > -40;
    });
    for (const o of blocks.current) {
      const hit = hx + 18 > o.x + 6 && hx - 18 < o.x + o.w - 6 && p.y > gy - o.h + 8;
      if (hit) {
        over.current = true;
        play('quica');
        setTimeout(() => end(score()), 900);
        break;
      }
    }
    setScore(score());
  });
  const jump = () => {
    const p = hami.current;
    if (over.current || p.jumps >= 2) return;
    p.vy = p.jumps === 0 ? -680 : -580;
    p.jumps += 1;
    play('pulo');
  };
  useKeys({ ArrowUp: (d) => d && jump(), ' ': (d) => d && jump() });
  const { w, h } = size.current;
  const gy = h - 46;
  const hx = w * 0.22;
  const p = hami.current;
  const tilt = p.y < gy ? -12 : 0;
  const cityW = CITY.reduce((a, c) => a + c.w + 14, 0);
  const off = (dist.current * 0.25) % cityW;
  let cx = -off;
  return (
    <>
      <Hud
        items={[
          { icon: '🛹', text: `${Math.floor(dist.current / 40)} m`, label: 'Distância' },
          { icon: '🌻', text: got.current, label: 'Sementes' },
        ]}
      />
      <div ref={ref} className="arc-stage arc-city" onPointerDown={jump}>
        <span className="arc-sun" />
        {[0, 1].flatMap((rep) =>
          CITY.map((c, i) => {
            const x = cx;
            cx += c.w + 14;
            return <span key={`${rep}-${i}`} className="arc-building" style={{ left: x, width: c.w, height: c.h, bottom: 46, background: c.c }} />;
          }),
        )}
        <span className="arc-street" style={{ backgroundPositionX: -(dist.current % 60) }} />
        {seeds.current.map((s) => (
          <div key={s.id} className="arc-obj" style={{ transform: `translate(${s.x - 18}px, ${s.y - 18}px)` }}>
            <Glyph e="🌻" size={36} />
          </div>
        ))}
        {blocks.current.map((o) => (
          <span key={o.id} className={`arc-block arc-block-${o.kind}`} style={{ left: o.x, width: o.w, height: o.h, bottom: 46 }} />
        ))}
        <div className={`arc-obj ${over.current ? 'arc-shake' : ''}`} style={{ transform: `translate(${hx - 46}px, ${p.y - 106}px) rotate(${tilt}deg)` }}>
          <span className="arc-skater">
            <Me size={84} mood={over.current ? 'surpreso' : 'animado'} />
          </span>
          <Board tilt={0} />
        </div>
        {time.current < 2.5 && <p className="arc-tip">Toque para pular. Dois toques = pulo duplo!</p>}
      </div>
    </>
  );
}

// ---------- Pula nuvens ----------

interface Cloud { id: number; x: number; y: number; w: number; vx: number; spring: boolean; seed: boolean }

export function Clouds({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const p = useRef({ x: -1, y: 0, vy: -700, face: 1 });
  const target = useRef(-1);
  const clouds = useRef<Cloud[]>([]);
  const cam = useRef(0);
  const top = useRef(0);
  const startY = useRef(0);
  const got = useRef(0);
  const over = useRef(false);
  const id = useRef(0);
  const height = () => Math.max(0, Math.floor((startY.current - top.current) / 20));
  const add = (y: number, w: number) => {
    const hard = Math.min(1, -y / 9000);
    clouds.current.push({
      id: id.current++,
      x: 50 + Math.random() * (w - 100),
      y,
      w: 92 - hard * 30,
      vx: Math.random() < 0.15 + hard * 0.3 ? (Math.random() < 0.5 ? -1 : 1) * (50 + hard * 70) : 0,
      spring: Math.random() < 0.08,
      seed: Math.random() < 0.3,
    });
  };
  useLoop(true, (dt) => {
    const { w, h } = size.current;
    const me = p.current;
    if (me.x < 0) {
      Object.assign(me, { x: w / 2, y: h - 60 });
      target.current = w / 2;
      startY.current = h - 60;
      top.current = h - 60;
      clouds.current.push({ id: id.current++, x: w / 2, y: h - 40, w: w * 0.8, vx: 0, spring: false, seed: false });
      let y = h - 40;
      while (y > -h) add((y -= 80 + Math.random() * 40), w);
    }
    if (over.current) return;
    const prevY = me.y;
    me.vy += 1350 * dt;
    me.y += me.vy * dt;
    const dx = target.current - me.x;
    if (Math.abs(dx) > 2) me.face = dx > 0 ? 1 : -1;
    me.x += clamp(dx * 8, -420, 420) * dt;
    if (me.x < -20) me.x = w + 20;
    if (me.x > w + 20) me.x = -20;
    for (const c of clouds.current) {
      if (c.vx) {
        c.x += c.vx * dt;
        if (c.x < c.w / 2 || c.x > w - c.w / 2) c.vx = -c.vx;
      }
      if (me.vy > 0 && prevY <= c.y && me.y >= c.y && Math.abs(me.x - c.x) < c.w / 2 + 12) {
        me.y = c.y;
        me.vy = c.spring ? -1150 : -760;
        play(c.spring ? 'brilho' : 'quica');
      }
      if (c.seed && Math.abs(me.x - c.x) < 34 && Math.abs(me.y - 40 - (c.y - 34)) < 44) {
        c.seed = false;
        got.current += 1;
        play('pega', { step: got.current % 8 });
      }
    }
    top.current = Math.min(top.current, me.y);
    if (me.y - cam.current < h * 0.42) cam.current = me.y - h * 0.42;
    clouds.current = clouds.current.filter((c) => c.y - cam.current < h + 60);
    let highest = Math.min(...clouds.current.map((c) => c.y));
    const gap = () => 80 + Math.random() * (45 + Math.min(40, -cam.current / 250));
    while (highest > cam.current - 120) add((highest -= gap()), w);
    if (me.y - cam.current > h + 80) {
      over.current = true;
      play('quica');
      setTimeout(() => end(height() + got.current * 3), 700);
    }
  });
  const aim = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) target.current = e.clientX - r.left;
  };
  useKeys({
    ArrowLeft: (d) => d && (target.current = Math.max(10, p.current.x - 90)),
    ArrowRight: (d) => d && (target.current = Math.min(size.current.w - 10, p.current.x + 90)),
  });
  const me = p.current;
  const sky = Math.min(1, height() / 400);
  return (
    <>
      <Hud
        items={[
          { icon: '☁️', text: `${height()} m`, label: 'Altura' },
          { icon: '🌻', text: got.current, label: 'Sementes' },
        ]}
      />
      <div
        ref={ref}
        className="arc-stage arc-sky"
        style={{ ['--sky' as string]: sky }}
        onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), aim(e))}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && aim(e)}
      >
        <span className="arc-starfield" style={{ opacity: sky }} />
        {clouds.current.map((c) => (
          <div key={c.id} className="arc-obj" style={{ transform: `translate(${c.x - c.w / 2}px, ${c.y - cam.current - 8}px)` }}>
            <span className={`arc-cloud-pad ${c.spring ? 'is-spring' : ''} ${c.vx ? 'is-move' : ''}`} style={{ width: c.w }} />
            {c.spring && <span className="arc-spring">⭐</span>}
            {c.seed && (
              <span className="arc-cloud-seed" style={{ left: c.w / 2 - 16 }}>
                <Glyph e="🌻" size={32} />
              </span>
            )}
          </div>
        ))}
        <div className="arc-obj" style={{ transform: `translate(${me.x - 38}px, ${me.y - cam.current - 80}px) scaleX(${me.face})` }}>
          <Me size={76} mood={me.vy < 0 ? 'animado' : 'surpreso'} />
        </div>
        {height() < 6 && <p className="arc-tip">Arraste o dedo para os lados para guiar o Hami</p>}
      </div>
    </>
  );
}
