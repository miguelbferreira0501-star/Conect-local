// Calendário de tarefas: semana (ou mês) no topo, as tarefas do dia escolhido por parte do dia,
// e criar, editar ou excluir tarefas com dias da semana, datas, horário e lembrete.
// Dias futuros mostram o que está programado (sem cobrança); só o dia de hoje marca como feito.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Glyph } from './art';
import { toast } from './ui';
import { TaskSheet, freqLabel } from '../screens/Activities';
import { LIFE_AREAS, LIFE_ORDER } from '../data/tasks';
import { addLifeArea, dayOf, tasksOn, todayKey, toggleTask, useApp } from '../lib/store';
import { addDays, formatDay, weekStart } from '../lib/util';
import { play } from '../lib/sound';
import type { DayPart, Task } from '../types';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const PARTS: [DayPart | 'qualquer', string][] = [
  ['manha', 'Manhã'],
  ['tarde', 'Tarde'],
  ['noite', 'Noite'],
  ['qualquer', 'Qualquer hora'],
];
const keyOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Agrupa as tarefas pela parte do dia (as com horário vão em ordem de horário). */
export function byPart(tasks: Task[]): [DayPart | 'qualquer', string, Task[]][] {
  return PARTS.map(([id, label]) => [id, label, tasks.filter((t) => (t.part ?? 'qualquer') === id).sort((a, b) => (a.at ?? '99').localeCompare(b.at ?? '99'))] as [DayPart | 'qualquer', string, Task[]]).filter(
    ([, , l]) => l.length,
  );
}

export function TaskCalendar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const today = todayKey();
  const [sel, setSel] = useState(today);
  const [month, setMonth] = useState(false);
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const [edit, setEdit] = useState<Task | 'new' | null>(null);
  if (!open) return null;
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(sel), i));
  const list = tasksOn(s, sel);
  const day = dayOf(s, sel);
  const doneN = list.filter((t) => t.id in day.done).length;
  const future = sel > today;
  const past = sel < today;
  const [cy, cm] = cursor.split('-').map(Number);
  const first = new Date(cy, cm - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysIn = new Date(cy, cm, 0).getDate();
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysIn }, (_, i) => keyOf(cy, cm - 1, i + 1))];
  const dot = (k: string) => {
    const l = tasksOn(s, k);
    if (!l.length) return '';
    const d = dayOf(s, k);
    return l.every((t) => t.id in d.done) ? 'is-all' : 'is-some';
  };
  const shiftMonth = (n: number) => {
    const d = new Date(cy, cm - 1 + n, 1);
    setCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const missing = LIFE_ORDER.filter((a) => !(s.profile.lifeAreas ?? []).includes(a));

  return createPortal(
    <div className="tcal" role="dialog" aria-modal="true" aria-label="Calendário de tarefas">
      <header className="tcal-head">
        <div className="tcal-bar">
          <button className="tcal-ico" onClick={onClose} aria-label="Fechar calendário">
            <X size={22} />
          </button>
          <button className="tcal-title" onClick={() => (setMonth(!month), setCursor(sel.slice(0, 7)))} aria-expanded={month}>
            {sel === today ? 'Hoje' : formatDay(sel, { weekday: 'short' })} · {formatDay(sel, { day: 'numeric', month: 'short' })} <ChevronDown size={18} style={{ transform: month ? 'rotate(180deg)' : undefined }} />
          </button>
          <span className="tcal-ico" aria-hidden="true" />
        </div>
        {month ? (
          <div className="tcal-month">
            <div className="tcal-mnav">
              <button onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                <ChevronLeft size={20} />
              </button>
              <b>{formatDay(`${cursor}-01`, { month: 'long', year: 'numeric' })}</b>
              <button onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="tcal-grid">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => (
                <small key={i}>{l}</small>
              ))}
              {cells.map((k, i) =>
                k ? (
                  <button key={k} className={`tcal-cell ${k === sel ? 'is-sel' : ''} ${k === today ? 'is-today' : ''} ${dot(k)}`} onClick={() => (setSel(k), setMonth(false))}>
                    {Number(k.slice(8))}
                  </button>
                ) : (
                  <span key={`v${i}`} />
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="tcal-week">
            <button className="tcal-wnav" onClick={() => setSel(addDays(sel, -7))} aria-label="Semana anterior">
              <ChevronLeft size={18} />
            </button>
            {week.map((k) => {
              const d = new Date(`${k}T12:00:00`);
              return (
                <button key={k} className={`tcal-day ${k === sel ? 'is-sel' : ''} ${k > today ? 'is-future' : ''} ${dot(k)}`} onClick={() => setSel(k)} aria-label={formatDay(k)} aria-pressed={k === sel}>
                  <small>{LETTERS[d.getDay()]}</small>
                  <b>{d.getDate()}</b>
                </button>
              );
            })}
            <button className="tcal-wnav" onClick={() => setSel(addDays(sel, 7))} aria-label="Próxima semana">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="tcal-body">
        <div className="tcal-sum">
          <span>
            <Glyph e="📅" size={24} /> <b>{list.length}</b> {list.length === 1 ? 'tarefa' : 'tarefas'}
            {!future && list.length > 0 && <small> · {doneN} feitas</small>}
            {future && list.length > 0 && <small> · programadas</small>}
          </span>
          <button className="tcal-add" onClick={() => setEdit('new')}>
            <Plus size={18} strokeWidth={3} /> Adicionar
          </button>
        </div>

        {!list.length && (
          <div className="tcal-empty">
            <Glyph e="🌱" size={48} />
            <p>{future ? 'Nada programado para este dia ainda.' : 'Sem tarefas neste dia.'}</p>
            <button className="tcal-add" onClick={() => setEdit('new')}>
              <Plus size={18} strokeWidth={3} /> Programar uma tarefa
            </button>
          </div>
        )}

        {byPart(list).map(([id, label, items]) => (
          <section key={id} className="tcal-part">
            <h3>{label}</h3>
            <ul>
              {items.map((t) => {
                const done = t.id in day.done;
                return (
                  <li key={t.id} className={`tcal-task ${done ? 'is-done' : ''}`}>
                    <button className="tcal-task-main" onClick={() => setEdit(t)} aria-label={`Editar ${t.title}`}>
                      <Glyph e={t.emoji} size={34} />
                      <span className="min-w-0 flex-1">
                        <b>{t.title}</b>
                        <small>
                          {t.at ? `${t.at} · ` : ''}
                          {freqLabel(t.freq)}
                          {t.remind ? ' · 🔔' : ''}
                        </small>
                      </span>
                    </button>
                    <button
                      className={`tcal-check ${done ? 'is-on' : ''}`}
                      disabled={sel !== today}
                      aria-label={done ? `Desmarcar ${t.title}` : `Concluir ${t.title}`}
                      title={future ? 'Programada' : past ? 'Dia que já passou' : undefined}
                      onClick={() => {
                        const r = toggleTask(t.id);
                        if (r && !done) {
                          play('pega', { step: 4 });
                          toast(`+${r.reward} sementes`);
                        }
                      }}
                    >
                      {done ? <Check size={20} strokeWidth={3.5} /> : future ? <span className="tcal-soon">⏳</span> : <Check size={20} strokeWidth={3.5} opacity={0.25} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {missing.length > 0 && (
          <section className="tcal-areas">
            <h3>Adicionar uma área</h3>
            <div>
              {missing.map((a) => (
                <button key={a} style={{ ['--tone' as string]: LIFE_AREAS[a].tone }} onClick={() => toast(`${LIFE_AREAS[a].label}: ${addLifeArea(a)} tarefas novas`)}>
                  <Glyph e={LIFE_AREAS[a].prop} size={22} /> {LIFE_AREAS[a].label}
                </button>
              ))}
            </div>
          </section>
        )}
        <p className="tcal-note">Tarefas futuras ficam só programadas: não contam como atrasadas e ninguém perde nada por um dia de pausa.</p>
      </div>
      <TaskSheet task={edit} date={sel} onClose={() => setEdit(null)} />
    </div>,
    document.body,
  );
}
