import { PlusWeeklyCard } from '../components/PlusWeekly';
import { MoonTeaser } from '../components/MoonTeaser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, House as HouseIcon, Mail, Plus, Settings, Trees } from 'lucide-react';
import { Outdoors, outdoorGround } from '../components/Outdoors';
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
import { MOODS, periodOf, petLine } from '../data/lines';
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
import { useFurniturePlay } from '../components/FurniturePlay';
import { TaskCalendar, byPart } from '../components/TaskCalendar';
import { petMoodOf } from '../lib/petState';
import { ACTIVITIES, activityForVisit, askText, conditionNeed, conditionOf, CONDITIONS, type Activity } from '../lib/hamiDay';
import { ActivityFx, bodyFxClass, ConditionFx } from '../components/HamiFx';
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
  // Dentro de casa ou lá fora, no quintal (fica lembrado neste aparelho).
  const [outside, setOutsideRaw] = useState(() => {
    try {
      return localStorage.getItem('hamicare:fora') === '1';
    } catch {
      return false;
    }
  });
  const setOutside = (v: boolean) => {
    setOutsideRaw(v);
    try {
      localStorage.setItem('hamicare:fora', v ? '1' : '0');
    } catch {
      /* sem armazenamento: só nesta visita */
    }
  };
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
    // Lá fora, a página continua o gramado.
    const p = trekTheme ? tonePalette((TREK_THEMES[trekTheme] ?? TREK_THEMES.casinha).ground) : outside ? tonePalette(outdoorGround(periodOf(new Date()))) : floorPalette(floor);
    const root = document.documentElement.style;
    root.setProperty('--home-floor', p.tone);
    root.setProperty('--home-page', p.page);
    root.setProperty('--home-card', p.card);
    root.setProperty('--home-deep', p.deep);
    root.setProperty('--home-page-dark', p.dark);
    root.setProperty('--home-ink', p.ink);
    return () => ['--home-floor', '--home-page', '--home-card', '--home-deep', '--home-page-dark', '--home-ink'].forEach((k) => root.removeProperty(k));
  }, [floor, trekTheme, outside]);
  const day = dayOf(s, today);
  const tasks = todayTasks(s, today);
  const done = tasks.filter((t) => t.id in day.done).length;
  const goal = dayGoalOf(s, tasks.length);
  const nodes = Math.max(1, Math.min(5, goal));
  const tripN = Object.values(s.trekCards ?? {}).reduce((a, b) => a + b, 0) + 1;
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

  // Situação do dia: ele acorda com frio, calor, gripado… e pede algumas tarefas para melhorar.
  const cond = conditionOf(s.seed, today);
  const need = conditionNeed(tasks.length);
  const condOn = tasks.length > 0 && done < need;
  // Quando melhora agora (acabou de fazer a tarefa que faltava), ele comemora e agradece.
  const wasOn = useRef(condOn);
  const [justFixed, setJustFixed] = useState(false);
  useEffect(() => {
    if (wasOn.current && !condOn) {
      setJustFixed(true);
      const t = setTimeout(() => setJustFixed(false), 8000);
      wasOn.current = condOn;
      return () => clearTimeout(t);
    }
    wasOn.current = condOn;
  }, [condOn]);
  // O que ele está fazendo nesta visita (muda a cada vez que a pessoa abre o app).
  const [activity] = useState<Activity>(() => activityForVisit(new Date().getHours()));
  const act = ACTIVITIES[activity];
  const [actLine] = useState(() => act.lines[Math.floor(Math.random() * act.lines.length)]);
  const busy = condOn || justFixed;
  const hardDay = day.battery === 1;
  const petMood: PetMood = mood ?? (justFixed ? 'risada' : condOn ? 'feliz' : hardDay ? petMoodOf(s, { hardDay, done, total: tasks.length, hour: new Date(now).getHours() }) : act.mood);
  const scrollToTasks = () => document.querySelector('.hc-tasks')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

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
      <SleepingHami fur={s.pet.fur} size={180} outfit={s.pet.outfit} />
    </button>
  ) : (
    <div className="relative">
      <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
        <LivePet
          size={168}
          mood={petMood}
          cond={condOn ? cond : null}
          wear={condOn ? CONDITIONS[cond].wear : undefined}
          prop={busy || hardDay || mood ? undefined : act.prop}
          fx={bodyFxClass(condOn ? cond : null, busy || hardDay ? null : activity)}
          onTap={() => {
            if (s.pet.sleeping) {
              toast(`${s.pet.name} está dormindo. Shhh…`);
              return false;
            }
            doCare('carinho');
          }}
        />
      </div>
      {condOn ? <ConditionFx cond={cond} /> : justFixed ? <span className="hfx hfx-yay" aria-hidden="true" /> : !hardDay && <ActivityFx act={activity} />}
      <CompanionBuddy hamster={168} />
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
        ) : outside ? (
          <PanRoom>
            <Outdoors period={period} height={430}>
              {hami}
            </Outdoors>
          </PanRoom>
        ) : (
          <PanRoom>
            <Room house={s.house} period={period} height={430} wide={1.9} onUse={furniture.useItem} usage={furniture.usage}>
              {furniture.use ? null : hami}
            </Room>
          </PanRoom>
        )}
        <div className="hr-top">
          {!s.trek && !adv ? (
            <button
              className="hr-place"
              onClick={() => {
                if (furniture.use) furniture.stop();
                setOutside(!outside);
              }}
              aria-label={outside ? `Levar o ${s.pet.name} para dentro de casa` : `Levar o ${s.pet.name} lá para fora`}
            >
              {outside ? <HouseIcon size={17} /> : <Trees size={17} />}
              {outside ? 'Voltar pra casa' : 'Sair pra fora'}
            </button>
          ) : (
            <span className="flex-1" />
          )}
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
          <div className={`hr-bubble ${condOn && !furniture.line ? 'is-need' : ''}`}>
            <p>{furniture.line ?? (s.pet.sleeping ? line : justFixed ? CONDITIONS[cond].fixed : condOn ? askText(cond, need) : hardDay ? line : actLine)}</p>
            {condOn && !furniture.line && !s.pet.sleeping && (
              <button className="hr-need" onClick={scrollToTasks} aria-label={`${Math.min(done, need)} de ${need} tarefas feitas. Ver as tarefas`}>
                <span className="hr-need-bar" aria-hidden="true">
                  <i style={{ width: `${(Math.min(done, need) / need) * 100}%` }} />
                </span>
                <b>
                  {Math.min(done, need)}/{need}
                </b>
                <ChevronRight size={16} />
              </button>
            )}
            {!condOn && !day.mood && !furniture.use && (
              <button onClick={() => openCheckin()}>
                Como você está agora? <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
        {!trekTheme && <span className="hr-hint" aria-hidden="true">{outside ? '‹ arraste para ver o quintal ›' : '‹ arraste para ver a casa ›'}</span>}
      </section>

      <TrekBar now={now} />

      {/* Aventura do dia (minimalista): bolinhas que acendem a cada tarefa; completa, o Hami sai em viagem. */}
      <section className="hc-trip" aria-label="Aventura do dia">
        <button className="hc-trip-top" onClick={() => setAreaOpen(true)} aria-label={`${tripN}ª aventura: ${Math.min(done, goal)} de ${goal} tarefas. Toque para mudar a meta.`}>
          <b>{tripN}ª Aventura</b>
          <span className="hc-trip-nodes" aria-hidden="true">
            {Array.from({ length: nodes }, (_, i) => {
              const on = done >= (goal / nodes) * (i + 1);
              return (
                <span key={i} className="hc-trip-step">
                  {i > 0 && <i className={done >= (goal / nodes) * i ? 'is-on' : ''} />}
                  <span className={`hc-trip-dot ${on ? 'is-on' : ''}`}>{on ? <Glyph e="🌼" size={22} /> : <span className="hc-trip-seed" />}</span>
                </span>
              );
            })}
          </span>
        </button>
        <button className="hc-trip-foot" onClick={onEvolution}>
          <span>{goalDone || s.trek ? 'Meta cumprida, energia carregada: vamos lá!' : `Faltam ${Math.max(0, goal - done)} ${goal - done === 1 ? 'tarefa' : 'tarefas'} para o ${s.pet.name} sair em viagem`}</span>
          <span className="hc-trip-streak">
            <Flame size={14} /> {streak.count}
          </span>
        </button>
      </section>
      <DayGoalSheet open={areaOpen} onClose={() => setAreaOpen(false)} total={tasks.length} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <section className="grid gap-3 hc-tasks" aria-label="Suas tarefas de hoje">
        <div className="hc-head">
          <button className="hc-head-btn hc-head-cal" onClick={() => setCal(true)} aria-label="Abrir o calendário de tarefas">
            <Glyph e="📅" size={24} />
          </button>
          <h2>
            Concluído hoje <b>{done}/{tasks.length}</b>
          </h2>
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
        <button className="hc-add" onClick={() => setCal(true)}>
          <Plus size={18} strokeWidth={3} /> Adicionar ou programar tarefa
        </button>
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
