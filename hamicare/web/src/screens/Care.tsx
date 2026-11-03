// Cuidados com o Hami: cafuné, lanchinho arrastável, banho com ferramentas de verdade,
// dois jogos de brincar, escovar os nós do pelo, hora de nanar, conversar e foto.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Sheet, toast } from '../components/ui';
import { ITEMS, RECIPES, itemById } from '../data/items';
import { CHATS, FACTS, periodOf } from '../data/lines';
import { PLACES } from '../data/world';
import { care, cook, feed, owned, setMood, takePhoto, toggleSleep, useApp } from '../lib/store';
import { snapshotPng, saveFile } from '../lib/platform';
import { prefersReducedMotion } from '../lib/util';
import type { Mood, Photo, PetMood } from '../types';

export type CareMode = 'carinho' | 'comida' | 'banho' | 'brincar' | 'escovar' | 'dormir' | 'conversar' | 'foto' | null;

export function CareLayer({ mode, onClose, onShare }: { mode: CareMode; onClose: () => void; onShare?: (p: Photo) => void }) {
  return (
    <>
      {mode === 'carinho' && <PetGame onClose={onClose} />}
      {mode === 'comida' && <FeedGame onClose={onClose} />}
      {mode === 'banho' && <BathGame onClose={onClose} />}
      {mode === 'brincar' && <PlayHub onClose={onClose} />}
      {mode === 'escovar' && <BrushGame onClose={onClose} />}
      {mode === 'dormir' && <SleepGame onClose={onClose} />}
      <TalkSheet open={mode === 'conversar'} onClose={onClose} />
      <PhotoSheet open={mode === 'foto'} onClose={onClose} onShare={onShare} />
    </>
  );
}

// ---------- Peças em comum ----------

type Kind = 'drop' | 'heart' | 'sparkle' | 'crumb' | 'note' | 'pop' | 'text' | 'wind' | 'zzz' | 'star';
interface Particle {
  id: number;
  x: number;
  y: number;
  kind: Kind;
  text?: string;
  dx?: number;
  dy?: number;
}
const CHAR: Partial<Record<Kind, string>> = { heart: '💗', sparkle: '✨', note: '♪', zzz: 'z', star: '⭐' };

/** Partículas leves (gotas, corações, brilhos, migalhas) posicionadas dentro do palco. */
function useParticles(max = 60) {
  const [list, setList] = useState<Particle[]>([]);
  const last = useRef<Record<string, number>>({});
  const reduce = useRef(prefersReducedMotion());
  const spawn = useCallback(
    (p: Omit<Particle, 'id'>, life = 900, throttle = 0, key: string = p.kind) => {
      const now = performance.now();
      if (throttle && now - (last.current[key] ?? 0) < throttle) return;
      if (reduce.current && p.kind !== 'text' && p.kind !== 'heart') return;
      last.current[key] = now;
      const id = now + Math.random();
      setList((l) => [...l.slice(-max), { ...p, id }]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), life);
    },
    [max],
  );
  const layer = (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {list.map((p) => (
        <span key={p.id} className={`pt pt-${p.kind}`} style={{ left: p.x, top: p.y, ['--dx' as string]: `${p.dx ?? 0}px`, ['--dy' as string]: `${p.dy ?? 0}px` }}>
          {p.text ?? CHAR[p.kind] ?? ''}
        </span>
      ))}
    </div>
  );
  return { spawn, layer };
}

type Move = 'squish' | 'hop' | 'shake' | 'stretch' | 'chew' | 'wiggle' | 'nod';
const MOVES: Record<Move, { k: Keyframe[]; ms: number }> = {
  squish: { k: [{ transform: 'scale(1,1)' }, { transform: 'scale(1.1,0.9)', offset: 0.3 }, { transform: 'scale(0.96,1.05)', offset: 0.65 }, { transform: 'scale(1,1)' }], ms: 460 },
  hop: { k: [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.12,0.88)', offset: 0.15 }, { transform: 'translateY(-40px) scale(0.94,1.08)', offset: 0.45 }, { transform: 'translateY(0) scale(1.1,0.9)', offset: 0.8 }, { transform: 'translateY(0) scale(1,1)' }], ms: 680 },
  shake: { k: [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], ms: 620 },
  stretch: { k: [{ transform: 'scale(1,1)' }, { transform: 'scale(0.9,1.14)', offset: 0.5 }, { transform: 'scale(1.04,0.97)', offset: 0.8 }, { transform: 'scale(1,1)' }], ms: 900 },
  chew: { k: [{ transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)' }, { transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)' }, { transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)' }, { transform: 'scale(1,1)' }], ms: 1100 },
  wiggle: { k: [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px) rotate(-3deg)' }, { transform: 'translateX(6px) rotate(3deg)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], ms: 420 },
  nod: { k: [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], ms: 500 },
};

function animate(el: Element | null | undefined, move: Move) {
  if (!el || prefersReducedMotion()) return;
  el.animate(MOVES[move].k, { duration: MOVES[move].ms, easing: 'cubic-bezier(0.23,1,0.32,1)' });
}

/** Palco: posição do dedo dentro dele e "está em cima do Hami?". */
function useStage() {
  const stage = useRef<HTMLDivElement>(null);
  const pet = useRef<HTMLDivElement>(null);
  const local = useCallback((cx: number, cy: number) => {
    const r = stage.current?.getBoundingClientRect();
    return r ? { x: cx - r.left, y: cy - r.top } : { x: 0, y: 0 };
  }, []);
  /** Em cima do corpo do Hami (coordenadas da tela). */
  const over = useCallback((cx: number, cy: number, pad = 0) => {
    const r = pet.current?.getBoundingClientRect();
    if (!r) return false;
    const x0 = r.left + r.width / 2;
    const y0 = r.top + r.height * 0.6;
    const rx = r.width * 0.36 + pad;
    const ry = r.height * 0.36 + pad;
    return ((cx - x0) / rx) ** 2 + ((cy - y0) / ry) ** 2 <= 1;
  }, []);
  /** Parte do Hami: 0 = topo da cabeça, 1 = pés. */
  const part = useCallback((cy: number) => {
    const r = pet.current?.getBoundingClientRect();
    return r ? (cy - r.top) / r.height : 0.5;
  }, []);
  /** Boca do Hami, em coordenadas da tela. */
  const mouth = useCallback(() => {
    const r = pet.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.6 } : { x: 0, y: 0 };
  }, []);
  return { stage, pet, local, over, part, mouth };
}

function CareShell({ title, step, onClose, children }: { title: string; step?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fullscreen care-shell" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto grid max-w-[460px] gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-[25px] font-bold leading-tight">{title}</h2>
            {step && <p className="text-[14px] font-bold text-muted">{step}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Meter({ value, tone = 'accent', icon, label }: { value: number; tone?: 'accent' | 'sky' | 'gold' | 'leaf'; icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <span className="text-[22px]" aria-hidden="true">
        {icon}
      </span>
      <div className="meter flex-1">
        <div className={`meter-fill meter-${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-10 text-right text-[13px] font-extrabold tabular-nums">{Math.min(100, Math.round(value))}%</span>
    </div>
  );
}

const CONFETTI = ['#FF6F91', '#FFC75F', '#7BD389', '#6FB7FF', '#B48CFF', '#FF9D5C'];
function Confetti() {
  if (prefersReducedMotion()) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 7) * 0.08}s`, ['--x' as string]: `${((i * 53) % 120) - 60}px`, ['--r' as string]: `${(i * 67) % 360}deg` }} />
      ))}
    </div>
  );
}

function DoneCard({ title, text, onClose, children }: { title: string; text: ReactNode; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="done-card">
      <p className="font-display text-[23px] font-bold leading-tight">{title}</p>
      <p className="text-[15px] leading-snug">{text}</p>
      {children}
      <button className="btn btn-primary" onClick={onClose}>
        Pronto
      </button>
    </div>
  );
}

function PetView({ mood, size = 220, wet, shine, idle = true }: { mood: PetMood; size?: number; wet?: boolean; shine?: boolean; idle?: boolean }) {
  const s = useApp();
  return <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={mood} size={size} label={s.pet.name} wet={wet} shine={shine} idle={idle} />;
}

// ---------- Cafuné ----------

function PetGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const { stage, pet, local, over, part } = useStage();
  const { spawn, layer } = useParticles();
  const [love, setLove] = useState(0);
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const last = useRef<{ x: number; y: number } | null>(null);
  const laughAt = useRef(0);
  const done = love >= 100;

  useEffect(() => {
    if (!done) return;
    care('carinho');
    setMoodPet('animado');
    animate(pet.current, 'hop');
    const r = stage.current?.getBoundingClientRect();
    if (r) for (let i = 0; i < 12; i++) spawn({ kind: 'heart', x: r.width / 2, y: r.height * 0.45, dx: Math.cos(i * 0.52) * 120, dy: Math.sin(i * 0.52) * 90 - 40 }, 1200);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function touch(e: React.PointerEvent, moving: boolean) {
    if (done) return;
    const p = local(e.clientX, e.clientY);
    if (!over(e.clientX, e.clientY, 10)) {
      last.current = moving ? { x: e.clientX, y: e.clientY } : last.current;
      return;
    }
    const d = last.current ? Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) : 12;
    last.current = { x: e.clientX, y: e.clientY };
    setLove((v) => Math.min(100, v + Math.min(d, 30) / 5));
    spawn({ kind: 'heart', x: p.x, y: p.y, dy: -70, dx: (Math.random() - 0.5) * 40 }, 1000, 110);
    const zone = part(e.clientY);
    if (zone > 0.6) {
      setMoodPet('risada');
      const now = performance.now();
      if (now - laughAt.current > 900) {
        laughAt.current = now;
        animate(pet.current, 'wiggle');
        spawn({ kind: 'text', text: ['hihi!', 'cócegas!', 'hahaha!'][Math.floor(Math.random() * 3)], x: p.x, y: p.y - 30, dy: -50 }, 900);
      }
    } else {
      setMoodPet('calmo');
      spawn({ kind: 'note', x: p.x + 20, y: p.y - 10, dy: -60, dx: 30 }, 1100, 380, 'purr');
    }
  }

  return (
    <CareShell title="Cafuné" step={done ? `${s.pet.name} amou!` : 'Faça carinho na cabeça ou cócegas na barriga'} onClose={onClose}>
      <div
        ref={stage}
        className="stage stage-love"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = null;
          if (over(e.clientX, e.clientY, 10)) animate(pet.current, 'squish');
          touch(e, false);
        }}
        onPointerMove={(e) => e.buttons && touch(e, true)}
        onPointerUp={() => {
          last.current = null;
          if (!done) setMoodPet('feliz');
        }}
      >
        <div ref={pet} className="stage-pet" style={{ transformOrigin: '50% 100%' }}>
          <PetView mood={mood} />
        </div>
        {layer}
        {done && <Confetti />}
      </div>
      <Meter value={love} icon="💗" label="Carinho" />
      {done && <DoneCard title="Que cafuné gostoso!" text={<>O {s.pet.name} ficou todo derretido. Carinho também é cuidado com você: respira fundo e solta devagar.</>} onClose={onClose} />}
    </CareShell>
  );
}

// ---------- Lanchinho (arrastar a comida até a boca) ----------

function FeedGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const { stage, pet, local, over, mouth } = useStage();
  const { spawn, layer } = useParticles();
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [fly, setFly] = useState<{ id: string; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [kitchen, setKitchen] = useState(false);
  const chewing = useRef(false);
  const foods = ITEMS.filter((i) => i.kind === 'comida' && (s.inventory[i.id] ?? 0) > 0);
  const full = s.pet.stats.saciedade >= 98;

  function eat(id: string) {
    const item = itemById(id);
    if (!item) return;
    if (full) {
      setMoodPet('feliz');
      animate(pet.current, 'nod');
      toast(`${s.pet.name}: "Tô cheinho! Depois eu como mais."`);
      return;
    }
    if (!feed(id)) return;
    chewing.current = true;
    setMoodPet('comendo');
    animate(pet.current, 'chew');
    const m = mouth();
    const p = local(m.x, m.y);
    for (let i = 0; i < 8; i++) setTimeout(() => spawn({ kind: 'crumb', x: p.x + (Math.random() - 0.5) * 30, y: p.y, dx: (Math.random() - 0.5) * 90, dy: 40 + Math.random() * 40 }, 800), i * 90);
    spawn({ kind: 'text', text: 'nham nham!', x: p.x + 40, y: p.y - 60, dy: -40 }, 1100);
    setTimeout(() => {
      chewing.current = false;
      setMoodPet('animado');
      animate(pet.current, 'hop');
      spawn({ kind: 'heart', x: p.x, y: p.y - 70, dy: -60 }, 1000);
      setTimeout(() => setMoodPet('feliz'), 900);
    }, 1200);
  }

  return (
    <CareShell title={`Lanchinho do ${s.pet.name}`} step={full ? 'Barriguinha cheia!' : 'Arraste uma comida até a boca do Hami (ou toque nela)'} onClose={onClose}>
      <div ref={stage} className="stage stage-kitchen">
        <div ref={pet} className="stage-pet" style={{ transformOrigin: '50% 100%' }}>
          <PetView mood={mood} size={210} />
        </div>
        <div className="plate" aria-hidden="true" />
        {layer}
      </div>
      <Meter value={s.pet.stats.saciedade} tone="gold" icon="🥕" label="Barriguinha" />
      {s.pet.sleeping ? (
        <p className="rounded-2xl bg-gold-soft p-3 text-[15px] font-bold">O {s.pet.name} está dormindo. Acorde ele para comer.</p>
      ) : foods.length ? (
        <div className="food-tray">
          {foods.map((f) => (
            <button
              key={f.id}
              className="food-tile"
              style={{ touchAction: 'none', opacity: drag?.id === f.id || fly?.id === f.id ? 0.35 : 1 }}
              aria-label={`Dar ${f.name}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDrag({ id: f.id, x: e.clientX, y: e.clientY, moved: false });
              }}
              onPointerMove={(e) => {
                if (!drag) return;
                const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8;
                setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
                const m = mouth();
                if (!chewing.current) setMoodPet(Math.hypot(e.clientX - m.x, e.clientY - m.y) < 140 ? 'boca' : 'surpreso');
              }}
              onPointerUp={(e) => {
                if (!drag) return;
                const d = drag;
                setDrag(null);
                if (!d.moved) {
                  // Toque: a comida voa sozinha até a boca.
                  const r = e.currentTarget.getBoundingClientRect();
                  setMoodPet('boca');
                  setFly({ id: f.id, from: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, to: mouth() });
                  setTimeout(() => {
                    setFly(null);
                    eat(f.id);
                  }, 480);
                } else if (over(e.clientX, e.clientY, 40)) eat(f.id);
                else if (!chewing.current) setMoodPet('feliz');
              }}
              onPointerCancel={() => setDrag(null)}
            >
              <span className="text-[34px] leading-none">{f.emoji}</span>
              <span className="text-[12px] font-bold leading-tight">{f.name}</span>
              <span className="food-count">{s.inventory[f.id]}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-surface2 p-4 text-center text-muted">Acabaram as comidinhas. Compre mais na Loja (aba Mundo) ou pegue o presente do dia.</p>
      )}
      {drag?.moved && (
        <span className="food-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {itemById(drag.id)?.emoji}
        </span>
      )}
      {fly && <FlyingFood emoji={itemById(fly.id)?.emoji ?? ''} from={fly.from} to={fly.to} />}
      <p className="text-center text-[13px] text-muted">Comida deixa o {s.pet.name} feliz e com energia. O peso dele muda só com as suas missões saudáveis.</p>
      <button className="btn btn-ghost btn-sm" onClick={() => setKitchen(!kitchen)} aria-expanded={kitchen}>
        👩‍🍳 {kitchen ? 'Fechar a cozinha' : 'Abrir a cozinha'}
      </button>
      {kitchen && (
        <div className="grid gap-2">
          {RECIPES.map((r) => {
            const ok = r.needs.every((id) => owned(s, id));
            return (
              <div key={r.result} className="flex items-center gap-3 rounded-2xl bg-surface2 p-3">
                <span className="text-[28px]">{itemById(r.result)?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{r.name}</p>
                  <p className="text-[13px] text-muted">{r.needs.map((id) => `${itemById(id)?.emoji} ${itemById(id)?.name}`).join(' + ')}</p>
                </div>
                <button className="btn btn-soft btn-sm" disabled={!ok} onClick={() => cook(r.result) && toast(`${r.name} pronta!`)}>
                  Preparar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </CareShell>
  );
}

function FlyingFood({ emoji, from, to }: { emoji: string; from: { x: number; y: number }; to: { x: number; y: number } }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    el.animate(
      [
        { transform: 'translate(-50%,-50%) translate(0,0) scale(1)' },
        { transform: `translate(-50%,-50%) translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(1.3) rotate(-20deg)`, offset: 0.5 },
        { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(0.6) rotate(10deg)` },
      ],
      { duration: 470, easing: 'cubic-bezier(0.33,0,0.2,1)', fill: 'forwards' },
    );
  }, [from, to]);
  return (
    <span ref={ref} className="food-ghost" style={{ left: from.x, top: from.y }} aria-hidden="true">
      {emoji}
    </span>
  );
}

// ---------- Banho com ferramentas ----------

const BATH = [
  { id: 'molhar', label: 'Molhar', icon: '🚿', hint: 'Arraste o chuveirinho por cima do Hami' },
  { id: 'shampoo', label: 'Shampoo', icon: '🧴', hint: 'Toque no frasco 3 vezes' },
  { id: 'esfregar', label: 'Espuma', icon: '🧽', hint: 'Esfregue a esponja no Hami' },
  { id: 'enxaguar', label: 'Enxaguar', icon: '💦', hint: 'Use o chuveirinho para tirar toda a espuma' },
  { id: 'secar', label: 'Toalha', icon: '🧣', hint: 'Esfregue a toalha para secar' },
  { id: 'secador', label: 'Secador', icon: '💨', hint: 'Segure o secador até ficar fofinho' },
] as const;

function BathGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const { stage, pet, local, over } = useStage();
  const { spawn, layer } = useParticles(80);
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const [tool, setTool] = useState<{ x: number; y: number; a: number } | null>(null);
  const [foam, setFoam] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  const [blobs, setBlobs] = useState(0);
  const [wet, setWet] = useState(false);
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const foamTotal = useRef(0);
  const cur = BATH[step];

  // Avança de passo quando a barrinha enche.
  useEffect(() => {
    if (prog < 100 || done) return;
    const t = setTimeout(() => {
      if (step + 1 >= BATH.length) {
        setDone(true);
        setWet(false);
        setMoodPet('animado');
        animate(pet.current, 'hop');
        care('banho');
      } else {
        if (cur.id === 'enxaguar') setFoam([]);
        if (cur.id === 'secar') setWet(false);
        setStep(step + 1);
        setProg(0);
        setMoodPet('feliz');
        animate(pet.current, 'squish');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [prog, step, done]); // eslint-disable-line react-hooks/exhaustive-deps

  // Secador: segurar enche aos pouquinhos, com ventinho.
  useEffect(() => {
    if (!holding || cur.id !== 'secador' || done) return;
    const id = setInterval(() => {
      setProg((v) => v + 5);
      const r = stage.current?.getBoundingClientRect();
      if (r) spawn({ kind: 'wind', x: r.width - 70, y: r.height * 0.42 + (Math.random() - 0.5) * 60, dx: -150, dy: 0 }, 700);
      animate(pet.current, 'squish');
    }, 140);
    return () => clearInterval(id);
  }, [holding, cur.id, done]); // eslint-disable-line react-hooks/exhaustive-deps

  function move(e: React.PointerEvent) {
    if (done || cur.id === 'shampoo' || cur.id === 'secador') return;
    const p = local(e.clientX, e.clientY);
    const d = last.current ? Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) : 0;
    const a = last.current ? Math.max(-30, Math.min(30, (e.clientX - last.current.x) * 1.5)) : 0;
    last.current = { x: e.clientX, y: e.clientY };
    setTool({ x: p.x, y: p.y, a });
    const on = over(e.clientX, e.clientY + (cur.id === 'molhar' || cur.id === 'enxaguar' ? 70 : 0), 18);
    if (cur.id === 'molhar' || cur.id === 'enxaguar') {
      spawn({ kind: 'drop', x: p.x + (Math.random() - 0.5) * 34, y: p.y + 22, dy: 120 }, 650, 35);
      if (on) {
        if (cur.id === 'molhar') {
          setProg((v) => v + Math.min(d, 25) / 3.2);
          if (!wet) {
            setWet(true);
            setMoodPet('surpreso');
            animate(pet.current, 'wiggle');
            setTimeout(() => setMoodPet('feliz'), 700);
          }
        } else {
          setFoam((f) => {
            const left = f.filter((b) => Math.abs(b.x - p.x) > 46 || b.y < p.y - 10);
            if (left.length !== f.length) spawn({ kind: 'pop', x: p.x, y: p.y + 50 }, 400, 60);
            if (foamTotal.current) setProg(Math.max(prog, (1 - left.length / foamTotal.current) * 100));
            return left;
          });
          setBlobs(0);
        }
      }
    }
    if (cur.id === 'esfregar' && on) {
      setMoodPet('risada');
      setProg((v) => v + Math.min(d, 25) / 4);
      setFoam((f) => {
        if (f.length >= 46) return f;
        const next = [...f, { id: performance.now(), x: p.x + (Math.random() - 0.5) * 24, y: p.y + (Math.random() - 0.5) * 24, r: 14 + Math.random() * 16 }];
        foamTotal.current = next.length;
        return next;
      });
    }
    if (cur.id === 'secar' && on) {
      setMoodPet('calmo');
      setProg((v) => {
        const nv = v + Math.min(d, 25) / 3.5;
        if (Math.floor(nv / 25) > Math.floor(v / 25)) {
          animate(pet.current, 'shake');
          const r = pet.current?.getBoundingClientRect();
          const c = r ? local(r.left + r.width / 2, r.top + r.height * 0.5) : p;
          for (let i = 0; i < 10; i++) spawn({ kind: 'drop', x: c.x, y: c.y, dx: Math.cos(i * 0.63) * 130, dy: Math.sin(i * 0.63) * 80 - 20 }, 700);
        }
        return nv;
      });
    }
  }

  function squeeze() {
    if (cur.id !== 'shampoo' || done) return;
    setBlobs((b) => b + 1);
    setProg((v) => v + 34);
    animate(pet.current, 'squish');
    const r = pet.current?.getBoundingClientRect();
    if (r) {
      const c = local(r.left + r.width / 2, r.top + r.height * 0.3);
      spawn({ kind: 'text', text: 'plof!', x: c.x + 30, y: c.y - 20, dy: -40 }, 800);
    }
  }

  const toolIcon = cur.id === 'molhar' || cur.id === 'enxaguar' ? '🚿' : cur.id === 'esfregar' ? '🧽' : cur.id === 'secar' ? <span className="towel" /> : null;

  return (
    <CareShell title="Hora do banho" step={done ? 'Cheirosinho!' : `${step + 1}/6 · ${cur.hint}`} onClose={onClose}>
      <ol className="bath-steps" aria-label="Passos do banho">
        {BATH.map((b, i) => (
          <li key={b.id} data-state={done || i < step ? 'done' : i === step ? 'now' : 'next'}>
            <span aria-hidden="true">{done || i < step ? '✓' : b.icon}</span>
            {b.label}
          </li>
        ))}
      </ol>
      <div
        ref={stage}
        className="stage stage-bath"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = null;
          move(e);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && move(e)}
        onPointerUp={() => {
          last.current = null;
          setTool(null);
          if (!done && cur.id !== 'secador') setMoodPet('feliz');
        }}
      >
        <div ref={pet} className="stage-pet !bottom-[60px]" style={{ transformOrigin: '50% 100%' }}>
          <PetView mood={mood} wet={wet} shine={done} size={200} />
        </div>
        {/* Espuma por cima do Hami */}
        <div className="pointer-events-none absolute inset-0 z-[3]">
          {foam.map((b) => (
            <span key={b.id} className="foam" style={{ left: b.x, top: b.y, width: b.r * 2, height: b.r * 2 }} />
          ))}
          {Array.from({ length: blobs }, (_, i) => (
            <span key={i} className="foam foam-pink" style={{ left: `calc(50% + ${(i - 1) * 22}px)`, top: '47%', width: 34, height: 26 }} />
          ))}
        </div>
        <div className="tub" aria-hidden="true">
          <span className="tub-water" />
          <span className="duck">
            <svg viewBox="0 0 40 32" width="40" height="32">
              <ellipse cx="18" cy="22" rx="15" ry="9" fill="#FFD23F" />
              <circle cx="27" cy="11" r="8" fill="#FFD23F" />
              <path d="M34 11 L40 13 L34 15 Z" fill="#FF8C42" />
              <circle cx="29" cy="9" r="1.5" fill="#2B2224" />
              <path d="M10 18 q6 6 14 0" stroke="#F2B705" strokeWidth="2" fill="none" />
            </svg>
          </span>
        </div>
        {cur.id === 'shampoo' && !done && (
          <button className="bottle" onClick={squeeze} aria-label="Apertar o shampoo">
            🧴
          </button>
        )}
        {tool && toolIcon && (
          <span className="tool" style={{ left: tool.x, top: tool.y, transform: `translate(-50%,-50%) rotate(${tool.a}deg)` }} aria-hidden="true">
            {toolIcon}
          </span>
        )}
        {!tool && toolIcon && !done && (
          <span className="tool tool-dock" aria-hidden="true">
            {toolIcon}
          </span>
        )}
        {layer}
        {done && <Confetti />}
      </div>
      {!done && <Meter value={prog} tone="sky" icon={cur.icon} label={cur.label} />}
      {!done && cur.id === 'secador' && (
        <button
          className="btn btn-primary select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={() => setHolding(true)}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
        >
          💨 {holding ? 'Secando…' : 'Segurar o secador'}
        </button>
      )}
      {done && (
        <DoneCard title="Cheirosinho! ✨" text={<>O {s.pet.name} está limpinho e fofo. Curiosidade: hamster de verdade toma banho de <b>areia</b>, não de água. O banho de espuma é só aqui no HamiCare.</>} onClose={onClose} />
      )}
    </CareShell>
  );
}

// ---------- Brincar ----------

function PlayHub({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [game, setGame] = useState<'chuva' | 'bola' | null>(null);
  if (game === 'chuva') return <SeedRain onClose={onClose} onBack={() => setGame(null)} />;
  if (game === 'bola') return <Fetch onClose={onClose} onBack={() => setGame(null)} />;
  return (
    <CareShell title="Hora de brincar" step={`Escolha uma brincadeira com o ${s.pet.name}`} onClose={onClose}>
      <button className="game-card game-rain" onClick={() => setGame('chuva')}>
        <span className="text-[44px]" aria-hidden="true">
          🌻
        </span>
        <span className="min-w-0 text-left">
          <span className="block font-display text-[21px] font-bold">Chuva de sementes</span>
          <span className="block text-[14px] font-semibold opacity-80">Arraste o {s.pet.name} para pegar as sementes que caem</span>
        </span>
      </button>
      <button className="game-card game-ball" onClick={() => setGame('bola')}>
        <span className="text-[44px]" aria-hidden="true">
          🎾
        </span>
        <span className="min-w-0 text-left">
          <span className="block font-display text-[21px] font-bold">Busca a bolinha!</span>
          <span className="block text-[14px] font-semibold opacity-80">Toque no campo para jogar e veja ele correr atrás</span>
        </span>
      </button>
    </CareShell>
  );
}

interface Falling {
  id: number;
  x: number;
  y: number;
  v: number;
  kind: 'semente' | 'morango' | 'ouro';
}
const FALL = { semente: { emoji: '🌻', pts: 1 }, morango: { emoji: '🍓', pts: 2 }, ouro: { emoji: '⭐', pts: 3 } } as const;
const RAIN_SECONDS = 25;

function SeedRain({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const s = useApp();
  const { stage, pet, local } = useStage();
  const { spawn, layer } = useParticles();
  const [, setFrame] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [left, setLeft] = useState(RAIN_SECONDS);
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const items = useRef<Falling[]>([]);
  const hamiX = useRef(0.5);
  const target = useRef(0.5);
  const face = useRef(1);
  const over = left <= 0;
  const rewarded = useRef(false);

  useEffect(() => {
    if (over) {
      if (!rewarded.current) {
        rewarded.current = true;
        care('brincar');
        setMoodPet('animado');
        animate(pet.current, 'hop');
      }
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, over]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (over) return;
    let raf = 0;
    let prev = performance.now();
    let nextSpawn = prev + 400;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const st = stage.current?.getBoundingClientRect();
      if (st) {
        const w = st.width;
        const h = st.height;
        // O Hami corre até o dedo, com um pouquinho de atraso (fica mais fofo).
        const dx = target.current - hamiX.current;
        if (Math.abs(dx) > 0.004) face.current = dx > 0 ? 1 : -1;
        hamiX.current += dx * Math.min(1, dt * 9);
        if (now > nextSpawn) {
          const r = Math.random();
          const elapsed = RAIN_SECONDS - left;
          items.current.push({ id: now, x: 0.08 + Math.random() * 0.84, y: -30, v: 150 + Math.random() * 90 + elapsed * 4, kind: r < 0.1 ? 'ouro' : r < 0.3 ? 'morango' : 'semente' });
          nextSpawn = now + Math.max(330, 640 - elapsed * 12);
        }
        const catchY = h - 104;
        items.current = items.current.filter((it) => {
          it.y += it.v * dt;
          if (it.y >= catchY && it.y < catchY + 30 && Math.abs(it.x - hamiX.current) * w < 46) {
            const pts = FALL[it.kind].pts;
            setScore((v) => v + pts);
            setCombo((c) => c + 1);
            setMoodPet('animado');
            setTimeout(() => setMoodPet('feliz'), 300);
            spawn({ kind: 'text', text: `+${pts}`, x: it.x * w, y: catchY - 10, dy: -50 }, 700);
            if (it.kind === 'ouro') spawn({ kind: 'sparkle', x: it.x * w, y: catchY, dy: -40 }, 700);
            return false;
          }
          if (it.y > h + 20) {
            setCombo(0);
            return false;
          }
          return true;
        });
      }
      setFrame((f) => (f + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  function aim(e: React.PointerEvent) {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    target.current = Math.max(0.08, Math.min(0.92, local(e.clientX, e.clientY).x / r.width));
  }

  return (
    <CareShell title="Chuva de sementes" step={over ? 'Fim de jogo!' : 'Arraste para o lado para pegar'} onClose={onClose}>
      <div className="flex items-center justify-between font-display text-[21px] font-bold tabular-nums">
        <span>🌻 {score}</span>
        {combo >= 3 && !over && <span className="combo">Combo ×{combo}!</span>}
        <span>⏱️ {Math.max(0, left)}s</span>
      </div>
      <div
        ref={stage}
        className="stage stage-rain"
        onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), aim(e))}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && aim(e)}
      >
        {items.current.map((it) => (
          <span key={it.id} className="falling" style={{ left: `${it.x * 100}%`, top: it.y }} aria-hidden="true">
            {FALL[it.kind].emoji}
          </span>
        ))}
        <div className="absolute bottom-2" style={{ left: `${hamiX.current * 100}%`, transform: `translateX(-50%) scaleX(${face.current})` }}>
          <div ref={pet} className={over ? '' : 'running'} style={{ transformOrigin: '50% 100%' }}>
            <PetView mood={mood} size={112} idle={false} />
          </div>
        </div>
        {layer}
        {over && <Confetti />}
      </div>
      {over && (
        <DoneCard title={`Você fez ${score} ${score === 1 ? 'ponto' : 'pontos'}!`} text={<>O {s.pet.name} ficou muito mais feliz. Brincar também é se mexer: que tal levantar e se alongar um pouquinho?</>} onClose={onClose}>
          <button className="btn btn-soft" onClick={onBack}>
            Jogar outra brincadeira
          </button>
        </DoneCard>
      )}
    </CareShell>
  );
}

const FETCH_GOAL = 5;

function Fetch({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const s = useApp();
  const { stage, pet, local } = useStage();
  const { spawn, layer } = useParticles();
  const [hx, setHx] = useState(30);
  const [face, setFace] = useState(1);
  const [ball, setBall] = useState<{ x: number; y: number; flying: boolean; held: boolean }>({ x: 30, y: 74, flying: false, held: true });
  const [phase, setPhase] = useState<'idle' | 'voando' | 'correndo' | 'voltando'>('idle');
  const [count, setCount] = useState(0);
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const ballRef = useRef<HTMLSpanElement>(null);
  const done = count >= FETCH_GOAL;

  useEffect(() => {
    if (done) {
      care('brincar');
      setMoodPet('animado');
      animate(pet.current, 'hop');
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function throwTo(e: React.PointerEvent) {
    if (phase !== 'idle' || done) return;
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    const p = local(e.clientX, e.clientY);
    const tx = Math.max(18, Math.min(82, (p.x / r.width) * 100));
    const ty = Math.max(40, Math.min(80, (p.y / r.height) * 100));
    setPhase('voando');
    setMoodPet('surpreso');
    animate(pet.current, 'squish');
    setBall({ x: tx, y: ty, flying: true, held: false });
    if (ballRef.current && !prefersReducedMotion()) ballRef.current.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-110px) scale(1.25)', offset: 0.45 }, { transform: 'translateY(0) scale(1)' }], { duration: 650, easing: 'ease-in-out' });
    setTimeout(() => {
      setBall((b) => ({ ...b, flying: false }));
      spawn({ kind: 'text', text: 'tum!', x: (tx / 100) * r.width, y: (ty / 100) * r.height - 30, dy: -20 }, 600);
      setPhase('correndo');
      setMoodPet('animado');
      setFace(tx > hx ? 1 : -1);
      setHx(tx);
      setTimeout(() => {
        setBall((b) => ({ ...b, held: true }));
        setFace(tx > 30 ? -1 : 1);
        setPhase('voltando');
        setHx(30);
        setTimeout(() => {
          setPhase('idle');
          setFace(1);
          setMoodPet('feliz');
          setBall({ x: 30, y: 74, flying: false, held: true });
          setCount((c) => c + 1);
          animate(pet.current, 'hop');
          spawn({ kind: 'heart', x: 0.3 * r.width, y: r.height - 150, dy: -60 }, 1000);
        }, 900);
      }, 900);
    }, 650);
  }

  return (
    <CareShell title="Busca a bolinha!" step={done ? 'Que parceria!' : phase === 'idle' ? 'Toque em qualquer lugar do campo para jogar' : `${s.pet.name} está correndo…`} onClose={onClose}>
      <Meter value={(count / FETCH_GOAL) * 100} tone="leaf" icon="🎾" label="Bolinhas trazidas" />
      <div ref={stage} className="stage stage-field" onPointerDown={throwTo}>
        <div className={`absolute bottom-3 ${phase === 'correndo' || phase === 'voltando' ? 'running' : ''}`} style={{ left: `${hx}%`, transform: `translateX(-50%) scaleX(${face})`, transition: 'left 0.9s cubic-bezier(0.45,0,0.25,1)' }}>
          <div ref={pet} style={{ transformOrigin: '50% 100%' }}>
            <PetView mood={mood} size={130} idle={false} />
          </div>
          {ball.held && phase === 'voltando' && <span className="ball ball-held" aria-hidden="true" />}
        </div>
        {!(ball.held && phase === 'voltando') && (
          <span
            className="ball-wrap"
            style={{ left: `${ball.held ? hx + 8 : ball.x}%`, top: ball.held ? 'auto' : `${ball.y}%`, bottom: ball.held ? 26 : 'auto', transition: ball.flying ? 'left 0.65s linear, top 0.65s linear' : 'none' }}
            aria-hidden="true"
          >
            <span ref={ballRef} className="ball" />
          </span>
        )}
        {layer}
        {done && <Confetti />}
      </div>
      {done && (
        <DoneCard title={`${FETCH_GOAL} bolinhas!`} text={<>O {s.pet.name} correu tanto que ficou sem fôlego (e muito feliz).</>} onClose={onClose}>
          <button className="btn btn-soft" onClick={onBack}>
            Jogar outra brincadeira
          </button>
        </DoneCard>
      )}
    </CareShell>
  );
}

// ---------- Escovar os nós do pelo ----------

const KNOTS = [
  { x: 35, y: 52 }, { x: 65, y: 50 }, { x: 27, y: 68 }, { x: 74, y: 66 }, { x: 43, y: 80 }, { x: 59, y: 86 }, { x: 50, y: 45 },
];

function BrushGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const { stage, pet, local, over } = useStage();
  const { spawn, layer } = useParticles();
  const [knots, setKnots] = useState(() => KNOTS.map((k, i) => ({ ...k, id: i, hp: 100 })));
  const [brush, setBrush] = useState<{ x: number; y: number; a: number } | null>(null);
  const [mood, setMoodPet] = useState<PetMood>('calmo');
  const last = useRef<{ x: number; y: number } | null>(null);
  const left = knots.filter((k) => k.hp > 0).length;
  const done = left === 0;

  useEffect(() => {
    if (!done) return;
    care('escovar');
    setMoodPet('animado');
    animate(pet.current, 'hop');
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function move(e: React.PointerEvent) {
    if (done) return;
    const p = local(e.clientX, e.clientY);
    const d = last.current ? Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) : 0;
    const a = last.current ? Math.atan2(e.clientY - last.current.y, e.clientX - last.current.x) * (180 / Math.PI) : 0;
    last.current = { x: e.clientX, y: e.clientY };
    setBrush({ x: p.x, y: p.y, a });
    if (!over(e.clientX, e.clientY, 12)) return;
    spawn({ kind: 'sparkle', x: p.x, y: p.y, dy: -20 }, 600, 140);
    const pr = pet.current?.getBoundingClientRect();
    if (!pr || d === 0) return;
    setKnots((ks) =>
      ks.map((k) => {
        if (k.hp <= 0) return k;
        const kx = pr.left + (k.x / 100) * pr.width;
        const ky = pr.top + (k.y / 100) * pr.height;
        if (Math.hypot(e.clientX - kx, e.clientY - ky) > 36) return k;
        const hp = k.hp - Math.min(d, 30) * 2.2;
        if (hp <= 0) {
          const c = local(kx, ky);
          for (let i = 0; i < 5; i++) spawn({ kind: 'sparkle', x: c.x, y: c.y, dx: Math.cos(i * 1.25) * 50, dy: Math.sin(i * 1.25) * 50 }, 700);
          spawn({ kind: 'text', text: 'shiiin!', x: c.x, y: c.y - 24, dy: -40 }, 800);
          setMoodPet('risada');
          setTimeout(() => setMoodPet('calmo'), 600);
          animate(pet.current, 'wiggle');
        }
        return { ...k, hp };
      }),
    );
  }

  return (
    <CareShell title="Escovar o pelinho" step={done ? `${s.pet.name} está brilhando!` : `Desfaça os nozinhos do pelo (${left} restantes)`} onClose={onClose}>
      <div
        ref={stage}
        className="stage stage-brush"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = null;
          move(e);
        }}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && move(e)}
        onPointerUp={() => {
          last.current = null;
          setBrush(null);
        }}
      >
        <div ref={pet} className="stage-pet" style={{ transformOrigin: '50% 100%' }}>
          <PetView mood={mood} shine={done} />
          {knots.map((k) =>
            k.hp > 0 ? (
              <svg key={k.id} className="knot" style={{ left: `${k.x}%`, top: `${k.y}%`, opacity: 0.35 + (k.hp / 100) * 0.65, transform: `translate(-50%,-50%) scale(${0.6 + (k.hp / 100) * 0.4})` }} viewBox="0 0 30 30" width="30" height="30" aria-hidden="true">
                <path d="M4 16 q4 -10 8 0 q4 10 8 0 q4 -10 7 -2 M6 10 q5 6 9 -1 q5 -6 9 2" stroke="#8A5A3B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              </svg>
            ) : null,
          )}
        </div>
        {brush ? (
          <span className="tool brush" style={{ left: brush.x, top: brush.y, transform: `translate(-50%,-50%) rotate(${brush.a}deg)` }} aria-hidden="true">
            <BrushIcon />
          </span>
        ) : (
          !done && (
            <span className="tool tool-dock brush" aria-hidden="true">
              <BrushIcon />
            </span>
          )
        )}
        {layer}
        {done && <Confetti />}
      </div>
      <Meter value={((KNOTS.length - left) / KNOTS.length) * 100} tone="accent" icon="🪮" label="Nós desfeitos" />
      {done && <DoneCard title="Pelinho de comercial ✨" text={<>Sem nenhum nozinho. O {s.pet.name} não para de se olhar no espelho.</>} onClose={onClose} />}
    </CareShell>
  );
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 60 30" width="60" height="30">
      <rect x="0" y="10" width="26" height="10" rx="5" fill="#B48CFF" />
      <rect x="22" y="4" width="34" height="18" rx="7" fill="#7E5BD9" />
      {[26, 31, 36, 41, 46, 51].map((x) => (
        <rect key={x} x={x} y="20" width="2.4" height="8" rx="1" fill="#F2E9FF" />
      ))}
    </svg>
  );
}

// ---------- Hora de nanar (e de acordar) ----------

function SleepGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  // Decide no começo: dormir ou acordar (o estado muda no fim e a tela não pode trocar).
  const [waking] = useState(s.pet.sleeping);
  const { stage, pet, local, over } = useStage();
  const { spawn, layer } = useParticles();
  const [light, setLight] = useState(!waking);
  const [blanket, setBlanket] = useState<{ x: number; y: number } | null>(null);
  const [covered, setCovered] = useState(waking);
  const [songs, setSongs] = useState(0);
  const [curtain, setCurtain] = useState(false);
  const [mood, setMoodPet] = useState<PetMood>(waking ? 'dormindo' : 'sono');
  const [finished, setFinished] = useState(false);
  const step = waking ? (curtain ? 1 : 0) : !light ? (covered ? 2 : 1) : 0;
  const steps = waking ? ['Abrir a cortina', 'Dar bom dia'] : ['Apagar a luz', 'Cobrir o Hami', 'Cantar uma canção'];

  // Bocejos de vez em quando.
  useEffect(() => {
    if (finished || waking) return;
    const id = setInterval(() => {
      if (covered) return;
      setMoodPet('boca');
      setTimeout(() => setMoodPet('sono'), 700);
    }, 3200);
    return () => clearInterval(id);
  }, [finished, waking, covered]);

  useEffect(() => {
    if (!covered || finished || waking) return;
    const r = stage.current?.getBoundingClientRect();
    const id = setInterval(() => r && spawn({ kind: 'zzz', x: r.width / 2 + 40, y: r.height * 0.4, dx: 30, dy: -70 }, 1600), 900);
    return () => clearInterval(id);
  }, [covered, finished, waking]); // eslint-disable-line react-hooks/exhaustive-deps

  function sing() {
    const r = stage.current?.getBoundingClientRect();
    if (r) for (let i = 0; i < 3; i++) setTimeout(() => spawn({ kind: 'note', x: r.width * (0.3 + Math.random() * 0.4), y: r.height * 0.6, dx: (Math.random() - 0.5) * 60, dy: -110 }, 1400), i * 150);
    const n = songs + 1;
    setSongs(n);
    if (n >= 3) {
      setMoodPet('dormindo');
      setFinished(true);
      toggleSleep();
    }
  }

  function wake() {
    if (!curtain || finished) return;
    setMoodPet('boca');
    animate(pet.current, 'stretch');
    setTimeout(() => {
      setMoodPet('animado');
      setCovered(false);
      animate(pet.current, 'hop');
      setFinished(true);
      toggleSleep();
    }, 900);
  }

  const dark = waking ? !curtain : !light;

  return (
    <CareShell title={waking ? 'Bom dia, dorminhoco!' : 'Hora de nanar'} step={finished ? (waking ? `${s.pet.name} acordou cheio de energia` : 'Boa noite! Energia recarregando…') : `${step + 1}/${steps.length} · ${steps[step]}`} onClose={onClose}>
      <div
        ref={stage}
        className={`stage stage-bedroom ${dark ? 'is-dark' : ''}`}
        onPointerMove={(e) => blanket && setBlanket(local(e.clientX, e.clientY))}
        onPointerUp={(e) => {
          if (!blanket) return;
          setBlanket(null);
          if (over(e.clientX, e.clientY, 50)) {
            setCovered(true);
            setMoodPet('dormindo');
            animate(pet.current, 'squish');
          }
        }}
      >
        <button className={`window ${dark ? 'is-night' : ''} ${waking && curtain ? 'is-open' : ''}`} onClick={() => waking && setCurtain(true)} aria-label={waking ? 'Abrir a cortina' : 'Janela'} disabled={!waking || curtain}>
          <span className="curtain curtain-l" />
          <span className="curtain curtain-r" />
        </button>
        <button className={`lamp ${light ? 'is-on' : ''}`} onClick={() => !waking && light && setLight(false)} aria-label="Apagar a luz" disabled={waking || !light}>
          <span className="lamp-shade" />
          <span className="lamp-foot" />
        </button>
        <div className="bed" aria-hidden="true" />
        <div ref={pet} className="stage-pet !bottom-[52px]" style={{ transformOrigin: '50% 100%' }}>
          <button className="relative block" onClick={wake} aria-label={`Dar bom dia ao ${s.pet.name}`} disabled={!waking || !curtain || finished}>
            <PetView mood={mood} size={190} />
            {covered && <span className="blanket blanket-on" aria-hidden="true" />}
          </button>
        </div>
        {!waking && !light && !covered && (
          <span
            className="blanket blanket-dock"
            style={blanket ? { left: blanket.x, top: blanket.y, right: 'auto', bottom: 'auto', transform: 'translate(-50%,-50%) rotate(-4deg)' } : undefined}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId);
              setBlanket(local(e.clientX, e.clientY));
            }}
            role="button"
            aria-label="Arrastar a cobertinha até o Hami"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && (setCovered(true), setMoodPet('dormindo'))}
          />
        )}
        {layer}
      </div>
      {!waking && covered && !finished && (
        <button className="btn btn-primary" onClick={sing}>
          🎵 Cantar ({songs}/3)
        </button>
      )}
      {!waking && light && <p className="text-center text-[14px] font-bold text-muted">Toque no abajur para apagar a luz.</p>}
      {!waking && !light && !covered && <p className="text-center text-[14px] font-bold text-muted">Arraste a cobertinha rosa até o {s.pet.name}.</p>}
      {waking && !curtain && <p className="text-center text-[14px] font-bold text-muted">Toque na janela para abrir a cortina.</p>}
      {waking && curtain && !finished && <p className="text-center text-[14px] font-bold text-muted">Toque no {s.pet.name} para dar bom dia.</p>}
      {finished && (
        <DoneCard
          title={waking ? 'Bom dia! ☀️' : 'Boa noite 🌙'}
          text={waking ? <>O {s.pet.name} se espreguiçou todinho. E você, dormiu bem? Um copo d’água agora cai bem.</> : <>Enquanto dorme, o {s.pet.name} recupera a energia. Que tal você também desligar a tela um pouquinho antes de dormir?</>}
          onClose={onClose}
        />
      )}
    </CareShell>
  );
}

// ---------- Conversar ----------

function TalkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [idx] = useState(() => Math.floor(Math.random() * CHATS.length));
  const [answer, setAnswer] = useState<string | null>(null);
  const chat = CHATS[idx];
  const lastFact = s.pet.facts.length ? FACTS[Number(s.pet.facts[s.pet.facts.length - 1])] : null;
  useEffect(() => {
    if (!open) setAnswer(null);
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title={`Papo com o ${s.pet.name}`}>
      <div className="grid gap-3 pt-1">
        <div className="flex justify-center">
          <PetView mood={answer ? 'animado' : 'feliz'} size={120} />
        </div>
        <p className="bubble-pet">{chat.q}</p>
        {answer ? (
          <>
            <p className="bubble-me">{answer}</p>
            <p className="bubble-pet">{lastFact ? `Sabia que hoje eu descobri ${lastFact}` : 'Obrigado por conversar comigo. Eu adoro a sua companhia!'}</p>
            <button className="btn btn-primary" onClick={onClose}>
              Até daqui a pouco
            </button>
          </>
        ) : (
          <div className="grid gap-2">
            {chat.a.map((opt) => (
              <button
                key={opt.t}
                className="opt"
                onClick={() => {
                  setAnswer(opt.t);
                  if ('mood' in opt && opt.mood) setMood(opt.mood as Mood);
                  care('conversar');
                }}
              >
                {opt.t}
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ---------- Foto virtual ----------

const POSES: { id: PetMood; label: string }[] = [
  { id: 'animado', label: 'Sorrisão' },
  { id: 'feliz', label: 'Fofura' },
  { id: 'calmo', label: 'Zen' },
  { id: 'comendo', label: 'Bochechudo' },
];

function PhotoSheet({ open, onClose, onShare }: { open: boolean; onClose: () => void; onShare?: (p: Photo) => void }) {
  const s = useApp();
  const scenes = [{ id: 'casa', name: 'Em casa', colors: ['#FFE6C2', '#FFF6E8'] as [string, string] }, ...PLACES.filter((p) => (s.placesDone[p.id] ?? 0) > 0).map((p) => ({ id: p.id, name: p.name, colors: p.colors }))];
  const [scene, setScene] = useState('casa');
  const [pose, setPose] = useState<PetMood>('animado');
  const [caption, setCaption] = useState('');
  const [taken, setTaken] = useState<Photo | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const sc = scenes.find((x) => x.id === scene) ?? scenes[0];

  useEffect(() => {
    if (!open) {
      setTaken(null);
      setCaption('');
    }
  }, [open]);

  async function download() {
    const svg = ref.current?.querySelector<SVGSVGElement>('svg[role="img"]');
    if (!svg) return;
    try {
      const blob = await snapshotPng(svg, { bg: sc.colors, caption: caption || s.pet.name });
      const r = await saveFile(`hami-${Date.now()}.png`, blob);
      if (r === 'salvo') toast('Foto salva!');
      else if (r === 'indisponivel') toast('Não deu para salvar aqui. Tente no app instalado.');
    } catch {
      toast('Não deu para gerar a imagem agora.');
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Foto do Hami">
      <div className="grid gap-3 pt-1">
        <div className="grid h-[240px] place-items-center rounded-[22px]" style={{ background: `linear-gradient(180deg, ${sc.colors[0]}, ${sc.colors[1]})` }} ref={ref}>
          {scene === 'casa' ? (
            <div className="w-full px-2">
              <Room house={s.house} period={periodOf()} height={220}>
                <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={pose} size={130} idle={false} />
              </Room>
            </div>
          ) : (
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={pose} size={200} idle={false} />
          )}
        </div>
        {!taken ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {scenes.map((x) => (
                <button key={x.id} className={`chip ${scene === x.id ? 'chip-accent' : 'chip-plain'}`} onClick={() => setScene(x.id)}>
                  {x.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {POSES.map((x) => (
                <button key={x.id} className={`chip ${pose === x.id ? 'chip-accent' : 'chip-plain'}`} onClick={() => setPose(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="photo-caption">
              Legenda
            </label>
            <input id="photo-caption" className="field" maxLength={40} placeholder="Legenda (opcional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <button className="btn btn-primary" onClick={() => (setTaken(takePhoto(caption, scene, pose)), toast('Foto guardada no álbum!'))}>
              📸 Tirar foto
            </button>
          </>
        ) : (
          <div className="grid gap-2">
            {onShare && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onShare(taken);
                  onClose();
                }}
              >
                Compartilhar com amigos
              </button>
            )}
            <button className="btn btn-soft" onClick={download}>
              Salvar imagem no celular
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Pronto
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
