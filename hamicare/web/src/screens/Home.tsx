import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Mail, Plus, Settings } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { ArenaScene } from '../components/ArenaScene';
import { ArenaPin, arenaByN } from './Arenas';
import { WalletSheet } from './Collection';
import { JourneyCard, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { MealCard } from '../components/MealPlan';
import { Coins, Modal, toast } from '../components/ui';
import { GREETING, periodOf, petLine } from '../data/lines';
import { placeById } from '../data/world';
import { streakOf } from '../logic/streak';
import { dayOf, finishAdventure, homeArenaOf, getState, kcalOf, care as doCare, todayKey, todayTasks, toggleTask, useApp, type AdventureResult } from '../lib/store';
import { addDays, prefersReducedMotion, weekStart, WEEKDAYS, fmtNum } from '../lib/util';
import { isActive } from '../logic/evolution';
import type { PetMood, Task } from '../types';
import { Glyph } from '../components/art';
import { AreaPill, AreaSheet } from '../components/AreaSheet';
import { requestTool } from './Wellbeing';

export function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onArenas }: { onGo: (tab: 'atividades' | 'cuidar' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onArenas: () => void }) {
  const [areaOpen, setAreaOpen] = useState(false);
  const [wallet, setWallet] = useState(false);
  const s = useApp();
  const now = useNow(20_000);
  const today = todayKey();
  const day = dayOf(s, today);
  const tasks = todayTasks(s, today);
  const done = tasks.filter((t) => t.id in day.done).length;
  const period = periodOf(new Date(now));
  const streak = streakOf(s.days, today, s.createdAt);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [result, setResult] = useState<AdventureResult | null>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const [mood, setMoodAnim] = useState<PetMood | null>(null);
  const [puff, setPuff] = useState<{ id: number; text: string } | null>(null);
  const { pop, layer } = useKcalPop();
  const dir = s.journey.dir;

  const line = useMemo(
    () => petLine({ period, battery: day.battery, done, total: tasks.length, user: s.profile.name, seed: s.seed + today.length + done, stats: s.pet.stats, sleeping: s.pet.sleeping }),
    [period, day.battery, done, tasks.length, s.profile.name, s.seed, today, s.pet.stats, s.pet.sleeping],
  );

  const adv = s.adventure;
  const advPlace = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;

  function bounce(kind: 'squish' | 'hop') {
    if (prefersReducedMotion()) return;
    petRef.current?.animate(
      kind === 'squish'
        ? [{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,0.92)', offset: 0.3 }, { transform: 'scale(0.96,1.05)', offset: 0.65 }, { transform: 'scale(1,1)' }]
        : [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.1,0.9)', offset: 0.15 }, { transform: 'translateY(-34px) scale(0.95,1.06)', offset: 0.45 }, { transform: 'translateY(0) scale(1.08,0.92)', offset: 0.8 }, { transform: 'translateY(0) scale(1,1)' }],
      { duration: kind === 'squish' ? 480 : 700, easing: 'cubic-bezier(0.23,1,0.32,1)' },
    );
  }

  // Tocar no Hami: só um carinho rápido (os cuidados completos ficam na aba Cuidar).
  function pet(e?: React.PointerEvent) {
    if (s.pet.sleeping) return toast(`${s.pet.name} está dormindo. Shhh…`);
    doCare('carinho');
    const r = petRef.current?.getBoundingClientRect();
    const x = e && r ? e.clientX - r.left : 85;
    const y = e && r ? e.clientY - r.top : 40;
    const id = Date.now();
    setHearts((h) => [...h.slice(-6), { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((p) => p.id !== id)), 1200);
    setMoodAnim('animado');
    setTimeout(() => setMoodAnim(null), 1200);
    bounce('squish');
  }

  function onToggle(t: Task, el: HTMLElement) {
    const wasDone = t.id in day.done;
    const before = s.pet.grams;
    const r = toggleTask(t.id);
    if (!r || wasDone) return;
    const gain = dir === 'ganhar';
    if (r.kcal > 0 && dir !== 'manter') pop(el, `${gain ? '+' : '−'}${r.kcal} kcal`, gain);
    else pop(el, `+${r.reward} sementes`);
    setMoodAnim('animado');
    setTimeout(() => setMoodAnim(null), 1400);
    bounce('hop');
    // Mostra o quanto o Hami mudou (aparece logo depois do novo peso ser calculado).
    setTimeout(() => {
      const after = getState().pet.grams;
      const diff = Math.round((after - before) * 10) / 10;
      if (diff !== 0 && !s.body.hideNumbers) {
        setPuff({ id: Date.now(), text: `${diff > 0 ? '+' : '−'}${fmtNum(Math.abs(diff))} g` });
        setTimeout(() => setPuff(null), 1600);
      }
    }, 60);
  }

  const petMood: PetMood = mood ?? (s.pet.sleeping ? 'dormindo' : s.pet.stats.energia < 20 ? 'sono' : day.battery === 1 && done === 0 ? 'calmo' : 'feliz');
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));

  const hami = adv ? (
    <div className="mb-6 grid justify-items-center gap-1 rounded-3xl bg-surface/95 px-4 py-3 text-center shadow-[var(--shadow)]">
      <Glyph e={advPlace?.emoji} size={40} />
      <p className="font-display text-[17px] font-bold leading-tight">
        {s.pet.name} foi para {advPlace?.name}
      </p>
      {advLeft > 0 ? (
        <p className="text-[13px] text-muted">Volta em ~{advLeft} min. Cada missão traz ele 5 min mais cedo.</p>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => setResult(finishAdventure())}>
          <Mail size={16} /> Ver o que ele trouxe
        </button>
      )}
    </div>
  ) : (
    <div className="relative">
      <button className="relative block" onPointerDown={(e) => pet(e)} aria-label={`Fazer carinho no ${s.pet.name}`}>
        <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={petMood} size={176} label={s.pet.name} />
        </div>
        {hearts.map((h) => (
          <span key={h.id} className="heart-pop pointer-events-none absolute text-[26px]" style={{ left: h.x - 13, top: h.y - 20 }}>
            <Glyph e="💗" size={28} />
          </span>
        ))}
      </button>
      {puff && (
        <span key={puff.id} className={`grams-puff ${dir === 'ganhar' ? 'is-gain' : ''}`} aria-live="polite">
          {puff.text}
        </span>
      )}
    </div>
  );

  return (
    <div className="grid gap-4">
      {layer}
      <section className="relative" aria-label={`Jardim do ${s.pet.name}`}>
        <div className="scene-bleed relative overflow-hidden">
          <ArenaScene arena={arenaByN(homeArenaOf(s)).id} height={340} fade>
            {hami}
          </ArenaScene>
          <ArenaPin s={s} onClick={onArenas} />
        </div>
        <div className="scene-top">
          <span className="pill min-w-0 flex-1">
            <span className="truncate font-display text-[17px]">
              {GREETING[period]}
              {s.profile.name ? `, ${s.profile.name}` : ''}
            </span>
          </span>
          <button className="pill shrink-0" onClick={() => setWallet(true)} aria-label={`Carteira: ${s.coins} sementes`}>
            <Coins value={s.coins} />
          </button>
          <button className="pill pill-round shrink-0" onClick={onSettings} aria-label="Ajustes">
            <Settings size={19} />
          </button>
        </div>
        {!adv && (
          <div className="absolute inset-x-4 top-[68px] z-[3]">
            <div className="speech-float">
              <p className="text-[15px] font-semibold leading-snug">
                <span className="font-display font-bold text-accent">{s.pet.name}: </span>
                {line}
              </p>
            </div>
          </div>
        )}
      </section>

      <AreaPill onClick={() => setAreaOpen(true)} />
      <JourneyCard s={s} onOpen={onEvolution} onCalm={(a) => (requestTool(a), onGo('bem-estar'))} />
      <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <MealCard s={s} />

      <section className="grid gap-3" aria-label="Missões de hoje">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="section-label">Missões de hoje</h2>
          <span className={`chip ${streak.today ? 'chip-fire' : 'chip-plain'}`}>
            <Flame size={15} /> {streak.count} {streak.count === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div className="card grid grid-cols-7 gap-1 px-3 py-2.5">
          {week.map((k) => (
            <div key={k} className="grid justify-items-center gap-0.5 text-[11px] font-extrabold uppercase text-muted">
              {WEEKDAYS[new Date(`${k}T12:00:00`).getDay()]}
              <span className={`week-dot ${isActive(s.days[k]) ? 'is-done' : streak.rested.includes(k) ? 'is-rest' : k === today ? 'is-today' : ''}`}>
                {isActive(s.days[k]) ? <Glyph e="🔥" size={18} /> : streak.rested.includes(k) ? <Glyph e="💤" size={16} /> : ''}
              </span>
            </div>
          ))}
        </div>
        <ul className="grid gap-3">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} done={t.id in day.done} kcal={kcalOf(s, t)} dir={dir} onToggle={(el) => onToggle(t, el)} />
          ))}
        </ul>
        {!tasks.length && <p className="card p-4 text-center text-muted">Nenhuma missão para hoje. Que tal uma bem pequena?</p>}
        <button className="btn-page" onClick={() => onGo('atividades')}>
          <span className="btn-page-ico" aria-hidden="true">
            <Plus size={26} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            Adicionar ou editar missões
            <span className="block text-[13px] font-bold opacity-80">
              {done} de {tasks.length} feitas hoje
            </span>
          </span>
        </button>
      </section>

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
            <Glyph e={place.emoji} size={72} />
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
                  <Glyph e={find.emoji} size={18} /> Achadinho novo: {find.name}
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
