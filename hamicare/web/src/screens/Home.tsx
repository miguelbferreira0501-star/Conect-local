import { PlusWeeklyCard } from '../components/PlusWeekly';
import { MoonTeaser } from '../components/MoonTeaser';
import { useGrowth } from '../components/Growth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, Mail, Plus, Settings } from 'lucide-react';
import { Room } from '../components/Room';
import { floorPalette, tonePalette } from '../components/Furniture';
import { TREK_THEMES, TrekBar, TrekCard, TrekResultModal, TrekScene, TrekStart, WalkingHami, finishTrek, trekThemeOf } from '../components/Trek';
import type { TrekResult } from '../lib/store';
import { openUi } from '../lib/bus';
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

export function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onArenas, onPlus, onTeam, onWorld }: { onGo: (tab: 'atividades' | 'cuidar' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onArenas: () => void; onPlus: () => void; onTeam: () => void; onWorld?: (tab: 'casa' | 'armario' | 'loja') => void }) {
  const [areaOpen, setAreaOpen] = useState(false);
  const [wallet, setWallet] = useState(false);
  const s = useApp();
  const now = useNow(20_000);
  const today = todayKey();
  // O Início continua o chão da casa: o degradê, a página e os cartões seguem a cor do piso.
  const floor = s.house.floor;
  const trekTheme = s.trek ? trekThemeOf(s) : null;
  const mailN = unreadMail(s);
  const [trekStart, setTrekStart] = useState(false);
  const [trekResult, setTrekResult] = useState<TrekResult | null>(null);
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
          <TrekScene theme={trekTheme} height={430} still={now >= s.trek.endsAt}>
            <div className="grid justify-items-center gap-2">
              {now >= s.trek.endsAt && (
                <button className="btn btn-primary btn-sm" data-sound="conquista" onClick={() => setTrekResult(finishTrek())}>
                  <Mail size={16} /> Ver o que ele trouxe
                </button>
              )}
              <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={176} still={now >= s.trek.endsAt} />
            </div>
          </TrekScene>
        ) : (
          <PanRoom>
            <Room house={s.house} period={period} height={430} wide={1.9}>
              {hami}
            </Room>
          </PanRoom>
        )}
        <div className="hr-top">
          <span className="hr-hello">
            {GREETING[period]}
            {s.profile.name ? `, ${s.profile.name}` : ''}
          </span>
          <button className="hr-pill" onClick={() => setWallet(true)} aria-label={`Carteira: ${s.coins} sementes`}>
            <Coins value={s.coins} />
          </button>
          <button className="hr-pill hr-round" onClick={onSettings} aria-label="Menu">
            <Settings size={18} />
          </button>
        </div>
        <div className="hr-left">
          <button className="hr-icon" onClick={() => onGo('atividades')} aria-label={`Missões: faltam ${Math.max(0, tasks.length - done)}`}>
            <Glyph e="📅" size={34} />
            {tasks.length - done > 0 && <span className="hr-badge">{tasks.length - done}</span>}
          </button>
          <button className="hr-icon" onClick={() => openUi('correio')} aria-label={`Correio${mailN ? `: ${mailN} novas` : ''}`}>
            <Glyph e="💌" size={34} />
            {mailN > 0 && <span className="hr-badge">{mailN}</span>}
          </button>
          <button className="hr-icon" onClick={onArenas} aria-label="Mapa das arenas">
            <Glyph e="🗺️" size={32} />
          </button>
          <button className="hr-icon hr-rocket" onClick={onArenas} aria-label="Viajar para a Lua">
            <Glyph e="🚀" size={32} />
          </button>
        </div>
        <div className="hr-tools" role="toolbar" aria-label="Atalhos">
          <button onClick={() => onWorld?.('armario')} aria-label="Roupas">
            <Glyph e="👗" size={34} />
          </button>
          <button onClick={() => onWorld?.('casa')} aria-label="Decorar a casa">
            <Glyph e="🏡" size={34} />
          </button>
          <button onClick={() => onGo('cuidar')} aria-label="Cuidar e brincar">
            <Glyph e="🧶" size={34} />
          </button>
          <button onClick={onPlus} aria-label="HamiCare+">
            <Glyph e="👑" size={32} />
          </button>
        </div>
        {!adv && !s.trek && (
          <div className="hr-bubble">
            <p>{line}</p>
            {!day.mood && (
              <button onClick={() => openCheckin()}>
                Como você está agora? <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
        {!s.trek && <span className="hr-hint" aria-hidden="true">‹ arraste para ver a casa ›</span>}
      </section>

      <TrekBar now={now} />
      <TrekCard onStarted={() => setTrekStart(true)} />

      <PlusWeeklyCard />
      <MoonTeaser onGo={onArenas} />
      <StreakRepairCard />

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
        <p className="hc-adv-sub">
          <Flame size={14} /> {streak.count} {streak.count === 1 ? 'dia seguido' : 'dias seguidos'} · <button onClick={onEvolution}>{growthName}</button>
        </p>
      </section>
      <WaterCard />
      <DayGoalSheet open={areaOpen} onClose={() => setAreaOpen(false)} total={tasks.length} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <section className="grid gap-3 hc-tasks" aria-label="Missões de hoje">
        <div className="hc-head">
          <span className="hc-head-ico" aria-hidden="true">
            <Glyph e="📅" size={24} />
          </span>
          <h2>
            Concluído hoje <b>{done}/{tasks.length}</b>
          </h2>
          <button className="hc-head-btn" onClick={() => openCheckin()} aria-label="Como você está agora?">
            <Glyph e={day.mood ? MOODS[day.mood - 1].emoji : '😐'} size={24} />
          </button>
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
      <TrekStart open={trekStart} onClose={() => setTrekStart(false)} />
      <TrekResultModal result={trekResult} onClose={() => setTrekResult(null)} />
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
