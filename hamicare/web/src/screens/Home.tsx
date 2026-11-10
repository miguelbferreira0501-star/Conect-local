import { useGrowth } from '../components/Growth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Mail, Plus, Settings } from 'lucide-react';
import { ArenaScene } from '../components/ArenaScene';
import { ArenaPin, arenaByN } from './Arenas';
import { WalletSheet } from './Collection';
import { PlusPill } from '../components/PlusCard';
import { TeamHomeCard } from './social/Team';
import { JourneyCard, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { MealCard } from '../components/MealPlan';
import { Coins, Modal, Sheet, toast } from '../components/ui';
import { GREETING, periodOf, petLine } from '../data/lines';
import { placeById } from '../data/world';
import { streakOf } from '../logic/streak';
import { dayGoalOf, setDayGoal, dayOf, finishAdventure, homeArenaOf, getState, kcalOf, care as doCare, todayKey, todayTasks, toggleTask, useApp, type AdventureResult } from '../lib/store';
import { prefersReducedMotion, fmtNum } from '../lib/util';
import type { PetMood, Task } from '../types';
import { Glyph } from '../components/art';
import { WaterCard } from '../components/WaterCard';
import { requestTool } from './Wellbeing';
import { CompanionBuddy } from './Companions';
import { LivePet } from '../components/LivePet';

export function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onArenas, onPlus, onTeam }: { onGo: (tab: 'atividades' | 'cuidar' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onArenas: () => void; onPlus: () => void; onTeam: () => void }) {
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

  const hami = adv ? (
    <div className="mb-6 grid justify-items-center gap-1 rounded-3xl bg-surface/95 px-4 py-3 text-center shadow-[var(--shadow)]">
      <Glyph e={advPlace?.emoji} size={40} />
      <p className="font-display text-[17px] font-bold leading-tight">
        {s.pet.name} foi para {advPlace?.name}
      </p>
      {advLeft > 0 ? (
        <p className="text-[13px] text-muted">Volta em ~{advLeft} min. Cada missão traz ele 5 min mais cedo.</p>
      ) : (
        <button className="btn btn-primary btn-sm" data-sound="conquista" onClick={() => setResult(finishAdventure())}>
          <Mail size={16} /> Ver o que ele trouxe
        </button>
      )}
    </div>
  ) : (
    <div className="relative">
      <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
        <LivePet
          size={210}
          mood={petMood}
          onTap={() => {
            if (s.pet.sleeping) {
              toast(`${s.pet.name} está dormindo. Shhh…`);
              return false;
            }
            doCare('carinho');
          }}
        />
      </div>
      <CompanionBuddy hamster={210} />
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
          <ArenaScene arena={arenaByN(homeArenaOf(s)).id} height={400} fade>
            {hami}
          </ArenaScene>
          <ArenaPin s={s} onClick={onArenas} />
          <PlusPill onOpen={onPlus} scene />
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

      <HomeChips onGrowth={onEvolution} onGoal={() => setAreaOpen(true)} streakCount={streak.count} streakToday={streak.today} done={done} total={tasks.length} />
      <WaterCard />
      <DayGoalSheet open={areaOpen} onClose={() => setAreaOpen(false)} total={tasks.length} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <section className="grid gap-3" aria-label="Missões de hoje">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="section-label">Missões de hoje</h2>
          <span className="text-[13px] font-extrabold opacity-70">
            {done}/{tasks.length} · meta {dayGoalOf(s, tasks.length)}
          </span>
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

      <MealCard s={s} />
      <JourneyCard s={s} onOpen={onEvolution} onCalm={(a) => (requestTool(a), onGo('bem-estar'))} />
      <TeamHomeCard onOpen={onTeam} />

      <AdventureModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}

/** Três selinhos no lugar de vários cartões: tamanho do Hami, dias seguidos e a meta do dia. */
function HomeChips({ onGrowth, onGoal, streakCount, streakToday, done, total }: { onGrowth: () => void; onGoal: () => void; streakCount: number; streakToday: boolean; done: number; total: number }) {
  const s = useApp();
  const g = useGrowth(s);
  const goal = dayGoalOf(s, total);
  const hit = done >= goal;
  return (
    <div className="home-chips">
      <button className="home-chip" onClick={onGrowth} aria-label={`${s.pet.name}: ${g.name}. ${g.next ? `Cresce em ${g.toNext} dias de cuidado` : 'Tamanho máximo'}`}>
        <span className="home-chip-ico" style={{ background: '#DFF5D2' }}>
          <Glyph e="🌱" size={22} />
        </span>
        <span className="home-chip-text">
          <b>{g.name}</b>
          <small>{g.next ? `cresce em ${g.toNext}d` : 'tamanho máximo'}</small>
        </span>
      </button>
      <button className="home-chip" onClick={onGrowth} aria-label={`${streakCount} ${streakCount === 1 ? 'dia' : 'dias'} seguidos`}>
        <span className="home-chip-ico" style={{ background: streakToday ? '#FFE0CC' : '#F1ECE6' }}>
          <Flame size={20} className={streakToday ? 'text-[#F26B2A]' : 'text-[#A89C90]'} />
        </span>
        <span className="home-chip-text">
          <b>
            {streakCount} {streakCount === 1 ? 'dia' : 'dias'}
          </b>
          <small>seguidos</small>
        </span>
      </button>
      <button className="home-chip" onClick={onGoal} aria-label={`Meta do dia: ${done} de ${goal} missões. Mudar a meta`}>
        <span className="home-chip-ico" style={{ background: hit ? '#FFF1B8' : '#FFE6EE' }}>
          <Glyph e={hit ? '🏆' : '🎯'} size={22} />
        </span>
        <span className="home-chip-text">
          <b>
            {Math.min(done, goal)}/{goal} {hit ? 'feito!' : 'hoje'}
          </b>
          <small>meta do dia</small>
        </span>
      </button>
    </div>
  );
}

/** A pessoa escolhe quantas missões quer fazer por dia. */
function DayGoalSheet({ open, onClose, total }: { open: boolean; onClose: () => void; total: number }) {
  const s = useApp();
  const goal = dayGoalOf(s, total);
  const opts = Array.from(new Set([1, 2, 3, 4, 5, 6, 8, 10, total].filter((n) => n > 0 && n <= Math.max(total, 1)))).sort((a, b) => a - b);
  return (
    <Sheet open={open} onClose={onClose} title="Sua meta do dia">
      <div className="grid gap-3 pb-2">
        <p className="text-[14px] text-muted">Quantas missões você quer fazer por dia? Comece pequeno: bater uma meta leve todo dia vale mais que uma meta enorme.</p>
        <div className="grid grid-cols-4 gap-2">
          {opts.map((n) => (
            <button key={n} className={`goal-opt ${n === goal ? 'is-on' : ''}`} onClick={() => (setDayGoal(n), toast(`Meta: ${n} ${n === 1 ? 'missão' : 'missões'} por dia`))}>
              <b>{n}</b>
              <small>{n === total ? 'todas' : n === 1 ? 'missão' : 'missões'}</small>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted">Você tem {total} missões hoje. Dá para adicionar ou tirar missões na aba Missões.</p>
      </div>
    </Sheet>
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
