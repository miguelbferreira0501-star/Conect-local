// Trilha "Hábito que fica" (21 dias) e Relatório da semana: o que o HamiCare+ entrega de resultado.
import { useState } from 'react';
import { Check, ChevronRight, Lock, TrendingDown, TrendingUp } from 'lucide-react';
import { Sheet, toast } from './ui';
import { Glyph } from './art';
import { burstConfetti } from '../lib/confetti';
import { openUi } from '../lib/bus';
import { MOODS } from '../data/lines';
import { isPremium, trailDo, trailNext, useApp, weekReport, TRAIL, TRAIL_FREE } from '../lib/store';
import { formatDay } from '../lib/util';

export function TrailCard() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const n = trailNext(s);
  const doneN = Object.keys(s.trail?.done ?? {}).length;
  const step = TRAIL[n.i];
  const kid = s.profile.ageGroup === 'ate12';
  if (n.state === 'fim' && s.trail && Object.values(s.trail.done).length >= TRAIL.length) {
    // depois de completar, some (fica a lembrança na Evolução)
    return null;
  }
  return (
    <>
      <button className={`trail-card ${n.state === 'pronto' ? 'is-ready' : ''}`} onClick={() => setOpen(true)}>
        <span className="trail-ico" aria-hidden="true">🌱</span>
        <span className="min-w-0 flex-1 text-left">
          <small>Trilha Hábito que fica · dia {Math.min(doneN + (n.state === 'amanha' ? 0 : 1), TRAIL.length)} de {TRAIL.length}</small>
          <b>{n.state === 'amanha' ? 'Passo de hoje feito! Volta amanhã' : n.state === 'plus' ? 'Continue a trilha com o HamiCare+' : step.title}</b>
          <span className="trail-bar" aria-hidden="true">
            <span style={{ width: `${(doneN / TRAIL.length) * 100}%` }} />
          </span>
        </span>
        {n.state === 'plus' ? <Lock size={20} /> : <ChevronRight size={22} />}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Hábito que fica">
        <div className="grid gap-3 pb-2 pt-1">
          <p className="text-[14px] text-muted">21 passos curtos, um por dia, para transformar uma missão em hábito. Os {TRAIL_FREE} primeiros são grátis.</p>
          {n.state !== 'fim' && n.state !== 'amanha' && (
            <div className="trail-step">
              <small>Dia {n.i + 1}</small>
              <b>{step.title}</b>
              {n.state === 'plus' ? (
                <>
                  <p className="trail-blur">{step.learn}</p>
                  {!kid && (
                    <button className="btn btn-primary" onClick={() => (setOpen(false), openUi('plus'))}>
                      <Lock size={16} /> Continuar com o HamiCare+
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p>{step.learn}</p>
                  <p className="trail-do">
                    <Glyph e="👉" size={18} /> {step.doIt}
                  </p>
                  <button
                    className="btn btn-primary"
                    data-sound="conquista"
                    onClick={(e) => {
                      if (trailDo()) {
                        burstConfetti(e.currentTarget);
                        toast('Passo feito! Amanhã tem mais.');
                      }
                    }}
                  >
                    <Check size={18} /> Fiz o passo de hoje
                  </button>
                </>
              )}
            </div>
          )}
          <ol className="trail-list">
            {TRAIL.map((t, i) => {
              const got = s.trail?.done?.[i];
              return (
                <li key={i} className={got ? 'is-got' : i >= TRAIL_FREE && !isPremium(s) ? 'is-lock' : ''}>
                  <span>{got ? '✓' : i + 1}</span> {t.title}
                </li>
              );
            })}
          </ol>
        </div>
      </Sheet>
    </>
  );
}

const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

function Delta({ now, prev, unit = '' }: { now: number; prev: number; unit?: string }) {
  const d = pct(now, prev);
  if (!prev && !now) return null;
  return (
    <span className={`wr-delta ${d >= 0 ? 'is-up' : 'is-down'}`}>
      {d >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {d >= 0 ? '+' : ''}
      {d}%{unit}
    </span>
  );
}

export function WeekReportCard() {
  const s = useApp();
  const r = weekReport(s);
  const plus = isPremium(s);
  const kid = s.profile.ageGroup === 'ate12';
  const moodEmoji = r.mood ? MOODS[Math.max(0, Math.min(MOODS.length - 1, Math.round(r.mood) - 1))].emoji : null;
  const body = (
    <div className="wr-grid">
      <div>
        <b>{r.active}/7</b>
        <small>dias ativos</small>
        <Delta now={r.active} prev={r.activePrev} />
      </div>
      <div>
        <b>{r.missions}</b>
        <small>missões</small>
        <Delta now={r.missions} prev={r.missionsPrev} />
      </div>
      <div>
        <b>{r.waterL} L</b>
        <small>de água</small>
      </div>
      <div>
        <b>{moodEmoji ? <Glyph e={moodEmoji} size={26} /> : '—'}</b>
        <small>humor médio</small>
        {r.mood && r.moodPrev ? <Delta now={r.mood} prev={r.moodPrev} /> : null}
      </div>
    </div>
  );
  return (
    <section className="wr" aria-label="Relatório da semana">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1">
          <small className="wr-kicker">Relatório da semana · {formatDay(r.from, { day: 'numeric', month: 'short' })} a {formatDay(r.to, { day: 'numeric', month: 'short' })}</small>
          <b className="wr-title">{plus ? (r.best ? `Seu hábito mais firme: ${r.best}` : 'Sua semana em números') : 'Veja como seus hábitos estão mudando'}</b>
        </span>
        {!plus && <span className="wr-tag">Plus</span>}
      </div>
      {plus ? (
        body
      ) : (
        <div className="wr-locked">
          <div className="wr-blur" aria-hidden="true">{body}</div>
          {!kid && (
            <button className="wr-unlock" onClick={() => openUi('plus')}>
              <Lock size={15} /> Ver meu relatório com o Plus
            </button>
          )}
        </div>
      )}
      {plus && <p className="wr-note">{r.active >= r.activePrev ? 'Você apareceu mais (ou igual) do que na semana passada. É assim que hábito fica.' : 'Semana mais leve. Tudo bem: a próxima começa com a versão mínima.'}</p>}
    </section>
  );
}
