import { useState } from 'react';
import { Lock, Trash2, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Bar, LineChart, Modal, toast } from '../components/ui';
import { BAND, PHASES, PHASE_MIN, bandLabel, conditioning, rapidChange, recentAverageKg } from '../logic/evolution';
import { ACHIEVEMENTS, countIn } from '../logic/progress';
import { bestStreak, streakOf } from '../logic/streak';
import { deletePhoto, isPremium, logWeight, minor, setGoal, setSync, todayKey, useApp } from '../lib/store';
import { addDays, formatDay, fmtNum, weekStart } from '../lib/util';
import { GOALS } from '../data/lines';
import type { Photo } from '../types';

export function Evolution({ onClose, onShare }: { onClose: () => void; onShare: (p: Photo) => void }) {
  const s = useApp();
  const today = todayKey();
  const cond = conditioning(s.days, today);
  const isMinor = minor(s);
  const hideNums = isMinor || s.body.hideNumbers;
  const range = isPremium(s) ? 180 : 30;
  const [kg, setKg] = useState('');
  const [goalKg, setGoalKg] = useState(s.body.goalKg ? String(s.body.goalKg) : '');
  const [goalWeeks, setGoalWeeks] = useState(s.body.goalWeeks ? String(s.body.goalWeeks) : '12');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const streak = streakOf(s.days, today, s.createdAt);
  const best = bestStreak(s.days, today, s.createdAt);
  const totalDone = Object.values(s.days).reduce((n, d) => n + Object.keys(d.done).length, 0);
  const nextPhase = PHASE_MIN[s.pet.phase + 1];

  const petPoints = s.pet.weighIns.filter((w) => w.date >= addDays(today, -range)).map((w) => ({ label: formatDay(w.date, { day: 'numeric', month: 'short' }), value: w.grams }));
  const userLogs = s.body.logs.filter((l) => l.date >= addDays(today, -range));
  const userPoints = userLogs.map((l) => ({ label: formatDay(l.date, { day: 'numeric', month: 'short' }), value: l.kg }));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(weekStart(today), -7 * (7 - i));
    return { start, n: countIn(s.days, start, addDays(start, 6), (d) => Object.keys(d.done).length) };
  });
  const maxWeek = Math.max(1, ...weeks.map((w) => w.n));

  const timeline = [
    { date: s.createdAt, text: `A jornada com o ${s.pet.name} começou` },
    ...Object.entries(s.achievements).map(([id, date]) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      return { date, text: a ? `${a.emoji} ${a.title}` : id };
    }),
    ...s.pet.weighIns.slice(1).map((w) => ({ date: w.date, text: hideNums ? 'Pesagem semanal do Hami' : `Pesagem do Hami: ${fmtNum(w.grams)} g` })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label="Nossa evolução">
      <div className="mx-auto grid max-w-[480px] gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Você evolui, o {s.pet.name} evolui junto</p>
            <h1 className="font-display text-[28px] font-bold leading-tight">Nossa evolução</h1>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <section className="card grid gap-3 p-4" aria-label="Fases">
          <h2 className="font-display text-[20px] font-bold">Fases do {s.pet.name}</h2>
          <div className="grid grid-cols-4 gap-1">
            {PHASES.map((name, i) => (
              <div key={name} className={`grid justify-items-center gap-1 rounded-2xl p-1 ${i === s.pet.phase ? 'bg-accent-soft' : ''}`}>
                <div style={{ opacity: i <= s.pet.phase ? 1 : 0.28, filter: i <= s.pet.phase ? 'none' : 'grayscale(1)' }}>
                  <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={i} size={74} idle={false} label={`Fase ${name}`} />
                </div>
                <span className="text-center text-[10.5px] font-extrabold leading-tight [overflow-wrap:anywhere]">{name}</span>
                {i > s.pet.phase && <Lock size={12} className="text-muted" />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <span className="font-bold">Condicionamento</span>
            <div className="flex-1">
              <Bar value={cond} tone="leaf" label="Condicionamento" />
            </div>
            <span className="font-bold tabular-nums">{cond}/100</span>
          </div>
          <p className="text-[14px] text-muted">
            Vem dos seus últimos 28 dias de movimento. Um dia ativo vale mais que muitos treinos num dia só.
            {nextPhase !== undefined && ` A próxima fase chega com ${nextPhase} pontos.`} Fases conquistadas nunca se perdem, mesmo se você precisar descansar.
          </p>
        </section>

        <section className="card grid gap-3 p-4" aria-label="Peso virtual do Hami">
          <h2 className="font-display text-[20px] font-bold">{hideNums ? `Forma do ${s.pet.name}` : 'Peso virtual do Hami'}</h2>
          {isMinor ? (
            <p className="text-[15px] text-muted">Para menores de 18, o {s.pet.name} fica sempre em equilíbrio. A evolução dele vem dos hábitos e do movimento.</p>
          ) : hideNums ? (
            <p className="text-[15px]">
              {s.pet.name} está <b>{bandLabel(s.pet.grams).toLowerCase()}</b>. O modo sem números está ligado (Ajustes → Dados físicos).
            </p>
          ) : (
            <>
              <p className="text-[15px]">
                <b className="font-display text-[24px]">{fmtNum(s.pet.grams)} g</b> · {bandLabel(s.pet.grams)} (faixa saudável {BAND.min}–{BAND.max} g)
              </p>
              <LineChart points={petPoints} label="Peso virtual do Hami" unit=" g" band={[BAND.min, BAND.max]} tone="var(--gold)" />
              <p className="text-[13px] text-muted">
                A pesagem é semanal. {s.body.sync ? 'Sincronizado com você: o Hami acompanha a sua variação, no máximo 3 g por semana.' : 'Com 3 ou mais dias ativos na semana, o Hami anda até 3 g em direção à faixa saudável. Exercício nunca muda o peso de uma vez.'}
              </p>
            </>
          )}
        </section>

        {!isMinor && s.body.tracking && (
          <section className="card grid gap-3 p-4" aria-label="Sua evolução">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold">Sua evolução</h2>
              <span className="chip chip-plain">🔒 Só você vê</span>
            </div>
            {!hideNums && <LineChart points={userPoints} label="Seu peso" unit=" kg" tone="var(--accent)" />}
            {rapidChange(s.body.logs, today) && (
              <p className="rounded-2xl bg-gold-soft p-3 text-[14px]">Notamos uma mudança rápida nas últimas semanas. Mudanças rápidas merecem atenção: se quiser, converse com um profissional de saúde. Cuidar de você vem primeiro.</p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (logWeight(Number(kg.replace(',', '.')))) {
                  setKg('');
                  toast('Registro guardado');
                } else toast('Confira o valor digitado.');
              }}
            >
              <label className="sr-only" htmlFor="ev-kg">
                Peso de hoje em kg
              </label>
              <input id="ev-kg" className="field min-w-0 flex-1" inputMode="decimal" placeholder="Peso de hoje (kg)" value={kg} onChange={(e) => setKg(e.target.value)} />
              <button className="btn btn-primary shrink-0" type="submit" disabled={!kg}>
                Registrar
              </button>
            </form>
            {!hideNums && recentAverageKg(s.body.logs, today) && <p className="text-[13px] text-muted">Média dos últimos 14 dias: {fmtNum(recentAverageKg(s.body.logs, today)!)} kg.</p>}
            <label className="flex items-start gap-3 rounded-2xl bg-surface2 p-3 text-[14px]" htmlFor="ev-sync">
              <input id="ev-sync" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={s.body.sync} onChange={(e) => setSync(e.target.checked)} />
              <span>
                <b>Sincronizar o Hami comigo.</b> O peso virtual dele passa a acompanhar a sua variação (proporcional e devagar). Dá pra desligar quando quiser.
              </span>
            </label>
            {s.profile.goal === 'peso' && (
              <div className="grid gap-2 rounded-2xl bg-surface2 p-3">
                <p className="text-[14px] font-extrabold">Meta pessoal (opcional)</p>
                <div className="flex gap-2">
                  <input aria-label="Meta em kg" className="field min-w-0 flex-1" inputMode="decimal" placeholder="Meta (kg)" value={goalKg} onChange={(e) => setGoalKg(e.target.value)} />
                  <input aria-label="Prazo em semanas" className="field w-28" inputMode="numeric" placeholder="Semanas" value={goalWeeks} onChange={(e) => setGoalWeeks(e.target.value)} />
                </div>
                <button
                  className="btn btn-soft btn-sm"
                  onClick={() => {
                    const r = setGoal(goalKg ? Number(goalKg.replace(',', '.')) : null, Number(goalWeeks) || null);
                    toast(r.ok ? 'Meta salva' : r.reason);
                  }}
                >
                  Salvar meta
                </button>
                <p className="text-[12px] text-muted">Metas precisam de 4 semanas ou mais e no máximo 1% do peso por semana. O HamiCare não faz recomendação médica.</p>
              </div>
            )}
          </section>
        )}

        <section className="card grid gap-3 p-4" aria-label="Atividades">
          <h2 className="font-display text-[20px] font-bold">Atividades</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={totalDone} label="concluídas" />
            <Stat value={streak.count} label="dias de ofensiva" />
            <Stat value={best} label="maior ofensiva" />
          </div>
          <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Atividades por semana nas últimas 8 semanas">
            {weeks.map((w) => (
              <div key={w.start} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(4, (w.n / maxWeek) * 76)}px`, opacity: w.n ? 1 : 0.25 }} />
                <span className="text-[10px] tabular-nums text-muted">{w.n}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-muted">Últimas 8 semanas. Objetivo da jornada: {GOALS[s.profile.goal].label}.</p>
        </section>

        <section className="card grid gap-3 p-4" aria-label="Conquistas">
          <h2 className="font-display text-[20px] font-bold">
            Conquistas <span className="text-muted">{Object.keys(s.achievements).length}/{ACHIEVEMENTS.length}</span>
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = !!s.achievements[a.id];
              return (
                <div key={a.id} className="grid justify-items-center gap-1 text-center" title={a.desc}>
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-[24px] ${got ? 'bg-gold-soft' : 'bg-surface2 grayscale opacity-40'}`}>{a.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight">{a.title}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card grid gap-3 p-4" aria-label="Fotos virtuais">
          <h2 className="font-display text-[20px] font-bold">Fotos do {s.pet.name}</h2>
          {s.photos.length ? (
            <div className="grid grid-cols-3 gap-2">
              {s.photos.map((p) => (
                <button key={p.id} className="tile !p-1" onClick={() => setPhoto(p)}>
                  <Hamster fur={p.snap.fur} grams={p.snap.grams} phase={p.snap.phase} outfit={p.snap.outfit} mood={p.snap.mood} size={84} idle={false} />
                  <span className="text-[11px] text-muted">{formatDay(p.date, { day: 'numeric', month: 'short' })}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-muted">Tire fotos no botão 📸 do Início. Elas mostram como o {s.pet.name} estava em cada fase.</p>
          )}
        </section>

        <section className="card grid gap-2 p-4" aria-label="Linha do tempo">
          <h2 className="font-display text-[20px] font-bold">Linha do tempo</h2>
          <ol className="grid gap-2 border-l-2 border-line pl-4">
            {timeline.map((t, i) => (
              <li key={i} className="text-[14px]">
                <span className="block text-[12px] font-bold text-muted">{formatDay(t.date, { day: 'numeric', month: 'long' })}</span>
                {t.text}
              </li>
            ))}
          </ol>
        </section>
        {!isPremium(s) && <p className="text-center text-[13px] text-muted">Gráficos dos últimos 30 dias. Com o HamiCare+, 6 meses.</p>}
      </div>

      <Modal open={!!photo} onClose={() => setPhoto(null)} label="Foto do Hami">
        {photo && (
          <div className="grid justify-items-center gap-3 p-5">
            <Hamster fur={photo.snap.fur} grams={photo.snap.grams} phase={photo.snap.phase} outfit={photo.snap.outfit} mood={photo.snap.mood} size={220} />
            <p className="font-display text-[20px] font-bold">{photo.caption || s.pet.name}</p>
            <p className="text-[13px] text-muted">{formatDay(photo.date)}</p>
            <div className="flex w-full gap-2">
              <button className="btn btn-primary flex-1" onClick={() => (onShare(photo), setPhoto(null))}>
                Compartilhar
              </button>
              <button className="icon-btn !h-12 !w-12" aria-label="Apagar foto" onClick={() => (deletePhoto(photo.id), setPhoto(null))}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface2 p-2">
      <p className="font-display text-[24px] font-bold leading-none tabular-nums">{value}</p>
      <p className="text-[12px] font-bold text-muted">{label}</p>
    </div>
  );
}
