import { useState } from 'react';
import { BatteryFull, BatteryLow, BatteryMedium, Flame, Plus, Trash2 } from 'lucide-react';
import { Seg, Sheet, toast } from '../components/ui';
import { KcalChip, useKcalPop } from '../components/Journey';
import { TaskRow } from '../components/TaskRow';
import { SeasonBanner } from '../components/Season';
import { EventsBanner } from './Events';
import { QuestList } from '../components/QuestList';
import { CAT_ORDER, CATEGORIES, LIBRARY, TASK_EMOJIS } from '../data/tasks';
import { BATTERIES, JOURNEY_TEXT } from '../data/lines';
import { dayKcal, taskKcal } from '../logic/evolution';
import { activeQuests, type Period } from '../logic/progress';
import { REST_PER_WEEK, streakOf } from '../logic/streak';
import { addLibraryTask, addTask, dayOf, deleteTask, kcalOf, minor, personKg, setBattery, setRest, todayKey, todayTasks, toggleTask, updateTask, useApp, type TaskInput } from '../lib/store';
import { fmtNum } from '../lib/util';
import { WEEKDAYS } from '../lib/util';
import type { Battery, Category, Freq, Task } from '../types';
import { Glyph } from '../components/art';

const BATTERY_ICON = { 1: BatteryLow, 2: BatteryMedium, 3: BatteryFull } as const;
const PERIOD_LABEL: Record<Period, string> = { dia: 'de hoje', semana: 'da semana', mes: 'do mês' };

export function Activities({ onShareTask }: { onShareTask: (task: Task) => void }) {
  const s = useApp();
  const today = todayKey();
  const day = dayOf(s, today);
  const tasks = todayTasks(s, today);
  const done = tasks.filter((t) => t.id in day.done).length;
  const streak = streakOf(s.days, today, s.createdAt);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [justDone, setJustDone] = useState<{ task: Task; kcal: number } | null>(null);
  const quests = activeQuests(s.seed, today);
  const dir = s.journey.dir;
  const jt = JOURNEY_TEXT[dir];
  const { pop, layer } = useKcalPop();
  const showKcal = !minor(s) && !s.body.hideNumbers;
  const todayK = dayKcal(day, dir, s.mealRef ?? null);

  function onToggle(t: Task, el: HTMLElement) {
    const r = toggleTask(t.id);
    if (!r) return;
    const gain = dir === 'ganhar';
    if (r.kcal > 0 && dir !== 'manter') pop(el, `${gain ? '+' : '−'}${r.kcal} kcal`, gain);
    else pop(el, `+${r.reward} sementes`);
    // A ofensiva tem a própria comemoração; nos outros casos, oferece compartilhar.
    if (!r.streak) setTimeout(() => setJustDone({ task: t, kcal: r.kcal }), 650);
  }

  return (
    <div className="grid gap-4">
      {layer}
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            {done} de {tasks.length} hoje · sem pressa
          </p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Missões</h1>
        </div>
        <span className={`chip ${streak.today ? 'chip-accent' : 'chip-plain'}`}>
          <Flame size={16} className={streak.today ? 'text-accent' : 'text-muted'} /> {streak.count} {streak.count === 1 ? 'dia' : 'dias'}
        </span>
      </header>

      {showKcal && dir !== 'manter' && (
        <div className={`journey journey-${dir} !gap-1 !py-3`}>
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide opacity-90">
            <Glyph e={jt.emoji} size={20} /> {jt.title}
          </p>
          <p className="font-display text-[22px] font-bold leading-tight">
            Hoje: {jt.sign}
            {fmtNum(todayK, 0)} kcal para você e o {s.pet.name}
          </p>
          <p className="text-[12.5px] font-bold opacity-85">
            {dir === 'perder' ? 'Cada missão concluída tira as mesmas calorias de vocês dois.' : `O ${s.pet.name} cresce com o que você come acima da referência no Cardápio do Início. As missões são hábitos que ajudam.`}
          </p>
        </div>
      )}

      <SeasonBanner s={s} />

      <EventsBanner />

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
            <Glyph e="🔥" size={18} className="gi" /> Ofensiva protegida: até {REST_PER_WEEK} dias de descanso por semana não quebram a sequência. Restam <b className="text-ink">{streak.restLeft}</b> nesta semana.
          </p>
          <button className={`btn btn-sm shrink-0 ${day.rest ? 'btn-soft' : 'btn-ghost'}`} onClick={() => setRest(!day.rest)} aria-pressed={!!day.rest}>
            {day.rest ? (
              <>
                <Glyph e="💤" size={18} /> Descansando
              </>
            ) : (
              'Descansar hoje'
            )}
          </button>
        </div>
      </section>

      <section className="grid gap-3" aria-label="Atividades de hoje">
        {CAT_ORDER.map((cat) => {
          const list = tasks.filter((t) => t.cat === cat);
          if (!list.length) return null;
          return (
            <div key={cat} className="grid gap-2">
              <h2 className="section-label flex items-center gap-2 px-1">
                <Glyph e={CATEGORIES[cat].emoji} size={24} /> {CATEGORIES[cat].label}
              </h2>
              <ul className="grid gap-3">
                {list.map((t) => (
                  <TaskRow key={t.id} task={t} done={t.id in day.done} kcal={showKcal ? kcalOf(s, t) : 0} dir={dir} sub={freqLabel(t.freq)} onToggle={(el) => onToggle(t, el)} onEdit={() => setEditing(t)} />
                ))}
              </ul>
            </div>
          );
        })}
        {!tasks.length && <p className="rounded-2xl border-2 border-dashed border-line p-5 text-center text-muted">Nenhuma atividade para hoje. Que tal adicionar uma bem pequena?</p>}
        <button className="btn-page" onClick={() => setEditing('new')} aria-label="Nova atividade">
          <span className="btn-page-ico" aria-hidden="true">
            <Plus size={26} strokeWidth={3} />
          </span>
          Adicionar uma missão
        </button>
      </section>

      <section className="grid gap-4" aria-label="Desafios">
        {(['dia', 'semana', 'mes'] as Period[]).map((period) => (
          <div key={period} className="grid gap-3">
            <h2 className="section-label px-1">Desafios {PERIOD_LABEL[period]}</h2>
            <QuestList quests={quests.filter((q) => q.period === period)} s={s} today={today} />
          </div>
        ))}
        <p className="px-1 text-[13px] text-muted">Constância vale mais que intensidade: os desafios contam dias, não quantidade.</p>
      </section>

      <TaskSheet task={editing} onClose={() => setEditing(null)} />
      <Sheet open={!!justDone} onClose={() => setJustDone(null)} title="Mandou bem!">
        {justDone && (
          <div className="grid gap-3 pt-1">
            {showKcal && justDone.kcal > 0 && dir !== 'manter' && (
              <p className="rounded-2xl bg-accent-soft p-3 text-[16px] font-bold">
                <Glyph e={jt.emoji} size={22} className="gi" /> Você e o {s.pet.name} {jt.verb} {fmtNum(justDone.kcal, 0)} kcal juntos!
              </p>
            )}
            <p className="text-[16px]">
              Você concluiu <b>{justDone.task.title}</b>. Quer mostrar pros amigos? Dá pra tirar uma foto e compartilhar no feed (só aparecem comentários gentis).
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                onShareTask(justDone.task);
                setJustDone(null);
              }}
            >
              <Glyph e="📸" size={22} /> Compartilhar com amigos
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
      <div className="grid min-w-0 gap-4 pt-1">
        {isNew && <Seg value={tab} onChange={setTab} label="Origem" options={[{ id: 'biblioteca', label: 'Sugestões' }, { id: 'minha', label: 'Criar a minha' }]} />}
        {isNew && tab === 'biblioteca' ? (
          <div className="grid gap-3">
            {s.journey.dir !== 'manter' && !minor(s) && (
              <div className="grid gap-1.5 rounded-2xl bg-accent-soft p-3">
                <p className="flex items-center gap-1.5 text-[14px] font-extrabold">
                  <Glyph e={JOURNEY_TEXT[s.journey.dir].emoji} size={20} /> Para a sua jornada
                </p>
                <div className="grid gap-1.5">
                  {LIBRARY.filter((l) => l.for?.includes(s.journey.dir as 'perder' | 'ganhar')).map((l) => {
                    const has = s.tasks.some((x) => x.id === l.id);
                    return (
                      <button key={l.id} className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-left text-[14px] font-bold disabled:opacity-60" disabled={has} onClick={() => (addLibraryTask(l.id), toast(`${l.title}: adicionada`))}>
                        <Glyph e={l.emoji} size={30} />
                        <span className="min-w-0 flex-1">
                          <span className="block leading-tight">{l.title}</span>
                          {l.why && <span className="block text-[12px] font-semibold text-muted">{l.why}</span>}
                        </span>
                        {has ? '✓' : <KcalChip kcal={taskKcal(l, s.journey.dir, personKg(s))} dir={s.journey.dir} small />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {CAT_ORDER.map((cat) => (
              <div key={cat} className="grid gap-1.5">
                <p className="flex items-center gap-1.5 text-[14px] font-extrabold">
                  <Glyph e={CATEGORIES[cat].emoji} size={20} /> {CATEGORIES[cat].label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {LIBRARY.filter((l) => l.cat === cat).map((l) => {
                    const has = s.tasks.some((x) => x.id === l.id);
                    return (
                      <button key={l.id} className={`chip !whitespace-normal text-left ${has ? 'chip-leaf' : 'chip-plain'}`} disabled={has} onClick={() => (addLibraryTask(l.id), toast(`${l.title}: adicionada`))}>
                        <Glyph e={l.emoji} size={20} /> {l.title} {has && '✓'}
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
                    <Glyph e={em} size={28} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-[14px] font-extrabold">Categoria</span>
              <div className="grid grid-cols-2 gap-2">
                {CAT_ORDER.map((c: Category) => (
                  <button type="button" key={c} className="opt !min-h-[44px] !px-3 !py-2 text-[14px]" aria-pressed={current.cat === c} onClick={() => up({ cat: c })}>
                    <Glyph e={CATEGORIES[c].emoji} size={20} /> {CATEGORIES[c].label}
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
