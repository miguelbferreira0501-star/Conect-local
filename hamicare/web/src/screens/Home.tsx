import { PlusWeeklyCard } from '../components/PlusWeekly';
import { MoonTeaser } from '../components/MoonTeaser';
import { useGrowth } from '../components/Growth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, Mail, Plus, Settings } from 'lucide-react';
import { Room } from '../components/Room';
import { floorPalette, tonePalette } from '../components/Furniture';
import { TREK_THEMES, Suitcase, TrekBar, TrekScene, TrekStart, TrekUnpack, WalkingHami, finishTrek, trekThemeOf } from '../components/Trek';
import type { TrekResult } from '../lib/store';
import { introDay, startTrek, trekReady } from '../lib/store';
import { TrailCard, WeekReportCard } from '../components/Trail';
import { unreadMail } from '../lib/mail';
import { SleepingHami } from '../components/SleepingHami';
import { openCheckin } from '../components/MoodCheckin';
import { WalletSheet } from './Collection';
import { TeamHomeCard } from './social/Team';
import { JourneyCard, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { MealCard } from '../components/MealPlan';
import { Coins, Modal, Sheet, toast } from '../components/ui';
import { GREETING, MOODS, periodOf, petLine } from '../data/lines';
import { placeById } from '../data/world';
import { streakOf } from '../logic/streak';
import { dayGoalOf, setDayGoal, dayOf, finishAdventure, getState, kcalOf, care as doCare, todayKey, todayTasks, toggleTask, useApp, type AdventureResult } from '../lib/store';
import { prefersReducedMotion, fmtNum } from '../lib/util';
import type { PetMood, Task } from '../types';
import { Glyph } from '../components/art';
import { WaterCard } from '../components/WaterCard';
import { StreakRepairCard } from '../components/StreakRepair';
import { requestTool } from './Wellbeing';
import { CompanionBuddy } from './Companions';
import { LivePet } from '../components/LivePet';
import { openUi } from '../lib/bus';
import { useFurniturePlay } from '../components/FurniturePlay';
import { TaskCalendar, byPart } from '../components/TaskCalendar';
import { petMoodOf } from '../lib/petState';
import { setBattery } from '../lib/store';

/** Diferencial: "Hoje está difícil" deixa só as tarefas leves e o Hami fica do seu lado, sem perder a sequência. */
function HardDay({ hard, pet }: { hard: boolean; pet: string }) {
  return hard ? (
    <div className="hc-hard is-on" role="status">
      <Glyph e="🫂" size={30} />
      <span className="min-w-0 flex-1">
        <b>Modo dia difícil</b>
        <small>Só as tarefas leves ficaram. O {pet} está aqui com você, e a sua sequência está protegida.</small>
      </span>
      <button onClick={() => (setBattery(2), toast('Tudo bem! Voltaram todas as tarefas.'))}>Já melhorou</button>
    </div>
  ) : (
    <button className="hc-hard" onClick={() => (setBattery(1), toast(`O ${pet} vai devagar com você hoje.`))}>
      <Glyph e="🌧️" size={24} /> Hoje está difícil? <small>Deixe só o essencial</small>
    </button>
  );
}

export function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onArenas, onTeam }: { onGo: (tab: 'atividades' | 'cuidar' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onArenas: () => void; onPlus: () => void; onTeam: () => void; onWorld?: (tab: 'casa' | 'armario' | 'loja') => void }) {
  const [areaOpen, setAreaOpen] = useState(false);
  const [wallet, setWallet] = useState(false);
  const [cal, setCal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const s = useApp();
  const now = useNow(20_000);
  const furniture = useFurniturePlay(!!(s.adventure || s.trek));
  const today = todayKey();
  // O Início continua o chão da casa: o degradê, a página e os cartões seguem a cor do piso.
  const floor = s.house.floor;
  // Enquanto ele anda, o Início mostra o caminho; quando volta, ele aparece em casa com a mala.
  const trekBack = !!s.trek && now >= s.trek.endsAt;
  const trekTheme = s.trek && !trekBack ? trekThemeOf(s) : null;
  const mailN = unreadMail(s);
  const [trekStart, setTrekStart] = useState(false);
  const [trekResult, setTrekResult] = useState<TrekResult | null>(null);
  // Meta do dia completa: o Hami sai em viagem sozinho.
  const goalDone = trekReady(s);
  useEffect(() => {
    if (!goalDone) return;
    const t = setTimeout(() => startTrek() && setTrekStart(true), 1200);
    return () => clearTimeout(t);
  }, [goalDone]);
  useEffect(() => {
    // Na viagem, a página continua o chão do caminho.
    const p = trekTheme ? tonePalette((TREK_THEMES[trekTheme] ?? TREK_THEMES.casinha).ground) : floorPalette(floor);
    const root = document.documentElement.style;
    root.setProperty('--home-floor', p.tone);
    root.setProperty('--home-page', p.page);
    root.setProperty('--home-card', p.card);
    root.setProperty('--home-deep', p.deep);
    root.setProperty('--home-page-dark', p.dark);
    root.setProperty('--home-ink', p.ink);
    return () => ['--home-floor', '--home-page', '--home-card', '--home-deep', '--home-page-dark', '--home-ink'].forEach((k) => root.removeProperty(k));
  }, [floor, trekTheme]);
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
  const growthName = useGrowth(s).name;

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

  const petMood: PetMood = mood ?? petMoodOf(s, { hardDay: day.battery === 1, done, total: tasks.length, hour: new Date(now).getHours() });

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
  ) : s.pet.sleeping ? (
    <button className="sleep-spot" onClick={() => toast(`${s.pet.name} está dormindo. Shhh…`)} aria-label={`${s.pet.name} dormindo`} data-sound="none">
      <SleepingHami fur={s.pet.fur} size={205} outfit={s.pet.outfit} />
    </button>
  ) : (
    <div className="relative">
      <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
        <LivePet
          size={196}
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
      <CompanionBuddy hamster={196} />
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
      <section className="home-room" aria-label={`Casa do ${s.pet.name}`}>
        {s.trek && trekTheme ? (
          <TrekScene theme={trekTheme} height={430}>
            <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={176} />
          </TrekScene>
        ) : (
          <PanRoom>
            <Room house={s.house} period={period} height={430} wide={1.9} onUse={furniture.useItem} usage={furniture.usage}>
              {furniture.use ? null : hami}
            </Room>
          </PanRoom>
        )}
        <div className="hr-top">
          <button className="hr-hello" onClick={() => openUi('hami')} aria-label={`Perfil do ${s.pet.name}`}>
            {GREETING[period]}
            {s.profile.name ? `, ${s.profile.name}` : ''}
          </button>
          <button className="hr-pill" onClick={() => setWallet(true)} aria-label={`Carteira: ${s.coins} sementes`}>
            <Coins value={s.coins} />
          </button>
          <button className="hr-pill hr-round" onClick={onSettings} aria-label={`Menu${mailN ? `: ${mailN} cartas novas` : ''}`}>
            <Settings size={18} />
            {mailN > 0 && <span className="hr-dot" aria-hidden="true" />}
          </button>
        </div>
        {trekBack && (
          <>
            <div className="hr-bubble">
              <p>Vamos ver qual é o presente desta vez!</p>
            </div>
            <button className="hr-mala" data-sound="conquista" onClick={() => setTrekResult(finishTrek())} aria-label="Abrir a mala da viagem">
              <Suitcase size={84} />
            </button>
          </>
        )}
        {!adv && !s.trek && (
          <div className="hr-bubble">
            <p>{furniture.line ?? line}</p>
            {!day.mood && !furniture.use && (
              <button onClick={() => openCheckin()}>
                Como você está agora? <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
        {!trekTheme && <span className="hr-hint" aria-hidden="true">‹ arraste para ver a casa ›</span>}
      </section>

      <TrekBar now={now} />

      <section className="hc-adv" aria-label="Meta do dia">
        <button className="hc-adv-title" onClick={() => setAreaOpen(true)}>
          Meta do dia · {Math.min(done, dayGoalOf(s, tasks.length))}/{dayGoalOf(s, tasks.length)}
        </button>
        <div className="hc-nodes" aria-hidden="true">
          {Array.from({ length: Math.min(6, dayGoalOf(s, tasks.length)) }, (_, i) => {
            const goal = dayGoalOf(s, tasks.length);
            const n = Math.min(6, goal);
            const step = (goal / n) * (i + 1);
            return (
              <span key={i} className="hc-node-wrap">
                {i > 0 && <span className={`hc-link ${done >= (goal / n) * i ? 'is-on' : ''}`} />}
                <span className={`hc-node ${done >= step ? 'is-on' : ''}`}>{done >= step ? '✓' : ''}</span>
              </span>
            );
          })}
        </div>
        {!s.trek && s.trekDay !== today && <p className="hc-adv-trip">🎒 Complete a meta e o {s.pet.name} sai em viagem!</p>}
        <p className="hc-adv-sub">
          <Flame size={14} /> {streak.count} {streak.count === 1 ? 'dia seguido' : 'dias seguidos'} · <button onClick={onEvolution}>{growthName}</button>
        </p>
      </section>
      <DayGoalSheet open={areaOpen} onClose={() => setAreaOpen(false)} total={tasks.length} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <section className="grid gap-3 hc-tasks" aria-label="Suas tarefas de hoje">
        <div className="hc-head">
          <h2>
            Suas tarefas de hoje <b>{done}/{tasks.length}</b>
          </h2>
          <button className="hc-head-btn" onClick={() => setCal(true)} aria-label="Abrir o calendário de tarefas">
            <Glyph e="📅" size={24} />
          </button>
          <button className="hc-head-btn" onClick={() => openCheckin()} aria-label="Como você está agora?">
            <Glyph e={day.mood ? MOODS[day.mood - 1].emoji : '😐'} size={24} />
          </button>
        </div>
        <HardDay hard={day.battery === 1} pet={s.pet.name} />
        {byPart(tasks).map(([id, label, items]) => (
          <div key={id} className="grid gap-2">
            <p className="hc-part">{label}</p>
            <ul className="grid gap-2.5">
              {items.map((t) => (
                <TaskRow key={t.id} task={t} done={t.id in day.done} kcal={kcalOf(s, t)} dir={dir} sub={t.at} onToggle={(el) => onToggle(t, el)} />
              ))}
            </ul>
          </div>
        ))}
        {!tasks.length && <p className="card p-4 text-center text-muted">Nenhuma tarefa para hoje. Que tal programar uma bem pequena no calendário?</p>}
        <div className="hc-actions">
          <button className="btn-page" onClick={() => setCal(true)}>
            <span className="btn-page-ico" aria-hidden="true">
              <Plus size={24} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              Calendário e tarefas
              <span className="block text-[13px] font-bold opacity-80">Programe dias, horários e lembretes</span>
            </span>
          </button>
        </div>
      </section>

      <details className="hc-more" open={moreOpen} onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}>
        <summary>
          <span>Mais para hoje</span>
          <small>água, trilha, relatórios e mais</small>
        </summary>
        <div className="grid gap-4 pt-3">
          <PlusWeeklyCard />
          <WaterCard />
          <TrailCard />
          {introDay(s) > 3 && <MoonTeaser onGo={onArenas} />}
          {introDay(s) > 3 && <StreakRepairCard />}
          {introDay(s) > 2 && <WeekReportCard />}
          <MealCard s={s} />
          <JourneyCard s={s} onOpen={onEvolution} onCalm={(a) => (requestTool(a), onGo('bem-estar'))} />
          {introDay(s) > 3 && <TeamHomeCard onOpen={onTeam} />}
        </div>
      </details>
      <TaskCalendar open={cal} onClose={() => setCal(false)} />

      <AdventureModal result={result} onClose={() => setResult(null)} />
      <TrekStart open={trekStart} onClose={() => setTrekStart(false)} />
      <TrekUnpack result={trekResult} onClose={() => setTrekResult(null)} />
    </div>
  );
}

/** A casa é mais larga que a tela: arrasta para os lados (com o dedo ou o mouse). Começa no meio. */
function PanRoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
  return (
    <div
      ref={ref}
      className="hr-scroll"
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') return;
        drag.current = { x: e.clientX, left: ref.current!.scrollLeft };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        ref.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <div className="hr-inner">{children}</div>
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
