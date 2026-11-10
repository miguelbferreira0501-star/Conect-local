// "Quanto você melhorou": gráficos simples de missões e água, com as descobertas mais importantes
// borradas para quem não tem o HamiCare+ (tocar abre a tela do Plus).
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { LineChart } from './ui';
import { libById } from '../data/tasks';
import { isPremium, litersText, todayKey, useApp, waterGoalOf } from '../lib/store';
import { addDays, formatDay, WEEKDAYS } from '../lib/util';
import type { DayLog, State } from '../types';

const WEEKDAY_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const doneOf = (d?: DayLog) => (d ? Object.keys(d.done ?? {}).length : 0);

export function improvementData(s: State, today = todayKey()) {
  const day = (i: number) => addDays(today, i);
  const sum = (from: number, to: number, f: (d?: DayLog) => number) => {
    let n = 0;
    for (let i = from; i <= to; i++) n += f(s.days[day(i)]);
    return n;
  };
  const thisWeek = sum(-6, 0, doneOf);
  const lastWeek = sum(-13, -7, doneOf);
  const change = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek ? 100 : 0;
  const water7 = Array.from({ length: 7 }, (_, i) => ({ key: day(i - 6), cups: s.days[day(i - 6)]?.water ?? 0 }));
  const waterAvg = Math.round(water7.reduce((n, d) => n + d.cups, 0) / 7);
  const active30 = Array.from({ length: 30 }, (_, i) => doneOf(s.days[day(-i)]) > 0).filter(Boolean).length;
  // Descobertas (Plus)
  const byWeekday = Array(7).fill(0) as number[];
  const habit: Record<string, number> = {};
  const moodWith: number[] = [];
  const moodWithout: number[] = [];
  for (let i = 0; i < 60; i++) {
    const key = day(-i);
    const d = s.days[key];
    if (!d) continue;
    const n = doneOf(d);
    byWeekday[new Date(`${key}T12:00:00`).getDay()] += n;
    if (i < 30) for (const id of Object.keys(d.done ?? {})) habit[id] = (habit[id] ?? 0) + 1;
    if (d.mood) (n > 0 ? moodWith : moodWithout).push(d.mood);
  }
  const best = byWeekday.indexOf(Math.max(...byWeekday));
  const topId = Object.entries(habit).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topName = topId ? s.tasks.find((t) => t.id === topId)?.title ?? libById(topId)?.title ?? 'uma missão' : null;
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const moodGain = moodWith.length && moodWithout.length ? Math.round(((avg(moodWith) - avg(moodWithout)) / 4) * 100) : null;
  const perDay = thisWeek / 7;
  const daily30 = Array.from({ length: 30 }, (_, i) => ({ label: formatDay(day(i - 29), { day: 'numeric', month: 'short' }), value: doneOf(s.days[day(i - 29)]) }));
  return { thisWeek, lastWeek, change, water7, waterAvg, active30, best: byWeekday[best] ? WEEKDAY_FULL[best] : null, topName, topCount: topId ? habit[topId] : 0, moodGain, forecast: Math.round(perDay * 30), daily30 };
}

function Locked({ locked, onPlus, kids, children }: { locked: boolean; onPlus: () => void; kids: boolean; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="imp-locked">
      <div className="imp-blur" aria-hidden="true">
        {children}
      </div>
      <button className="imp-unlock" onClick={kids ? undefined : onPlus} disabled={kids}>
        <Lock size={15} /> {kids ? 'Exclusivo do HamiCare+' : 'Ver com o Plus'}
      </button>
    </div>
  );
}

export function ImprovementCard({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const d = improvementData(s);
  const plus = isPremium(s);
  const kids = s.profile.ageGroup === 'ate12';
  const goal = waterGoalOf(s);
  const maxCups = Math.max(goal, ...d.water7.map((w) => w.cups));
  return (
    <section className="card imp-card grid gap-4 p-4" aria-label="Quanto você melhorou">
      <div>
        <h2 className="font-display text-[20px] font-bold">Quanto você melhorou</h2>
        <p className="text-[13px] text-muted">Seus números dos últimos dias. Cada passinho conta.</p>
      </div>

      <div className="imp-stats">
        <div className="imp-stat">
          <b className={d.change >= 0 ? 'is-up' : 'is-down'}>
            {d.change > 0 ? '+' : ''}
            {d.change}%
          </b>
          <small>missões vs. semana passada</small>
        </div>
        <div className="imp-stat">
          <b>{d.thisWeek}</b>
          <small>missões nos últimos 7 dias</small>
        </div>
        <div className="imp-stat">
          <b>{d.active30}</b>
          <small>dias ativos no mês</small>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="section-label">Água nos últimos 7 dias · média {litersText(d.waterAvg)} por dia · meta {litersText(goal)}</p>
        <div className="imp-bars" role="img" aria-label={`Litros de água por dia: ${d.water7.map((w) => litersText(w.cups)).join(', ')}`}>
          <span className="imp-goal" style={{ bottom: `calc(18px + (100% - 18px) * ${goal / maxCups})` }} />
          {d.water7.map((w) => (
            <div key={w.key} className="imp-bar-col">
              <span className={`imp-bar ${w.cups >= goal ? 'is-hit' : ''}`} style={{ height: `${Math.max(4, (w.cups / maxCups) * 100)}%` }} />
              <small>{WEEKDAYS[new Date(`${w.key}T12:00:00`).getDay()]}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="section-label">Missões por dia (30 dias)</p>
        <Locked locked={!plus} onPlus={onPlus} kids={kids}>
          <LineChart points={d.daily30} label="Missões por dia" min={0} tone="#7cc39a" />
        </Locked>
      </div>

      <div className="grid gap-2">
        <p className="section-label">Descobertas sobre você</p>
        <Locked locked={!plus} onPlus={onPlus} kids={kids}>
          <ul className="imp-insights">
            <li>
              <span className="imp-ins-ico">📅</span>
              <span className="imp-ins-txt">Seu melhor dia é <b>{d.best ?? 'quarta'}</b>: é quando você mais cumpre missões.</span>
            </li>
            <li>
              <span className="imp-ins-ico">⭐</span>
              <span className="imp-ins-txt">Hábito mais firme: <b>{d.topName ?? 'beber água'}</b> ({d.topCount || 12} vezes no mês).</span>
            </li>
            <li>
              <span className="imp-ins-ico">😊</span>
              <span className="imp-ins-txt">{d.moodGain !== null ? <>Nos dias com missões seu humor fica <b>{d.moodGain >= 0 ? `${d.moodGain}% melhor` : `${Math.abs(d.moodGain)}% mais baixo`}</b>.</> : <>Nos dias com missões seu humor fica <b>18% melhor</b>.</>}</span>
            </li>
            <li>
              <span className="imp-ins-ico">🔮</span>
              <span className="imp-ins-txt">No seu ritmo, em 30 dias serão <b>{d.forecast || 45} missões</b> a mais.</span>
            </li>
          </ul>
        </Locked>
      </div>
    </section>
  );
}
