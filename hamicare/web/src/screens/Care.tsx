// Cuidados com o Hami: comida e cozinha, banho em 6 passos, brincar, escovar, conversar e foto.
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Sheet, toast } from '../components/ui';
import { ITEMS, RECIPES, itemById } from '../data/items';
import { CHATS, FACTS, periodOf } from '../data/lines';
import { PLACES } from '../data/world';
import { care, cook, feed, owned, setMood, takePhoto, useApp } from '../lib/store';
import { snapshotPng, saveFile } from '../lib/platform';
import type { Mood, Photo, PetMood } from '../types';

export type CareMode = 'comida' | 'banho' | 'brincar' | 'escovar' | 'conversar' | 'foto' | null;

export function CareLayer({ mode, onClose, onShare }: { mode: CareMode; onClose: () => void; onShare?: (p: Photo) => void }) {
  return (
    <>
      <FeedSheet open={mode === 'comida'} onClose={onClose} />
      {mode === 'banho' && <BathGame onClose={onClose} />}
      {mode === 'brincar' && <PlayGame onClose={onClose} />}
      {mode === 'escovar' && <BrushGame onClose={onClose} />}
      <TalkSheet open={mode === 'conversar'} onClose={onClose} />
      <PhotoSheet open={mode === 'foto'} onClose={onClose} onShare={onShare} />
    </>
  );
}

function PetNow({ mood, size = 200, refSvg }: { mood?: PetMood; size?: number; refSvg?: React.Ref<HTMLDivElement> }) {
  const s = useApp();
  return (
    <div ref={refSvg}>
      <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={mood ?? 'feliz'} size={size} label={s.pet.name} />
    </div>
  );
}

// ---------- Comida ----------

function FeedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [eating, setEating] = useState(false);
  const foods = ITEMS.filter((i) => i.kind === 'comida' && (s.inventory[i.id] ?? 0) > 0);
  return (
    <Sheet open={open} onClose={onClose} title={`Lanchinho do ${s.pet.name}`}>
      <div className="grid gap-4 pt-1">
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3">
          <PetNow mood={eating ? 'comendo' : 'feliz'} size={90} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold">Barriguinha</p>
            <div className="bar mt-1">
              <div className="bar-fill bar-gold" style={{ transform: `scaleX(${s.pet.stats.saciedade / 100})` }} />
            </div>
            <p className="mt-1 text-[13px] text-muted">Comida deixa o Hami satisfeito e feliz. Ela não muda o peso dele.</p>
          </div>
        </div>
        {s.pet.sleeping && <p className="rounded-2xl bg-gold-soft p-3 text-[15px] font-bold">O Hami está dormindo. Acorde ele para comer.</p>}
        {foods.length ? (
          <div className="grid grid-cols-3 gap-2">
            {foods.map((f) => (
              <button
                key={f.id}
                className="tile"
                disabled={s.pet.sleeping}
                onClick={() => {
                  if (feed(f.id)) {
                    setEating(true);
                    setTimeout(() => setEating(false), 1200);
                    toast(`${s.pet.name} amou! ${f.emoji}`);
                  }
                }}
              >
                <span className="text-[32px] leading-none">{f.emoji}</span>
                <span className="text-[13px] font-bold leading-tight">{f.name}</span>
                <span className="text-[12px] font-bold tabular-nums text-muted">× {s.inventory[f.id]}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-surface2 p-4 text-center text-muted">Acabaram as comidinhas. Compre mais na Loja (aba Mundo) ou pegue o presente do dia.</p>
        )}
        <div className="grid gap-2">
          <h3 className="font-display text-[19px] font-bold">Cozinha</h3>
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
      </div>
    </Sheet>
  );
}

// ---------- Banho em 6 passos ----------

const BATH_STEPS = [
  { id: 'molhar', label: 'Molhar', hint: 'Toque no chuveirinho para molhar o Hami.', icon: '🚿', mode: 'tap' as const, need: 3 },
  { id: 'shampoo', label: 'Shampoo', hint: 'Toque para colocar o shampoo.', icon: '🧴', mode: 'tap' as const, need: 2 },
  { id: 'esfregar', label: 'Esfregar', hint: 'Passe o dedo em cima do Hami pra fazer espuma.', icon: '🫧', mode: 'rub' as const, need: 100 },
  { id: 'enxaguar', label: 'Enxaguar', hint: 'Toque no chuveirinho para tirar a espuma.', icon: '💧', mode: 'tap' as const, need: 3 },
  { id: 'toalha', label: 'Toalha', hint: 'Passe o dedo para secar com a toalha.', icon: '🧺', mode: 'rub' as const, need: 100 },
  { id: 'secador', label: 'Secador', hint: 'Segure o botão até ficar fofinho.', icon: '💨', mode: 'hold' as const, need: 100 },
];

function BathGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hold = useRef<number>();
  const cur = BATH_STEPS[step];
  const pct = Math.min(100, (progress / cur.need) * 100);

  useEffect(() => {
    if (progress < cur.need || done) return;
    const t = setTimeout(() => {
      if (step + 1 >= BATH_STEPS.length) {
        setDone(true);
        care('banho');
      } else {
        setStep(step + 1);
        setProgress(0);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [progress, cur.need, step, done]);

  useEffect(() => () => window.clearInterval(hold.current), []);

  const wet = step >= 1 && step <= 4 && !done;
  const foamy = (step === 2 && progress > 20) || step === 3;

  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label="Banho do Hami">
      <div className="mx-auto grid max-w-[440px] gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold">Hora do banho</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        <ol className="grid grid-cols-6 gap-1" aria-label="Passos do banho">
          {BATH_STEPS.map((b, i) => (
            <li key={b.id} className={`grid justify-items-center gap-0.5 rounded-xl p-1 text-[11px] font-extrabold ${i === step && !done ? 'bg-accent-soft' : i < step || done ? 'text-leaf' : 'text-muted'}`}>
              <span className="text-[20px] leading-none">{b.icon}</span>
              {b.label}
            </li>
          ))}
        </ol>
        <div
          className="relative grid h-[300px] place-items-center overflow-hidden rounded-[26px]"
          style={{ background: 'linear-gradient(180deg,#DFF3FF,#B9E1FA)', touchAction: 'none' }}
          onPointerDown={(e) => {
            last.current = { x: e.clientX, y: e.clientY };
            if (!done && cur.mode === 'tap') setProgress((p) => p + 1);
          }}
          onPointerMove={(e) => {
            if (done || cur.mode !== 'rub' || !last.current || e.buttons === 0 && e.pointerType === 'mouse') return;
            const d = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y);
            last.current = { x: e.clientX, y: e.clientY };
            setProgress((p) => p + d / 9);
          }}
          onPointerUp={() => (last.current = null)}
        >
          <div className={wet ? 'opacity-95' : ''}>
            <PetNow mood={done ? 'animado' : step === 2 ? 'calmo' : 'feliz'} size={220} />
          </div>
          {foamy &&
            Array.from({ length: 14 }, (_, k) => (
              <span key={k} className="bath-bubble" style={{ left: `${22 + ((k * 37) % 56)}%`, top: `${22 + ((k * 23) % 50)}%`, width: 18 + (k % 4) * 8, height: 18 + (k % 4) * 8, animationDelay: `${(k % 5) * 0.2}s` }} />
            ))}
          {cur.mode === 'tap' && !done && (
            <span className="pointer-events-none absolute right-5 top-4 grid h-16 w-16 place-items-center rounded-full bg-white/80 text-[34px] shadow-md" aria-hidden="true">
              {cur.icon}
            </span>
          )}
          {(step === 0 || step === 3) && progress > 0 && !done && <span className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 text-[30px]">💧 💧 💧</span>}
          {done && <span className="absolute top-6 font-display text-[26px] font-bold text-[#2B2240]">Cheirosinho! ✨</span>}
        </div>
        {done ? (
          <div className="grid gap-3">
            <p className="rounded-2xl bg-leaf-soft p-4 text-[15px]">
              <b>{s.pet.name} está limpinho e feliz.</b> Curiosidade: no mundo real, hamster toma banho de <b>areia</b>, não de água. O banho de espuma é só aqui no HamiCare.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Pronto
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            <p className="text-center text-[16px] font-bold">{cur.hint}</p>
            <div className="bar">
              <div className="bar-fill bar-sky" style={{ transform: `scaleX(${pct / 100})` }} />
            </div>
            {cur.mode === 'hold' && (
              <button
                className="btn btn-primary select-none"
                onPointerDown={() => {
                  window.clearInterval(hold.current);
                  hold.current = window.setInterval(() => setProgress((p) => p + 8), 120);
                }}
                onPointerUp={() => window.clearInterval(hold.current)}
                onPointerLeave={() => window.clearInterval(hold.current)}
              >
                💨 Segurar o secador
              </button>
            )}
            {cur.mode === 'rub' && <p className="text-center text-[13px] text-muted">Dica: arraste o dedo para os lados.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Brincar: pega-semente ----------

function PlayGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [left, setLeft] = useState(15);
  const [caught, setCaught] = useState(0);
  const [seed, setSeed] = useState({ x: 50, y: 40, k: 0 });
  const started = useRef(false);
  const over = left <= 0;

  useEffect(() => {
    if (over) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, over]);

  useEffect(() => {
    if (over && !started.current) {
      started.current = true;
      care('brincar');
    }
  }, [over]);

  const move = () => setSeed((p) => ({ x: 12 + Math.random() * 76, y: 10 + Math.random() * 60, k: p.k + 1 }));
  useEffect(() => {
    if (over) return;
    const t = setTimeout(move, 1100);
    return () => clearTimeout(t);
  }, [seed.k, over]);

  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label="Brincar">
      <div className="mx-auto grid max-w-[440px] gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold">Pega-semente</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        <p className="text-center text-[15px]">Toque nas sementes de girassol antes que elas pulem! O {s.pet.name} adora.</p>
        <div className="flex justify-between font-display text-[20px] font-bold tabular-nums">
          <span>🌻 {caught}</span>
          <span>⏱️ {Math.max(0, left)}s</span>
        </div>
        <div className="relative h-[320px] overflow-hidden rounded-[26px]" style={{ background: 'linear-gradient(180deg,#FFF1C9,#FFE09A)' }}>
          {!over && (
            <button
              key={seed.k}
              className="absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center text-[40px]"
              style={{ left: `${seed.x}%`, top: `${seed.y}%` }}
              aria-label="Pegar semente"
              onClick={() => {
                setCaught((c) => c + 1);
                move();
              }}
            >
              🌻
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <PetNow mood={over ? 'animado' : 'feliz'} size={130} />
          </div>
        </div>
        {over && (
          <div className="grid gap-2">
            <p className="text-center font-display text-[22px] font-bold">Você pegou {caught} {caught === 1 ? 'semente' : 'sementes'}!</p>
            <p className="text-center text-muted">O {s.pet.name} ficou muito mais feliz.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Escovar ----------

function BrushGame({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [p, setP] = useState(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const done = p >= 100;
  useEffect(() => {
    if (done) care('escovar');
  }, [done]);
  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label="Escovar o pelo">
      <div className="mx-auto grid max-w-[440px] gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold">Escovar o pelinho</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        <div
          className="grid h-[300px] place-items-center rounded-[26px] bg-surface2"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => (last.current = { x: e.clientX, y: e.clientY })}
          onPointerMove={(e) => {
            if (!last.current || done) return;
            const d = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y);
            last.current = { x: e.clientX, y: e.clientY };
            setP((v) => Math.min(100, v + d / 8));
          }}
          onPointerUp={() => (last.current = null)}
        >
          <PetNow mood={done ? 'animado' : 'calmo'} size={220} />
        </div>
        <div className="bar">
          <div className="bar-fill bar-accent" style={{ transform: `scaleX(${p / 100})` }} />
        </div>
        {done ? (
          <button className="btn btn-primary" onClick={onClose}>
            {s.pet.name} ficou brilhando ✨
          </button>
        ) : (
          <p className="text-center font-bold">Passe o dedo em cima do {s.pet.name}, devagarinho.</p>
        )}
      </div>
    </div>
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
          <PetNow mood={answer ? 'animado' : 'feliz'} size={120} />
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
