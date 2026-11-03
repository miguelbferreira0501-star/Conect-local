import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, Mail, Plus, Settings } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Scene } from '../components/Scene';
import { JourneyCard, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { QuestList } from '../components/QuestList';
import { Bar, Coins, Modal, toast } from '../components/ui';
import { GREETING, periodOf, petLine } from '../data/lines';
import { placeById, PLACES } from '../data/world';
import { activeQuests, levelProgress } from '../logic/progress';
import { streakOf } from '../logic/streak';
import { dayOf, finishAdventure, getState, kcalOf, care as doCare, todayKey, todayTasks, toggleTask, useApp, type AdventureResult } from '../lib/store';
import { addDays, prefersReducedMotion, weekStart, WEEKDAYS, fmtNum } from '../lib/util';
import { isActive } from '../logic/evolution';
import { CareLayer, type CareMode } from './Care';
import { EventsBanner } from './Events';
import type { Photo, PetMood, Task } from '../types';

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
  const [mode, setMode] = useState<CareMode>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [result, setResult] = useState<AdventureResult | null>(null);
  const [inside, setInside] = useState(false);
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
    else pop(el, `+${r.reward} 🌻`);
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
  const quests = activeQuests(s.seed, today).filter((q) => q.period === 'dia');
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));

  const CARES: { id: CareMode | 'dormir'; emoji: string; label: string; tone: string }[] = [
    { id: 'carinho', emoji: '🤲', label: 'Carinho', tone: '#FFD3DF' },
    { id: 'comida', emoji: '🥕', label: 'Comida', tone: '#FFE2B8' },
    { id: 'banho', emoji: '🛁', label: 'Banho', tone: '#CDEBFF' },
    { id: 'brincar', emoji: '🎾', label: 'Brincar', tone: '#D9F5C8' },
    { id: 'escovar', emoji: '🪮', label: 'Escovar', tone: '#E9DDFF' },
    { id: 'dormir', emoji: s.pet.sleeping ? '☀️' : '🌙', label: s.pet.sleeping ? 'Acordar' : 'Dormir', tone: '#D6DBFF' },
    { id: 'conversar', emoji: '💬', label: 'Conversar', tone: '#FFF1B8' },
    { id: 'foto', emoji: '📸', label: 'Foto', tone: '#FFD9C9' },
  ];

  const hami = adv ? (
    <div className="mb-6 grid justify-items-center gap-1 rounded-3xl bg-surface/95 px-4 py-3 text-center shadow-[var(--shadow)]">
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
    <div className="relative">
      <button className="relative block" onPointerDown={(e) => pet(e)} aria-label={`Fazer carinho no ${s.pet.name}`}>
        <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={petMood} size={176} label={s.pet.name} />
        </div>
        {hearts.map((h) => (
          <span key={h.id} className="heart-pop pointer-events-none absolute text-[26px]" style={{ left: h.x - 13, top: h.y - 20 }}>
            💗
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

  const bubble = !adv && (
    <div className="speech-float">
      <p className="text-[15px] font-semibold leading-snug">
        <span className="font-display font-bold text-accent">{s.pet.name}: </span>
        {line}
      </p>
    </div>
  );

  return (
    <div className="grid gap-4">
      {layer}
      <section className="relative" aria-label={inside ? `Casa do ${s.pet.name}` : `Jardim do ${s.pet.name}`}>
        {inside ? (
          <div className="scene-bleed relative overflow-hidden pt-[64px]" style={{ background: 'var(--page)' }}>
            <Room house={s.house} period={period} height={300}>
              {hami}
            </Room>
          </div>
        ) : (
          <div className="scene-bleed relative overflow-hidden">
            <Scene height={380} fade>
              {hami}
            </Scene>
          </div>
        )}
        <div className="scene-top">
          <span className="pill min-w-0 flex-1">
            <span className="truncate font-display text-[17px]">
              {GREETING[period]}
              {s.profile.name ? `, ${s.profile.name}` : ''}
            </span>
          </span>
          <span className="pill shrink-0">
            <Coins value={s.coins} />
          </span>
          <button className="pill pill-round shrink-0" onClick={onSettings} aria-label="Ajustes">
            <Settings size={19} />
          </button>
        </div>
        {bubble && <div className="absolute inset-x-4 top-[68px] z-[3]">{bubble}</div>}
        <div className="absolute bottom-4 left-4 z-[3] flex gap-2">
          <span className="pill !min-h-[34px] text-[13px]">
            ⭐ Nível {lv.level}
          </span>
          <button className="pill !min-h-[34px] text-[13px]" onClick={() => setInside(!inside)} aria-label={inside ? 'Ir para o jardim' : 'Entrar na casa'}>
            {inside ? '🌳 Jardim' : '🏡 Casa'}
          </button>
        </div>
      </section>

      <div className="care-row" role="group" aria-label="Cuidar do Hami">
        {CARES.map((c) => (
          <button
            key={c.label}
            className="care-btn"
            style={{ ['--tone' as string]: c.tone }}
            disabled={!!adv || (s.pet.sleeping && !['dormir', 'conversar'].includes(c.id as string))}
            onClick={() => (c.id === 'carinho' ? setMode('carinho') : c.id === 'dormir' ? setMode('dormir') : setMode(c.id as CareMode))}
          >
            <span className="care-ico" aria-hidden="true">
              {c.emoji}
            </span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      <div className="card grid grid-cols-4 gap-2 p-3">
        {(
          [
            ['felicidade', 'Feliz', 'accent', '💗'],
            ['energia', 'Energia', 'sky', '⚡'],
            ['saciedade', 'Barriga', 'gold', '🥕'],
            ['limpeza', 'Limpeza', 'leaf', '🫧'],
          ] as const
        ).map(([k, label, tone, em]) => (
          <div key={k} className="grid min-w-0 gap-1 text-center">
            <span className="truncate text-[12px] font-extrabold">
              {em} {label}
            </span>
            <Bar value={s.pet.stats[k]} tone={tone} label={label} thin />
          </div>
        ))}
      </div>

      <JourneyCard s={s} onOpen={onEvolution} />

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
                {isActive(s.days[k]) ? '🔥' : streak.rested.includes(k) ? '💤' : ''}
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

      <EventsBanner />

      <section className="grid gap-3" aria-label="Desafios de hoje">
        <h2 className="section-label px-1">Desafios de hoje</h2>
        <QuestList quests={quests} s={s} today={today} />
      </section>

      {!adv && (
        <button className="card flex items-center gap-3 p-4 text-left" onClick={() => onGo('mundo')}>
          <span className="quest-ico !h-12 !w-12 !text-[26px]" style={{ background: '#D3EAFF' }} aria-hidden="true">
            🗺️
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Levar o {s.pet.name} numa aventura</span>
            <span className="block text-[13px] text-muted">{PLACES.length} lugares no mapa, com achadinhos para o álbum</span>
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
