// Jogos grátis do parque: embaixadinha, carrinho, pênalti e memória.
import { useEffect, useRef, useState } from 'react';
import { Glyph } from '../art';
import { play } from '../../lib/sound';
import { Ball, Hud, Me, Sprite, useBox, useLoop } from './kit';

type End = (score: number) => void;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pointIn = (e: React.PointerEvent, el: HTMLElement | null) => {
  const r = el?.getBoundingClientRect();
  return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
};

/** Textinhos que sobem e somem (+1, GOL!, …). */
function usePops() {
  const [pops, setPops] = useState<{ id: number; x: number; y: number; t: string }[]>([]);
  const add = (x: number, y: number, t: string) => {
    const id = performance.now() + Math.random();
    setPops((p) => [...p.slice(-6), { id, x, y, t }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800);
  };
  const layer = pops.map((p) => (
    <span key={p.id} className="arc-pop" style={{ left: p.x, top: p.y }}>
      {p.t}
    </span>
  ));
  return { add, layer };
}

// ---------- Embaixadinha ----------

export function Keepy({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const R = 26;
  const ball = useRef({ x: -1, y: 0, vx: 0, vy: 0, rot: 0 });
  const hx = useRef(-1);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const live = useRef(false);
  const over = useRef(false);
  const [t, setT] = useState(0);
  const { add, layer } = usePops();
  useLoop(true, (dt) => {
    const { w, h } = size.current;
    const b = ball.current;
    if (b.x < 0) Object.assign(b, { x: w / 2, y: h * 0.32 });
    if (hx.current < 0) hx.current = w / 2;
    setT((v) => v + dt);
    if (!live.current || over.current) return;
    b.vy += (1150 + scoreRef.current * 12) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rot += b.vx * dt * 3;
    if (b.x < R) (b.x = R), (b.vx = Math.abs(b.vx) * 0.8);
    if (b.x > w - R) (b.x = w - R), (b.vx = -Math.abs(b.vx) * 0.8);
    if (b.y < R) (b.y = R), (b.vy = Math.abs(b.vy) * 0.3);
    hx.current += (b.x - hx.current) * Math.min(1, dt * 2.5);
    if (b.y > h - 34 - R) {
      over.current = true;
      play('quica');
      setTimeout(() => end(scoreRef.current), 700);
    }
  });
  const kick = (e: React.PointerEvent) => {
    if (over.current) return;
    const p = pointIn(e, ref.current);
    const b = ball.current;
    if (Math.hypot(p.x - b.x, p.y - b.y) > R + 52) return;
    live.current = true;
    b.vy = -(640 + Math.random() * 70);
    b.vx = clamp((b.x - p.x) * 7 + (Math.random() - 0.5) * 90, -280, 280);
    scoreRef.current += 1;
    setScore(scoreRef.current);
    play('quica');
    add(b.x, b.y - 40, scoreRef.current % 10 === 0 ? `${scoreRef.current}!` : '+1');
  };
  const b = ball.current;
  const bob = live.current ? 0 : Math.sin(t * 4) * 6;
  return (
    <>
      <Hud items={[{ icon: '⚽', text: score, label: 'Embaixadinhas' }]} />
      <div ref={ref} className="arc-stage arc-grass" onPointerDown={kick}>
        <span className="arc-sun" />
        <span className="arc-cloud" style={{ left: '8%', top: '10%' }} />
        <span className="arc-cloud" style={{ left: '60%', top: '20%' }} />
        <div className="arc-obj" style={{ transform: `translate(${hx.current - 48}px, ${size.current.h - 112}px)` }}>
          <Me size={96} mood={over.current ? 'surpreso' : 'animado'} />
        </div>
        <div className="arc-obj" style={{ transform: `translate(${b.x - R}px, ${b.y - R + bob}px) rotate(${b.rot}deg)` }}>
          <Ball r={R} />
        </div>
        {!live.current && <p className="arc-tip">Toque na bola para chutar!</p>}
        {layer}
      </div>
    </>
  );
}

// ---------- Carrinho ----------

interface Thing { id: number; lane: number; y: number; kind: 'cone' | 'pedra' | 'semente' | 'estrela' }

function Car() {
  return (
    <svg width="96" height="62" viewBox="0 0 96 62" aria-hidden="true" className="block">
      <rect x="4" y="40" width="18" height="20" rx="6" fill="#3a2f55" />
      <rect x="74" y="40" width="18" height="20" rx="6" fill="#3a2f55" />
      <path d="M8 26 Q10 10 26 8 H70 Q86 10 88 26 V48 Q88 54 82 54 H14 Q8 54 8 48Z" fill="#FF6F91" stroke="#fff" strokeWidth="3" />
      <rect x="20" y="30" width="56" height="10" rx="5" fill="#C94A72" />
      <circle cx="18" cy="44" r="5" fill="#FFE27A" />
      <circle cx="78" cy="44" r="5" fill="#FFE27A" />
      <rect x="38" y="44" width="20" height="7" rx="3" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function Cone() {
  return (
    <svg width="46" height="50" viewBox="0 0 46 50" aria-hidden="true" className="block">
      <path d="M23 2 L38 44 H8Z" fill="#FF9D3C" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 20 H29 M13 32 H33" stroke="#fff" strokeWidth="5" />
      <rect x="3" y="42" width="40" height="7" rx="3" fill="#E07B1E" />
    </svg>
  );
}

function Rock() {
  return (
    <svg width="50" height="40" viewBox="0 0 50 40" aria-hidden="true" className="block">
      <path d="M4 34 Q2 18 14 10 Q24 2 36 8 Q48 14 46 30 Q44 38 30 38 H12 Q4 38 4 34Z" fill="#A3A9B6" stroke="#fff" strokeWidth="2.5" />
      <path d="M14 16 Q20 12 26 14" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
    </svg>
  );
}

export function Kart({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const lane = useRef(1);
  const carX = useRef(-1);
  const things = useRef<Thing[]>([]);
  const road = useRef(0);
  const time = useRef(0);
  const nextSpawn = useRef(0.6);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const crashed = useRef(false);
  const { add, layer } = usePops();
  const laneX = (i: number) => size.current.w * (0.2 + 0.3 * i);
  useLoop(true, (dt) => {
    const { h } = size.current;
    if (carX.current < 0) carX.current = laneX(1);
    if (crashed.current) return;
    time.current += dt;
    const speed = Math.min(620, 280 + time.current * 11);
    road.current = (road.current + speed * dt) % 80;
    carX.current += (laneX(lane.current) - carX.current) * Math.min(1, dt * 14);
    nextSpawn.current -= dt;
    if (nextSpawn.current <= 0) {
      const r = Math.random();
      const busy = new Set(things.current.filter((t) => t.y < 60).map((t) => t.lane));
      const free = [0, 1, 2].filter((l) => !busy.has(l));
      const l = free[Math.floor(Math.random() * free.length)] ?? 1;
      things.current.push({ id: performance.now(), lane: l, y: -60, kind: r < 0.5 ? 'cone' : r < 0.7 ? 'pedra' : r < 0.94 ? 'semente' : 'estrela' });
      nextSpawn.current = Math.max(0.38, 0.95 - time.current * 0.012) * (0.75 + Math.random() * 0.5);
    }
    const carY = h - 110;
    const myLane = Math.round((carX.current / size.current.w - 0.2) / 0.3);
    things.current = things.current.filter((t) => {
      t.y += speed * dt;
      if (t.lane === myLane && t.y > carY - 40 && t.y < carY + 40) {
        if (t.kind === 'cone' || t.kind === 'pedra') {
          crashed.current = true;
          play('quica');
          add(carX.current, carY - 60, 'Ops!');
          setTimeout(() => end(scoreRef.current), 900);
          return true;
        }
        scoreRef.current += t.kind === 'estrela' ? 5 : 2;
        setScore(scoreRef.current);
        play(t.kind === 'estrela' ? 'brilho' : 'pega', { step: 3 });
        add(laneX(t.lane), carY - 50, t.kind === 'estrela' ? '+5' : '+2');
        return false;
      }
      if (t.y > h + 40) {
        if (t.kind === 'cone' || t.kind === 'pedra') {
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
        return false;
      }
      return true;
    });
  });
  const move = (d: number) => {
    if (crashed.current) return;
    const n = clamp(lane.current + d, 0, 2);
    if (n !== lane.current) play('pulo');
    lane.current = n;
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => (e.key === 'ArrowLeft' ? move(-1) : e.key === 'ArrowRight' ? move(1) : null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { h } = size.current;
  return (
    <>
      <Hud items={[{ icon: '🏁', text: score, label: 'Pontos' }]} />
      <div ref={ref} className="arc-stage arc-road" style={{ ['--road' as string]: `${road.current}px` }} onPointerDown={(e) => move(pointIn(e, ref.current).x < size.current.w / 2 ? -1 : 1)}>
        <span className="arc-road-side arc-road-l" />
        <span className="arc-road-side arc-road-r" />
        {things.current.map((t) => (
          <div key={t.id} className="arc-obj" style={{ transform: `translate(${laneX(t.lane) - 24}px, ${t.y - 24}px)` }}>
            {t.kind === 'cone' ? <Cone /> : t.kind === 'pedra' ? <Rock /> : <Glyph e={t.kind === 'semente' ? '🌻' : '⭐'} size={42} />}
          </div>
        ))}
        <div className={`arc-obj ${crashed.current ? 'arc-shake' : ''}`} style={{ transform: `translate(${carX.current - 48}px, ${h - 150}px)` }}>
          <span className="arc-car-pet">
            <Me size={74} mood={crashed.current ? 'surpreso' : 'animado'} />
          </span>
          <Car />
        </div>
        {time.current < 2.5 && <p className="arc-tip">Toque à esquerda ou à direita para trocar de pista</p>}
        {layer}
      </div>
    </>
  );
}

// ---------- Pênalti ----------

const KICKS = 5;

export function Penalty({ end }: { end: End }) {
  const { ref, size } = useBox<HTMLDivElement>();
  const [kick, setKick] = useState(0);
  const [goals, setGoals] = useState(0);
  const goalsRef = useRef(0);
  const t = useRef(0);
  const keeper = useRef(-1);
  const shot = useRef<{ tx: number; ty: number; p: number; dive: number; inside: boolean } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const { w, h } = size.current;
  const goal = { x0: w * 0.12, x1: w * 0.88, y0: h * 0.12, y1: h * 0.42 };
  useLoop(true, (dt) => {
    const { w: W, h: H } = size.current;
    const gx0 = W * 0.12;
    const gx1 = W * 0.88;
    if (keeper.current < 0) keeper.current = W / 2;
    t.current += dt;
    const s = shot.current;
    const speed = 1.6 + kick * 0.35;
    if (!s) {
      keeper.current = W / 2 + Math.sin(t.current * speed) * (gx1 - gx0) * 0.3;
      return;
    }
    if (s.p >= 1) return;
    s.p = Math.min(1, s.p + dt / 0.5);
    keeper.current = clamp(keeper.current + Math.sign(s.dive - keeper.current) * Math.min(Math.abs(s.dive - keeper.current), (200 + kick * 45) * dt), gx0 + 30, gx1 - 30);
    if (s.p >= 1) {
      const saved = s.inside && Math.abs(keeper.current - s.tx) < 46 && s.ty > H * 0.12 - 10;
      const scored = s.inside && !saved;
      if (scored) {
        goalsRef.current += 1;
        setGoals(goalsRef.current);
      }
      setBanner(scored ? 'GOL!' : saved ? 'Defendeu!' : 'Pra fora!');
      play(scored ? 'brilho' : 'quica');
      setTimeout(() => {
        setBanner(null);
        shot.current = null;
        if (kick + 1 >= KICKS) end(goalsRef.current);
        else setKick((k) => k + 1);
      }, 1000);
    }
  });
  const shoot = (e: React.PointerEvent) => {
    if (shot.current) return;
    const p = pointIn(e, ref.current);
    if (p.y > h * 0.6) return;
    const inside = p.x > goal.x0 + 8 && p.x < goal.x1 - 8 && p.y > goal.y0 + 8 && p.y < goal.y1;
    // O goleiro adivinha o canto 70% das vezes; nas outras pula para o lado errado.
    const guess = Math.random() < 0.55 + kick * 0.05 ? p.x : w - p.x;
    shot.current = { tx: p.x, ty: p.y, p: 0, dive: guess, inside };
    play('jogar');
  };
  const s = shot.current;
  const bx0 = w / 2;
  const by0 = h - 70;
  const bp = s ? s.p : 0;
  const bx = s ? bx0 + (s.tx - bx0) * bp : bx0;
  const by = s ? by0 + (s.ty - by0) * bp - Math.sin(bp * Math.PI) * 50 : by0;
  const br = 22 - bp * 9;
  return (
    <>
      <Hud
        items={[
          { icon: '⚽', text: `${goals} gols`, label: 'Gols' },
          { icon: '🎯', text: `${Math.min(KICKS, kick + 1)}/${KICKS}`, label: 'Chute' },
        ]}
      />
      <div ref={ref} className="arc-stage arc-pitch" onPointerDown={shoot}>
        <div className="arc-goal" style={{ left: goal.x0, top: goal.y0, width: goal.x1 - goal.x0, height: goal.y1 - goal.y0 }} />
        <div className="arc-obj" style={{ transform: `translate(${keeper.current - 45}px, ${goal.y1 - 96}px)` }}>
          <Sprite fur="nuvem" size={90} mood="surpreso" />
        </div>
        <div className="arc-obj" style={{ transform: `translate(${w / 2 - 130}px, ${h - 150}px)` }}>
          <Me size={100} mood="animado" />
        </div>
        <div className="arc-obj" style={{ transform: `translate(${bx - br}px, ${by - br}px) rotate(${bp * 540}deg)` }}>
          <Ball r={br} />
        </div>
        {!s && kick === 0 && <p className="arc-tip" style={{ top: '46%' }}>Toque dentro do gol para chutar. Fuja do goleiro!</p>}
        {banner && <p className={`arc-banner ${banner === 'GOL!' ? 'is-good' : ''}`}>{banner}</p>}
      </div>
    </>
  );
}

// ---------- Memória ----------

const FACES = ['🌻', '🍓', '⭐', '🎾', '🍪', '🧀'];

export function Memory({ end }: { end: End }) {
  const [cards] = useState(() => [...FACES, ...FACES].map((f, i) => ({ f, k: Math.random() + i * 0 })).sort((a, b) => a.k - b.k).map((c) => c.f));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const done = found.size === cards.length;
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSecs((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [done]);
  const flip = (i: number) => {
    if (open.length >= 2 || open.includes(i) || found.has(i)) return;
    play('pega', { step: 2 });
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1;
    setMoves(m);
    if (cards[next[0]] === cards[next[1]]) {
      const f = new Set(found);
      f.add(next[0]);
      f.add(next[1]);
      setTimeout(() => {
        setFound(f);
        setOpen([]);
        play('brilho');
        if (f.size === cards.length) setTimeout(() => end(Math.max(6, 24 - m)), 600);
      }, 350);
    } else setTimeout(() => setOpen([]), 750);
  };
  return (
    <>
      <Hud
        items={[
          { icon: '🃏', text: `${moves} jogadas`, label: 'Jogadas' },
          { icon: '⏱️', text: `${secs}s`, label: 'Tempo' },
        ]}
      />
      <div className="arc-stage arc-cards">
        <div className="arc-grid">
          {cards.map((f, i) => {
            const up = open.includes(i) || found.has(i);
            return (
              <button key={i} className={`arc-card ${up ? 'is-up' : ''} ${found.has(i) ? 'is-found' : ''}`} onClick={() => flip(i)} aria-label={up ? f : 'Carta virada'}>
                <span className="arc-card-in">
                  <span className="arc-card-back">🐾</span>
                  <span className="arc-card-face">
                    <Glyph e={f} size={40} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="arc-tip arc-tip-low">Ache os pares com o menor número de jogadas</p>
      </div>
    </>
  );
}
