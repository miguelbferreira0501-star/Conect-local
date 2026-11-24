import { PlusWeeklyCard } from '../components/PlusWeekly';
import { MoonTeaser } from '../components/MoonTeaser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Flame, Globe, House as HouseIcon, Mail, Plus, Settings, Trees } from 'lucide-react';
import { MOON_N } from '../data/arenas';
import { MoonOutdoors, Outdoors, outdoorGround } from '../components/Outdoors';
import { Room, useKindOf } from '../components/Room';
import { itemById } from '../data/items';
import { play } from '../lib/sound';
import { floorPalette, tonePalette } from '../components/Furniture';
import { TREK_THEMES, Suitcase, TrekBar, TrekScene, TrekStart, TrekUnpack, WalkingHami, finishTrek, trekThemeOf } from '../components/Trek';
import type { TrekResult } from '../lib/store';
import { introDay, startTrek, trekPlaceOf, trekReady } from '../lib/store';
import { DestinationSheet, TrekGo } from '../components/Destinations';
import { destById } from '../data/destinations';
import { TrailCard, WeekReportCard } from '../components/Trail';
import { unreadMail } from '../lib/mail';
import { SleepingHami } from '../components/SleepingHami';
import { openCheckin } from '../components/MoodCheckin';
import { WalletSheet } from './Collection';
import { TeamHomeCard } from './social/Team';
import { JourneyCard, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { MealCard } from '../components/MealPlan';
import { Modal, Sheet, toast } from '../components/ui';
import { MOODS, periodOf, petLine } from '../data/lines';
import { placeById } from '../data/world';
import { streakOf } from '../logic/streak';
import { homeArenaOf, dayGoalOf, setDayGoal, dayOf, finishAdventure, kcalOf, care as doCare, todayKey, todayTasks, toggleTask, useApp, type AdventureResult } from '../lib/store';
import { prefersReducedMotion } from '../lib/util';
import type { PetMood, Task } from '../types';
import { Glyph } from '../components/art';
import { WaterCard } from '../components/WaterCard';
import { StreakRepairCard } from '../components/StreakRepair';
import { requestTool } from './Wellbeing';
import { CompanionBuddy } from './Companions';
import { LivePet } from '../components/LivePet';
import { AddTaskSheet } from '../components/AddTask';
import { useFurniturePlay } from '../components/FurniturePlay';
import { TaskCalendar, byPart } from '../components/TaskCalendar';
import { petMoodOf } from '../lib/petState';
import { ACTIVITIES, activityForVisit, askText, conditionNeed, conditionOf, CONDITIONS, cryEvery, type Activity } from '../lib/hamiDay';
import { ActivityFx, bodyFxClass, ConditionFx } from '../components/HamiFx';
import { setBattery } from '../lib/store';


export function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Home({ onGo, onSettings, onEvolution, onArenas, onTeam, onWorld }: { onGo: (tab: 'atividades' | 'cuidar' | 'bem-estar') => void; onSettings: () => void; onEvolution: () => void; onArenas: () => void; onPlus: () => void; onTeam: () => void; onWorld?: (tab?: 'arenas' | 'casa' | 'mapa') => void }) {
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
  // Casa na Lua: lá fora é a paisagem lunar.
  const onMoon = homeArenaOf(s) === MOON_N;
  // Enquanto ele anda, o Início mostra o caminho; quando volta, ele aparece em casa com a mala.
  const trekBack = !!s.trek && now >= s.trek.endsAt;
  const trekTheme = s.trek && !trekBack ? trekThemeOf(s) : null;
  const mailN = unreadMail(s);
  const [trekStart, setTrekStart] = useState(false);
  const [trekResult, setTrekResult] = useState<TrekResult | null>(null);
  // Meta do dia completa: o Hami sai em viagem sozinho.
  const goalDone = trekReady(s);
  // Meta cumprida: aparece a tela "Ir para…" com o destino (a pessoa pode trocar antes de sair).
  const [trekGo, setTrekGo] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  useEffect(() => {
    if (!goalDone) return;
    const t = setTimeout(() => setTrekGo(true), 1000);
    return () => clearTimeout(t);
  }, [goalDone]);
  useEffect(() => {
    // Na viagem, a página continua o chão do caminho.
    // Lá fora, a página continua o gramado.
    const p = trekTheme ? tonePalette((TREK_THEMES[trekTheme] ?? TREK_THEMES.casinha).ground) : outside ? tonePalette(outdoorGround(periodOf(new Date()), onMoon)) : floorPalette(floor);
    const root = document.documentElement.style;
    root.setProperty('--home-floor', p.tone);
    root.setProperty('--home-page', p.page);
    root.setProperty('--home-card', p.card);
    root.setProperty('--home-deep', p.deep);
    root.setProperty('--home-page-dark', p.dark);
    root.setProperty('--home-ink', p.ink);
    return () => ['--home-floor', '--home-page', '--home-card', '--home-deep', '--home-page-dark', '--home-ink'].forEach((k) => root.removeProperty(k));
  }, [floor, trekTheme, outside, onMoon]);
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
  const mood: PetMood | null = null;
  const [addOpen, setAddOpen] = useState(false);
  const { layer } = useKcalPop();
  const dir = s.journey.dir;

  const line = useMemo(
    () => petLine({ period, battery: day.battery, done, total: tasks.length, user: s.profile.name, seed: s.seed + today.length + done, stats: s.pet.stats, sleeping: s.pet.sleeping }),
    [period, day.battery, done, tasks.length, s.profile.name, s.seed, today, s.pet.stats, s.pet.sleeping],
  );

  const adv = s.adventure;
  const advPlace = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;

  // Apertou, a tarefa sai na hora: sem animação, sem esperar.
  function onToggle(t: Task) {
    toggleTask(t.id);
  }
  // O "Hoje está difícil?" saiu do Início: se estava ligado hoje, volta ao normal para nenhuma tarefa ficar escondida.
  useEffect(() => {
    if (day.battery === 1) setBattery(2);
  }, [day.battery]);

  // Situação do dia: ele acorda com frio, calor, gripado… e pede algumas tarefas para melhorar.
  // Na Lua não chove: no dia da chuva ele acorda com frio.
  const cond0 = conditionOf(s.seed, today);
  const cond = onMoon && cond0 === 'chuva' ? 'frio' : cond0;
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
  // Ao abrir o app ele pode estar dormindo: na caminha (se tiver cama na casa) ou cochilando no chão. Um toque acorda.
  const [awake, setAwake] = useState(false);
  const napping = !awake && !busy && !hardDay && !adv && !s.trek && (activity === 'soneca' || activity === 'cama');
  const bed = s.house.items.find((h) => useKindOf(h.itemId, itemById(h.itemId)?.svg) === 'deitar');
  const inBed = napping && activity === 'cama' && !!bed && !outside;
  useEffect(() => {
    if (inBed && bed) furniture.useItem(bed.uid, 'deitar', true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const wake = () => {
    setAwake(true);
    play('squeak');
    if (furniture.use?.kind === 'deitar') furniture.stop();
  };
  const petMood: PetMood = mood ?? (justFixed ? 'risada' : condOn ? (CONDITIONS[cond].teary ? 'manha' : 'feliz') : hardDay ? petMoodOf(s, { hardDay, done, total: tasks.length, hour: new Date(now).getHours() }) : act.mood);
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
      <SleepingHami fur={s.pet.fur} size={136} place="chao" />
    </button>
  ) : napping && !inBed ? (
    <button className="sleep-spot" onClick={wake} aria-label={`${s.pet.name} cochilando. Toque para acordar`} data-sound="none">
      <SleepingHami fur={s.pet.fur} size={136} place="chao" />
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
          cryEvery={condOn && !mood ? cryEvery(new Date(now).getHours()) : 0}
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
    </div>
  );

  return (
    <div className="grid gap-4">
      {layer}
      <section className="home-room" aria-label={`Casa do ${s.pet.name}`}>
        {s.trek && trekTheme ? (
          <TrekScene theme={trekTheme} height={430}>
            <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={215} />
          </TrekScene>
        ) : outside ? (
          <PanRoom>
            {onMoon ? (
              <MoonOutdoors height={430}>{hami}</MoonOutdoors>
            ) : (
              <Outdoors period={period} height={430}>
                {hami}
              </Outdoors>
            )}
          </PanRoom>
        ) : (
          <PanRoom width={1.45}>
            <Room house={s.house} period={period} height={430} wide={1.45} onUse={(uid, kind) => (napping && furniture.use?.uid === uid && setAwake(true), furniture.useItem(uid, kind))} usage={furniture.usage}>
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
          {onWorld && (
            <button className="hr-pill hr-round hr-world" onClick={() => onWorld()} aria-label="Mundo: arenas, casa e passeios">
              <Globe size={18} />
            </button>
          )}
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
            <p>{napping ? actLine : furniture.line ?? (s.pet.sleeping ? line : justFixed ? CONDITIONS[cond].fixed : condOn ? askText(cond, need) : hardDay ? line : actLine)}</p>
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
        <button className="hc-trip-foot" onClick={() => (goalDone ? setTrekGo(true) : setDestOpen(true))}>
          <span>
            {goalDone ? 'Meta cumprida! Toque para escolher o destino e viajar' : s.trek ? `${s.pet.name} está em ${destById(trekPlaceOf(s))?.name ?? 'viagem'}` : `Faltam ${Math.max(0, goal - done)} ${goal - done === 1 ? 'tarefa' : 'tarefas'} · Destino: ${destById(trekPlaceOf(s))?.name ?? ''}`}
          </span>
          <span className="hc-trip-streak">
            <Flame size={14} /> {streak.count}
          </span>
        </button>
      </section>
      <TrekGo open={trekGo && !s.trek} onClose={() => setTrekGo(false)} onGo={() => (setTrekGo(false), startTrek() && setTrekStart(true))} />
      <DestinationSheet open={destOpen} onClose={() => setDestOpen(false)} />
      <DayGoalSheet open={areaOpen} onClose={() => setAreaOpen(false)} total={tasks.length} />
      <WalletSheet open={wallet} onClose={() => setWallet(false)} />

      <section className="grid gap-3 hc-tasks" aria-label="Suas tarefas de hoje">
        <div className="hc-head">
          <button className="hc-head-btn hc-head-cal" onClick={() => setCal(true)} aria-label="Abrir o calendário de tarefas">
            <Glyph e="📅" size={24} />
          </button>
          <h2>
            {tasks.length - done > 0 ? (
              <>
                Faltam hoje <b>{tasks.length - done}</b>
              </>
            ) : (
              <>
                Concluído hoje <b>{done}/{tasks.length}</b>
              </>
            )}
          </h2>
          <button className="hc-head-btn" onClick={() => openCheckin()} aria-label="Como você está agora?">
            <Glyph e={day.mood ? MOODS[day.mood - 1].emoji : '😐'} size={24} />
          </button>
        </div>
        {byPart(tasks.filter((t) => !(t.id in day.done))).map(([id, label, items]) => (
          <div key={id} className="grid gap-2">
            <p className="hc-part">{label}</p>
            <ul className="grid gap-2.5">
              {items.map((t) => (
                <TaskRow key={t.id} task={t} done={t.id in day.done} kcal={kcalOf(s, t)} dir={dir} sub={t.at} onToggle={() => onToggle(t)} quiet />
              ))}
            </ul>
          </div>
        ))}
        {tasks.length > 0 && done >= tasks.length && (
          <div className="hc-alldone">
            <Glyph e="🎉" size={64} />
            <p>
              <b>Uhuul!</b> Tarefas de hoje concluídas!
            </p>
            <button className="hc-alldone-add" onClick={() => setAddOpen(true)} aria-label="Adicionar mais tarefas">
              <Plus size={30} strokeWidth={3} />
            </button>
          </div>
        )}
        {!tasks.length && (
          <div className="hc-alldone">
            <p>Nenhuma tarefa para hoje ainda.</p>
            <button className="hc-alldone-add" onClick={() => setAddOpen(true)} aria-label="Adicionar tarefa">
              <Plus size={30} strokeWidth={3} />
            </button>
          </div>
        )}
        <AddTaskSheet open={addOpen} onClose={() => setAddOpen(false)} />
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
function PanRoom({ children, width = 1.9 }: { children: React.ReactNode; width?: number }) {
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
      <div className="hr-inner" style={{ width: `${width * 100}%` }}>{children}</div>
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
