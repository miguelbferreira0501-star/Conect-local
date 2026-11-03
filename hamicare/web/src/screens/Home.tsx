import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, Mail, Settings, Map as MapIcon } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Bar, Coins, Modal, toast } from '../components/ui';
import { GOALS, GREETING, periodOf, petLine } from '../data/lines';
import { placeById, PLACES } from '../data/world';
import { BAND, PHASES, bandLabel, conditioning } from '../logic/evolution';
import { activeQuests, claimKey, levelProgress, questProgress } from '../logic/progress';
import { streakOf } from '../logic/streak';
import { claimQuest, dayOf, finishAdventure, minor, toggleSleep, care as doCare, todayKey, todayTasks, useApp, type AdventureResult } from '../lib/store';
import { addDays, prefersReducedMotion, weekStart, WEEKDAYS, fmtNum } from '../lib/util';
import { isActive } from '../logic/evolution';
import { CareLayer, type CareMode } from './Care';
import { EventsBanner } from './Events';
import type { Photo, PetMood } from '../types';

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onShare }: { onGo: (tab: 'atividades' | 'mundo' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onShare: (p: Photo) => void }) {
  const s = useApp();
  const now = useNow(20_000);
  const today = todayKey();
  const day = dayOf(s, today);
  const tasks = todayTasks(s, today);
  const done = tasks.filter((t) => t.id in day.done).length;
  const period = periodOf(new Date(now));
  const lv = levelProgress(s.xp);
  const streak = streakOf(s.days, today, s.createdAt);
  const cond = conditioning(s.days, today);
  const hideNums = minor(s) || s.body.hideNumbers;
  const [mode, setMode] = useState<CareMode>(null);
  const [hearts, setHearts] = useState<number[]>([]);
  const [result, setResult] = useState<AdventureResult | null>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const [mood, setMoodAnim] = useState<PetMood | null>(null);

  const line = useMemo(
    () => petLine({ period, battery: day.battery, done, total: tasks.length, user: s.profile.name, seed: s.seed + today.length + done, stats: s.pet.stats, sleeping: s.pet.sleeping }),
    [period, day.battery, done, tasks.length, s.profile.name, s.seed, today, s.pet.stats, s.pet.sleeping],
  );

  const adv = s.adventure;
  const advPlace = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;

  function pet() {
    if (s.pet.sleeping) return toast(`${s.pet.name} está dormindo. Shhh…`);
    doCare('carinho');
    setHearts((h) => [...h.slice(-4), Date.now()]);
    setMoodAnim('animado');
    setTimeout(() => setMoodAnim(null), 1200);
    if (!prefersReducedMotion()) {
      petRef.current?.animate(
        [{ transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)', offset: 0.3 }, { transform: 'scale(0.97,1.04)', offset: 0.65 }, { transform: 'scale(1,1)' }],
        { duration: 480, easing: 'cubic-bezier(0.23,1,0.32,1)' },
      );
    }
  }

  const petMood: PetMood = mood ?? (s.pet.sleeping ? 'dormindo' : s.pet.stats.energia < 20 ? 'sono' : day.battery === 1 && done === 0 ? 'calmo' : 'feliz');
  const quests = activeQuests(s.seed, today).filter((q) => q.period === 'dia');
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));

  const CARES: { id: CareMode | 'dormir' | 'carinho'; emoji: string; label: string }[] = [
    { id: 'carinho', emoji: '🤲', label: 'Carinho' },
    { id: 'comida', emoji: '🥕', label: 'Comida' },
    { id: 'banho', emoji: '🛁', label: 'Banho' },
    { id: 'brincar', emoji: '🎾', label: 'Brincar' },
    { id: 'escovar', emoji: '🪮', label: 'Escovar' },
    { id: 'dormir', emoji: s.pet.sleeping ? '☀️' : '🌙', label: s.pet.sleeping ? 'Acordar' : 'Dormir' },
    { id: 'conversar', emoji: '💬', label: 'Conversar' },
    { id: 'foto', emoji: '📸', label: 'Foto' },
  ];

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            Nível {lv.level} · {s.pet.name}
          </p>
          <h1 className="truncate font-display text-[27px] font-bold leading-tight">
            {GREETING[period]}
            {s.profile.name ? `, ${s.profile.name}` : ''}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Coins value={s.coins} />
          <button className="icon-btn" onClick={onSettings} aria-label="Ajustes">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <section className="grid gap-3" aria-label={`Casa do ${s.pet.name}`}>
        <Room house={s.house} period={period} height={270}>
          {adv ? (
            <div className="mb-8 grid justify-items-center gap-1 rounded-2xl bg-surface px-4 py-3 text-center shadow-[var(--shadow)]">
              <span className="text-[30px]">{advPlace?.emoji}</span>
              <p className="font-display text-[17px] font-bold leading-tight">
                {s.pet.name} foi para {advPlace?.name}
              </p>
              {advLeft > 0 ? (
                <p className="text-[13px] text-muted">Volta em ~{advLeft} min. Cada atividade traz ele 5 min mais cedo.</p>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setResult(finishAdventure())}>
                  <Mail size={16} /> Ver o que ele trouxe
                </button>
              )}
            </div>
          ) : (
            <button className="relative" onClick={pet} aria-label={`Fazer carinho no ${s.pet.name}`}>
              <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
                <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={petMood} size={170} label={s.pet.name} />
              </div>
              {hearts.map((h, i) => (
                <span key={h} className="float-up pointer-events-none absolute left-1/2 top-6 text-[26px]" style={{ marginLeft: (i % 3) * 18 - 18 }}>
                  💛
                </span>
              ))}
            </button>
          )}
        </Room>
        {!adv && (
          <div className="speech card px-4 py-3">
            <p className="text-[16px] font-semibold leading-snug">
              <span className="font-display font-bold text-accent">{s.pet.name}: </span>
              {line}
            </p>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {CARES.map((c) => (
            <button
              key={c.label}
              className="care-btn"
              disabled={!!adv || (s.pet.sleeping && !['dormir', 'conversar'].includes(c.id as string))}
              onClick={() => (c.id === 'carinho' ? pet() : c.id === 'dormir' ? toggleSleep() : setMode(c.id as CareMode))}
            >
              <span aria-hidden="true">{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="card grid grid-cols-2 gap-x-4 gap-y-2 p-4">
          {(
            [
              ['felicidade', 'Felicidade', 'accent'],
              ['energia', 'Energia', 'sky'],
              ['saciedade', 'Barriguinha', 'gold'],
              ['limpeza', 'Limpeza', 'leaf'],
            ] as const
          ).map(([k, label, tone]) => (
            <div key={k} className="grid gap-1">
              <span className="text-[13px] font-extrabold">{label}</span>
              <Bar value={s.pet.stats[k]} tone={tone} label={label} thin />
            </div>
          ))}
        </div>
      </section>

      <EventsBanner />

      <button className="card grid gap-3 p-4 text-left" onClick={() => onGo('atividades')}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[20px] font-bold">Hoje</h2>
          <span className={`chip ${streak.today ? 'chip-accent' : 'chip-plain'}`}>
            <Flame size={15} className={streak.today ? 'text-accent' : 'text-muted'} /> {streak.count} {streak.count === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Bar value={done} max={Math.max(1, tasks.length)} tone="leaf" label="Atividades de hoje" />
          </div>
          <span className="text-[14px] font-bold tabular-nums">
            {done}/{tasks.length}
          </span>
          <ChevronRight size={18} className="text-muted" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week.map((k) => (
            <div key={k} className="grid justify-items-center gap-0.5 text-[11px] font-extrabold uppercase text-muted">
              {WEEKDAYS[new Date(`${k}T12:00:00`).getDay()]}
              <span className={`grid h-7 w-7 place-items-center rounded-full text-[13px] ${isActive(s.days[k]) ? 'bg-leaf text-surface' : streak.rested.includes(k) ? 'bg-surface2' : k === today ? 'border-2 border-dashed border-line' : 'bg-surface2'}`}>
                {isActive(s.days[k]) ? '✓' : streak.rested.includes(k) ? '💤' : ''}
              </span>
            </div>
          ))}
        </div>
      </button>

      <section className="card grid gap-3 p-4" aria-label="Missões de hoje">
        <h2 className="font-display text-[20px] font-bold">Missões de hoje</h2>
        {quests.map((q) => {
          const p = questProgress(q, s.days, today);
          const claimed = !!s.claimed[claimKey(q, today)];
          return (
            <div key={q.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight">{q.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1">
                    <Bar value={p} max={q.target} tone="gold" label={q.title} thin />
                  </div>
                  <span className="text-[12px] font-bold tabular-nums text-muted">
                    {p}/{q.target}
                  </span>
                </div>
              </div>
              {claimed ? (
                <span className="chip chip-leaf">Feita ✓</span>
              ) : (
                <button className="btn btn-soft btn-sm" disabled={p < q.target} onClick={() => claimQuest(q.id) && toast(`+${q.coins} sementes!`)}>
                  +{q.coins} 🌻
                </button>
              )}
            </div>
          );
        })}
      </section>

      <button className="card grid gap-3 p-4 text-left" onClick={onEvolution}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold">Nossa evolução</h2>
          <ChevronRight size={20} className="text-muted" />
        </div>
        <div className="flex items-center gap-3">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={78} idle={false} />
          <div className="grid min-w-0 flex-1 gap-1 text-[14px]">
            <p>
              <b>Fase:</b> {PHASES[s.pet.phase]} · <b>Objetivo:</b> {GOALS[s.profile.goal].label}
            </p>
            <p>{hideNums ? <><b>Forma:</b> {bandLabel(s.pet.grams)}</> : <><b>Peso virtual:</b> {fmtNum(s.pet.grams)} g ({bandLabel(s.pet.grams).toLowerCase()}, faixa {BAND.min}–{BAND.max} g)</>}</p>
            <div className="flex items-center gap-2">
              <span className="font-bold">Condicionamento</span>
              <div className="flex-1">
                <Bar value={cond} tone="leaf" label="Condicionamento" thin />
              </div>
              <span className="tabular-nums text-muted">{cond}</span>
            </div>
          </div>
        </div>
      </button>

      {!adv && (
        <button className="card flex items-center gap-3 p-4 text-left" onClick={() => onGo('mundo')}>
          <MapIcon className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Levar o {s.pet.name} numa aventura</span>
            <span className="block text-[13px] text-muted">{PLACES.length} lugares no mapa, com achadinhos para colecionar</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </button>
      )}

      <CareLayer mode={mode} onClose={() => setMode(null)} onShare={onShare} />
      <AdventureModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

export function AdventureModal({ result, onClose }: { result: AdventureResult | null; onClose: () => void }) {
  const s = useApp();
  const place = result ? placeById(result.placeId) : null;
  const find = place?.finds.find((f) => f.id === result?.find);
  return (
    <Modal open={!!result} onClose={onClose} label="Volta da aventura">
      {result && place && (
        <div>
          <div className="flex h-40 items-end justify-between rounded-t-[28px] p-5" style={{ background: `linear-gradient(160deg, ${place.colors[0]}, ${place.colors[1]})` }}>
            <p className="font-display text-[26px] font-bold leading-tight text-[#2B2240]">{place.name}</p>
            <span className="text-[58px] leading-none">{place.emoji}</span>
          </div>
          <div className="grid gap-3 p-5">
            <p className="text-[17px] leading-relaxed">
              {s.profile.name ? `${s.profile.name}, ` : ''}
              {result.story}
            </p>
            <p className="font-display text-[18px] font-semibold text-muted">Com carinho, {s.pet.name}</p>
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-gold">+{result.coins} sementes</span>
              <span className="chip chip-plain">+{result.xp} XP</span>
              {find && (
                <span className="chip chip-leaf">
                  {find.emoji} Achadinho novo: {find.name}
                </span>
              )}
            </div>
            <button className="btn btn-primary" onClick={onClose}>
              Que aventura!
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
