import { useState } from 'react';
import { BatteryFull, BatteryLow, BatteryMedium, Check, Flame, Pencil, Plus, Trash2 } from 'lucide-react';
import { Bar, Seed, Seg, Sheet, toast } from '../components/ui';
import { CAT_ORDER, CATEGORIES, LIBRARY, TASK_EMOJIS } from '../data/tasks';
import { BATTERIES } from '../data/lines';
import { activeQuests, claimKey, questProgress, type Period } from '../logic/progress';
import { REST_PER_WEEK, streakOf } from '../logic/streak';
import { addLibraryTask, addTask, claimQuest, dayOf, deleteTask, setBattery, setRest, todayKey, todayTasks, toggleTask, updateTask, useApp, type TaskInput } from '../lib/store';
import { WEEKDAYS } from '../lib/util';
import type { Battery, Category, Freq, Task } from '../types';

const BATTERY_ICON = { 1: BatteryLow, 2: BatteryMedium, 3: BatteryFull } as const;
const PERIOD_LABEL: Record<Period, string> = { dia: 'Diários', semana: 'Da semana', mes: 'Do mês' };

export function Activities({ onShareTask }: { onShareTask: (task: Task) => void }) {
  const s = useApp();
  const today = todayKey();
  const day = dayOf(s, today);
  const tasks = todayTasks(s, today);
  const done = tasks.filter((t) => t.id in day.done).length;
  const streak = streakOf(s.days, today, s.createdAt);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [justDone, setJustDone] = useState<Task | null>(null);
  const quests = activeQuests(s.seed, today);

  function onToggle(t: Task) {
    const r = toggleTask(t.id);
    if (r) {
      toast(`+${r.reward} sementes · o ${s.pet.name} ficou feliz!`);
      setJustDone(t);
    }
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            {done} de {tasks.length} hoje · sem pressa
          </p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Atividades</h1>
        </div>
        <span className={`chip ${streak.today ? 'chip-accent' : 'chip-plain'}`}>
          <Flame size={16} className={streak.today ? 'text-accent' : 'text-muted'} /> {streak.count} {streak.count === 1 ? 'dia' : 'dias'}
        </span>
      </header>

      <section className="card grid gap-3 p-4" aria-label="Como está sua bateria">
        <p className="text-[15px] font-extrabold">Como tá sua bateria hoje?</p>
        <div className="grid grid-cols-3 gap-2">
          {BATTERIES.map((b) => {
            const Icon = BATTERY_ICON[b.value];
            return (
              <button key={b.value} className="opt !min-h-0 flex-col !items-center !gap-1 !px-2 !py-2 text-center" aria-pressed={day.battery === b.value} onClick={() => setBattery(b.value as Battery)}>
                <Icon size={24} aria-hidden="true" />
                <span className="text-[15px] leading-none">{b.label}</span>
                <span className="text-[11px] font-semibold text-muted">{b.hint}</span>
              </button>
            );
          })}
        </div>
        {day.battery === 1 && <p className="rounded-2xl bg-accent-soft px-3 py-2 text-[14px] font-semibold">Modo dia difícil: só ficaram as atividades leves. Fazer uma já vale.</p>}
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[14px] text-muted">
            🔥 Ofensiva protegida: até {REST_PER_WEEK} dias de descanso por semana não quebram a sequência. Restam <b className="text-ink">{streak.restLeft}</b> nesta semana.
          </p>
          <button className={`btn btn-sm shrink-0 ${day.rest ? 'btn-soft' : 'btn-ghost'}`} onClick={() => setRest(!day.rest)} aria-pressed={!!day.rest}>
            {day.rest ? '💤 Descansando' : 'Descansar hoje'}
          </button>
        </div>
      </section>

      <section className="grid gap-3" aria-label="Atividades de hoje">
        {CAT_ORDER.map((cat) => {
          const list = tasks.filter((t) => t.cat === cat);
          if (!list.length) return null;
          return (
            <div key={cat} className="grid gap-2">
              <h2 className="flex items-center gap-2 font-display text-[19px] font-bold">
                <span aria-hidden="true">{CATEGORIES[cat].emoji}</span> {CATEGORIES[cat].label}
              </h2>
              <ul className="grid gap-2">
                {list.map((t) => {
                  const isDone = t.id in day.done;
                  return (
                    <li key={t.id} className="task" data-done={isDone}>
                      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onToggle(t)} aria-pressed={isDone}>
                        <span className="task-check">
                          <Check size={18} strokeWidth={3} />
                        </span>
                        <span className="text-[22px] leading-none" aria-hidden="true">
                          {t.emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="task-title block text-[16px] font-bold leading-snug">{t.title}</span>
                          <span className="flex items-center gap-1 text-[12px] font-bold text-muted">
                            <Seed size={11} /> {t.reward} · {freqLabel(t.freq)}
                          </span>
                        </span>
                      </button>
                      <button className="icon-btn" onClick={() => setEditing(t)} aria-label={`Editar: ${t.title}`}>
                        <Pencil size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {!tasks.length && <p className="rounded-2xl border-2 border-dashed border-line p-5 text-center text-muted">Nenhuma atividade para hoje. Que tal adicionar uma bem pequena?</p>}
        <button className="btn btn-ghost" onClick={() => setEditing('new')}>
          <Plus size={18} /> Nova atividade
        </button>
      </section>

      <section className="grid gap-3" aria-label="Desafios">
        <h2 className="font-display text-[22px] font-bold">Desafios</h2>
        {(['dia', 'semana', 'mes'] as Period[]).map((period) => (
          <div key={period} className="card grid gap-3 p-4">
            <p className="eyebrow">{PERIOD_LABEL[period]}</p>
            {quests
              .filter((q) => q.period === period)
              .map((q) => {
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
                      <span className="chip chip-leaf">Feito ✓</span>
                    ) : (
                      <button className="btn btn-soft btn-sm" disabled={p < q.target} onClick={() => claimQuest(q.id) && toast(`+${q.coins} sementes e +${q.xp} XP!`)}>
                        +{q.coins} 🌻
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
        <p className="text-[13px] text-muted">Constância vale mais que intensidade: os desafios contam dias, não quantidade.</p>
      </section>

      <TaskSheet task={editing} onClose={() => setEditing(null)} />
      <Sheet open={!!justDone} onClose={() => setJustDone(null)} title="Mandou bem!">
        {justDone && (
          <div className="grid gap-3 pt-1">
            <p className="text-[16px]">
              Você concluiu <b>{justDone.title}</b>. Quer mostrar pros amigos? Dá pra tirar uma foto e compartilhar no feed (só aparecem comentários gentis).
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                onShareTask(justDone);
                setJustDone(null);
              }}
            >
              📸 Compartilhar com amigos
            </button>
            <button className="btn btn-ghost" onClick={() => setJustDone(null)}>
              Agora não
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function freqLabel(f: Freq): string {
  if (f.kind === 'diaria') return 'todo dia';
  if (f.kind === 'hoje') return 'só hoje';
  return f.days.map((d) => WEEKDAYS[d]).join(', ');
}

function TaskSheet({ task, onClose }: { task: Task | 'new' | null; onClose: () => void }) {
  const isNew = task === 'new';
  const t = task && task !== 'new' ? task : null;
  const [tab, setTab] = useState<'biblioteca' | 'minha'>('biblioteca');
  const [form, setForm] = useState<TaskInput | null>(null);
  const s = useApp();
  const current: TaskInput = form ?? (t ? { title: t.title, emoji: t.emoji, cat: t.cat, freq: t.freq, energy: t.energy } : { title: '', emoji: '⭐', cat: 'autocuidado', freq: { kind: 'diaria' }, energy: 2 });
  const up = (p: Partial<TaskInput>) => setForm({ ...current, ...p });
  const close = () => {
    setForm(null);
    setTab('biblioteca');
    onClose();
  };
  const freqKind = current.freq.kind;
  const days = current.freq.kind === 'dias' ? current.freq.days : [];

  return (
    <Sheet open={!!task} onClose={close} title={isNew ? 'Nova atividade' : 'Editar atividade'}>
      <div className="grid gap-4 pt-1">
        {isNew && <Seg value={tab} onChange={setTab} label="Origem" options={[{ id: 'biblioteca', label: 'Sugestões' }, { id: 'minha', label: 'Criar a minha' }]} />}
        {isNew && tab === 'biblioteca' ? (
          <div className="grid gap-3">
            {CAT_ORDER.map((cat) => (
              <div key={cat} className="grid gap-1.5">
                <p className="text-[14px] font-extrabold">
                  {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {LIBRARY.filter((l) => l.cat === cat).map((l) => {
                    const has = s.tasks.some((x) => x.id === l.id);
                    return (
                      <button key={l.id} className={`chip ${has ? 'chip-leaf' : 'chip-plain'}`} disabled={has} onClick={() => (addLibraryTask(l.id), toast(`${l.title}: adicionada`))}>
                        {l.emoji} {l.title} {has && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!current.title.trim()) return;
              if (t) updateTask(t.id, current);
              else addTask(current);
              toast(t ? 'Atividade atualizada' : 'Atividade criada');
              close();
            }}
          >
            <label className="grid gap-1" htmlFor="task-title">
              <span className="text-[14px] font-extrabold">Nome</span>
              <input id="task-title" className="field" maxLength={60} placeholder="Ex.: estudar 20 minutos" value={current.title} onChange={(e) => up({ title: e.target.value })} />
            </label>
            <div className="grid gap-1">
              <span className="text-[14px] font-extrabold">Ícone</span>
              <div className="grid grid-cols-8 gap-1.5">
                {TASK_EMOJIS.map((em) => (
                  <button type="button" key={em} className="mood-opt !min-h-[40px] !min-w-0" aria-pressed={current.emoji === em} aria-label={`Ícone ${em}`} onClick={() => up({ emoji: em })}>
                    <span className="text-[20px]">{em}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-[14px] font-extrabold">Categoria</span>
              <div className="grid grid-cols-2 gap-2">
                {CAT_ORDER.map((c: Category) => (
                  <button type="button" key={c} className="opt !min-h-[44px] !px-3 !py-2 text-[14px]" aria-pressed={current.cat === c} onClick={() => up({ cat: c })}>
                    {CATEGORIES[c].emoji} {CATEGORIES[c].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-[14px] font-extrabold">Quando</span>
              <Seg
                value={freqKind}
                label="Frequência"
                onChange={(k) => up({ freq: k === 'diaria' ? { kind: 'diaria' } : k === 'hoje' ? { kind: 'hoje', date: todayKey() } : { kind: 'dias', days: [1, 3, 5] } })}
                options={[{ id: 'diaria', label: 'Todo dia' }, { id: 'dias', label: 'Alguns dias' }, { id: 'hoje', label: 'Só hoje' }]}
              />
              {freqKind === 'dias' && (
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((w, i) => (
                    <button type="button" key={w} className="mood-opt !min-h-[40px] !min-w-0 text-[12px] font-extrabold uppercase" aria-pressed={days.includes(i)} onClick={() => up({ freq: { kind: 'dias', days: days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort() } })}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-1">
              <span className="text-[14px] font-extrabold">Esforço</span>
              <Seg value={String(current.energy) as '1' | '2' | '3'} label="Esforço" onChange={(v) => up({ energy: Number(v) as 1 | 2 | 3 })} options={[{ id: '1', label: 'Leve' }, { id: '2', label: 'Médio' }, { id: '3', label: 'Puxado' }]} />
              <p className="text-[12px] text-muted">Atividades leves continuam aparecendo no modo dia difícil.</p>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!current.title.trim() || (freqKind === 'dias' && !days.length)}>
              {t ? 'Salvar' : 'Criar atividade'}
            </button>
            {t && (
              <button
                type="button"
                className="btn btn-ghost text-danger"
                onClick={() => {
                  deleteTask(t.id);
                  toast('Atividade excluída');
                  close();
                }}
              >
                <Trash2 size={18} /> Excluir atividade
              </button>
            )}
          </form>
        )}
      </div>
    </Sheet>
  );
}
