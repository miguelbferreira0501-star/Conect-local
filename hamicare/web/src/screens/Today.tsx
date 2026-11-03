import { useEffect, useMemo, useRef, useState } from 'react';
import { BatteryLow, BatteryMedium, BatteryFull, Check, Plus, Settings, Shuffle, Trash2, Luggage, Mail } from 'lucide-react';
import { Pet, type PetMood } from '../components/Pet';
import { Room } from '../components/Room';
import { Bar, Seed, Seeds, Sheet, toast } from '../components/ui';
import { EvolveModal, PostcardModal } from '../components/Celebrations';
import { BATTERIES, GREETING, MOODS, periodOf, petLine } from '../data/lines';
import { GOAL_EMOJIS } from '../data/tasks';
import { placeById } from '../data/places';
import {
  STAGES, addGoal, dayOf, finishTrip, removeTask, setBattery, setMood, stageOf, startTrip, swapSuggestion,
  todayKey, todayTasks, toggleTask, useApp, type Battery, type Mood, type Postcard,
} from '../lib/store';
import { prefersReducedMotion } from '../lib/util';

const BATTERY_ICON = { 1: BatteryLow, 2: BatteryMedium, 3: BatteryFull } as const;

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Today({ onOpenSettings }: { onOpenSettings: () => void }) {
  const s = useApp();
  const now = useNow(20_000);
  const key = todayKey();
  const day = dayOf(s, key);
  const tasks = todayTasks(s, key);
  const doneCount = tasks.filter((t) => day.done.includes(t.id)).length;
  const period = periodOf(new Date(now));
  const stage = stageOf(s.xp);
  const next = STAGES[stage + 1];

  const petRef = useRef<HTMLDivElement>(null);
  const [excited, setExcited] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [postcard, setPostcard] = useState<Postcard | null>(null);
  const [evolved, setEvolved] = useState<number | null>(null);

  const line = useMemo(
    () => petLine({ period, battery: day.battery, done: doneCount, total: tasks.length, user: s.userName, seed: s.seed + key.length + doneCount }),
    [period, day.battery, doneCount, tasks.length, s.userName, s.seed, key],
  );

  const mood: PetMood = excited
    ? 'animado'
    : day.battery === 1 && doneCount === 0
      ? 'calmo'
      : period === 'noite' && tasks.length > 0 && doneCount >= tasks.length
        ? 'sono'
        : 'feliz';

  function celebrate() {
    setExcited(true);
    setTimeout(() => setExcited(false), 1400);
    if (prefersReducedMotion()) return;
    petRef.current?.animate(
      [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(2px) scale(1.06, 0.92)', offset: 0.18 },
        { transform: 'translateY(-22px) scale(0.96, 1.05)', offset: 0.5 },
        { transform: 'translateY(0) scale(1.04, 0.96)', offset: 0.82 },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
      { duration: 560, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  }

  function onToggle(id: string) {
    const res = toggleTask(id);
    if (!res) return;
    celebrate();
    toast(`+${res.reward} sementinhas`);
    if (res.evolvedTo !== undefined) setTimeout(() => setEvolved(res.evolvedTo!), 700);
  }

  function onFinishTrip() {
    const res = finishTrip();
    if (!res) return;
    setPostcard(res.card);
    if (res.evolvedTo !== undefined) setEvolved(res.evolvedTo);
  }

  const trip = s.trip;
  const tripPlace = trip ? placeById(trip.placeId) : null;
  const tripLeft = trip ? Math.max(0, Math.ceil((trip.endsAt - now) / 60_000)) : 0;

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{new Date(now).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="truncate font-display text-[28px] font-bold leading-tight">
            {GREETING[period]}{s.userName ? `, ${s.userName}` : ''}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Seeds value={s.seeds} />
          <button className="icon-btn" onClick={onOpenSettings} aria-label="Ajustes">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <section aria-label={`Cantinho de ${s.petName}`} className="grid gap-3">
        <Room period={period} decor={s.decor} height={250}>
          {trip ? (
            <div className="mb-6 grid justify-items-center gap-1 rounded-2xl bg-surface px-4 py-3 text-center shadow-[var(--shadow)]">
              <Luggage size={28} className="text-accent" aria-hidden="true" />
              <p className="font-display text-[18px] font-bold leading-tight">{s.petName} foi passear</p>
              <p className="text-[14px] text-muted">{tripLeft > 0 ? `Volta em ~${tripLeft} min` : 'Já voltou!'}</p>
            </div>
          ) : (
            <div ref={petRef} style={{ transformOrigin: '50% 100%' }}>
              <Pet color={s.petColor} stage={stage} mood={mood} hat={s.hat} acc={s.acc} size={170} label={s.petName} />
            </div>
          )}
        </Room>

        {!trip && (
          <div className="speech card px-4 py-3">
            <p className="text-[16px] font-semibold leading-snug">
              <span className="font-display font-bold text-accent">{s.petName}: </span>
              {line}
            </p>
          </div>
        )}

        <div className="card grid gap-3 p-4">
          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-[14px]">
              <span className="font-extrabold">Fase: {STAGES[stage].name}</span>
              <span className="tabular-nums text-muted">{next ? `${s.xp} / ${next.min} de carinho` : `${s.xp} de carinho`}</span>
            </div>
            <Bar value={next ? s.xp - STAGES[stage].min : 1} max={next ? next.min - STAGES[stage].min : 1} tone="leaf" label="Carinho até a próxima fase" />
          </div>

          {trip ? (
            tripLeft > 0 ? (
              <p className="text-[14px] text-muted">
                Indo para <strong className="text-ink">{tripPlace?.name}</strong>. Cada cuidado que você fizer agora traz {s.petName} 5 minutos mais cedo.
              </p>
            ) : (
              <button className="btn btn-primary" onClick={onFinishTrip}>
                <Mail size={18} /> Abrir o cartão-postal
              </button>
            )
          ) : (
            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[14px]">
                <span className="font-extrabold">Disposição pro passeio</span>
                <span className="tabular-nums text-muted">{s.disposicao}%</span>
              </div>
              <Bar value={s.disposicao} tone="gold" label="Disposição pro passeio" />
              {s.disposicao >= 100 && (
                <button className="btn btn-leaf mt-1" onClick={() => startTrip()}>
                  <Luggage size={18} /> Mandar {s.petName} passear pelo Brasil
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {!day.battery ? (
        <CheckIn />
      ) : (
        <section className="grid gap-3" aria-label="Cuidados de hoje">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[22px] font-bold leading-tight">Cuidados de hoje</h2>
              <p className="text-[14px] text-muted tabular-nums">
                {doneCount} de {tasks.length} feitos · sem pressa
              </p>
            </div>
            <BatteryPill battery={day.battery} />
          </div>

          {day.battery === 1 && (
            <p className="rounded-2xl bg-accent-soft px-4 py-3 text-[15px] font-semibold">
              Modo dia difícil ligado. Hoje a lista ficou menor de propósito. Fazer só uma coisa já vale.
            </p>
          )}

          <ul className="grid gap-2.5">
            {tasks.map((t) => {
              const done = day.done.includes(t.id);
              return (
                <li key={t.id} className="task" data-done={done}>
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => onToggle(t.id)}
                    aria-pressed={done}
                  >
                    <span className="task-check">
                      <Check size={18} strokeWidth={3} />
                    </span>
                    <span className="text-[22px] leading-none" aria-hidden="true">
                      {t.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="task-title block text-[16px] font-bold leading-snug">{t.title}</span>
                      <span className="flex items-center gap-1 text-[13px] font-bold text-muted">
                        <Seed size={12} /> {t.reward}
                        {t.kind === 'meta' && ' · todo dia'}
                        {t.kind === 'hoje' && ' · só hoje'}
                      </span>
                    </span>
                  </button>
                  {!done && t.kind === 'sugestao' && (
                    <button className="icon-btn shrink-0" onClick={() => swapSuggestion(t.id)} aria-label={`Trocar: ${t.title}`}>
                      <Shuffle size={17} />
                    </button>
                  )}
                  {t.kind !== 'sugestao' && (
                    <button className="icon-btn shrink-0" onClick={() => removeTask(t.id)} aria-label={`Remover: ${t.title}`}>
                      <Trash2 size={17} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <button className="btn btn-ghost" onClick={() => setAddOpen(true)}>
            <Plus size={18} /> Adicionar um cuidado meu
          </button>
          {day.battery !== 1 && (
            <button className="text-[14px] font-bold text-muted underline underline-offset-4" onClick={() => setBattery(1)}>
              O dia ficou pesado? Ligar o modo dia difícil
            </button>
          )}
        </section>
      )}

      <AddTaskSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <PostcardModal card={postcard} onClose={() => setPostcard(null)} />
      <EvolveModal stage={evolved} onClose={() => setEvolved(null)} />
    </div>
  );
}

function BatteryPill({ battery }: { battery: Battery }) {
  const Icon = BATTERY_ICON[battery];
  const info = BATTERIES[battery - 1];
  return (
    <button
      className="chip chip-leaf shrink-0"
      onClick={() => setBattery(((battery % 3) + 1) as Battery)}
      aria-label={`Bateria ${info.label}. Toque para mudar`}
    >
      <Icon size={16} aria-hidden="true" /> {info.label}
    </button>
  );
}

function CheckIn() {
  const s = useApp();
  const day = dayOf(s, todayKey());
  return (
    <section className="card grid gap-4 p-5" aria-label="Como você está">
      <div>
        <h2 className="font-display text-[22px] font-bold leading-tight">Como tá sua bateria hoje?</h2>
        <p className="text-[15px] text-muted">Eu monto os cuidados do dia do tamanho da sua energia.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BATTERIES.map((b) => {
          const Icon = BATTERY_ICON[b.value];
          return (
            <button key={b.value} className="checkin-opt" onClick={() => setBattery(b.value as Battery)}>
              <Icon size={28} aria-hidden="true" />
              <span className="font-display text-[18px] font-bold leading-none">{b.label}</span>
              <span className="text-[12px] font-semibold leading-tight text-muted">{b.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2">
        <p className="text-[14px] font-extrabold">E o coração? (opcional)</p>
        <div className="flex justify-between gap-1">
          {MOODS.map((m) => (
            <button
              key={m.value}
              className="mood-opt"
              aria-pressed={day.mood === m.value}
              aria-label={m.label}
              onClick={() => setMood(m.value as Mood)}
            >
              <span className="text-[28px] leading-none">{m.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(GOAL_EMOJIS[0]);
  const [everyDay, setEveryDay] = useState(true);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal(title, emoji, everyDay);
    toast(everyDay ? 'Cuidado fixo adicionado' : 'Adicionado só pra hoje');
    setTitle('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Um cuidado seu">
      <form className="grid gap-4 pt-1" onSubmit={save}>
        <label className="grid gap-1.5" htmlFor="goal-title">
          <span className="text-[14px] font-extrabold">O que você quer fazer?</span>
          <input
            id="goal-title"
            className="field"
            value={title}
            maxLength={60}
            placeholder="Ex.: estudar 20 minutos, passear com o cachorro"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="grid gap-1.5">
          <span className="text-[14px] font-extrabold">Ícone</span>
          <div className="grid grid-cols-6 gap-2">
            {GOAL_EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                className="mood-opt"
                aria-pressed={emoji === em}
                aria-label={`Ícone ${em}`}
                onClick={() => setEmoji(em)}
              >
                <span className="text-[24px] leading-none">{em}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="seg" role="group" aria-label="Frequência">
          <button type="button" aria-pressed={everyDay} onClick={() => setEveryDay(true)}>
            Todo dia
          </button>
          <button type="button" aria-pressed={!everyDay} onClick={() => setEveryDay(false)}>
            Só hoje
          </button>
        </div>
        <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
          Adicionar
        </button>
      </form>
    </Sheet>
  );
}
