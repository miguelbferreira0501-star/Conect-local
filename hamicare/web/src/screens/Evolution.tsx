import { PlusCard } from '../components/PlusCard';
import { useState } from 'react';
import { Lock, Trash2, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Bar, LineChart, Modal, toast } from '../components/ui';
import { BAND, DAY_CAP, KCAL_PER_KG, PHASES, PHASE_MIN, REF_KG, conditioning, dayKcal, defaultGoalKg, rapidChange, recentAverageKg } from '../logic/evolution';
import { ACHIEVEMENTS, countIn } from '../logic/progress';
import { bestStreak, streakOf } from '../logic/streak';
import { areaNow, deletePhoto, enableTracking, isPremium, journeyNow, logWeight, minor, setGoal, setSync, todayKey, useApp, weightOn } from '../lib/store';
import { addDays, formatDay, fmtNum, weekStart, WEEKDAYS } from '../lib/util';
import { GOALS, JOURNEY_TEXT } from '../data/lines';
import type { Photo } from '../types';
import { Glyph } from '../components/art';
import { AreaSheet } from '../components/AreaSheet';
import { AREAS } from '../logic/areas';

export function Evolution({ onClose, onShare, onPlus }: { onClose: () => void; onShare: (p: Photo) => void; onPlus: () => void }) {
  const s = useApp();
  const today = todayKey();
  const cond = conditioning(s.days, today);
  const isMinor = minor(s);
  const area = areaNow(s);
  const noWeight = !weightOn(s);
  const hideNums = noWeight || s.body.hideNumbers;
  const [areaOpen, setAreaOpen] = useState(false);
  const range = isPremium(s) ? 180 : 30;
  const [kg, setKg] = useState('');
  const [goalKg, setGoalKg] = useState(s.body.goalKg ? String(s.body.goalKg) : '');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const streak = streakOf(s.days, today, s.createdAt);
  const best = bestStreak(s.days, today, s.createdAt);
  const totalDone = Object.values(s.days).reduce((n, d) => n + Object.keys(d.done).length, 0);
  const nextPhase = PHASE_MIN[s.pet.phase + 1];
  const j = s.journey;
  const jt = JOURNEY_TEXT[j.dir];
  const jn = journeyNow(s, today);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6);
    return { key, kcal: dayKcal(s.days[key], j.dir, s.mealRef ?? null), label: WEEKDAYS[new Date(`${key}T12:00:00`).getDay()] };
  });
  const maxKcal = Math.max(1, ...last7.map((d) => d.kcal));

  const petPoints = s.pet.weighIns.filter((w) => w.date >= addDays(today, -range)).map((w) => ({ label: formatDay(w.date, { day: 'numeric', month: 'short' }), value: w.grams }));
  const userLogs = s.body.logs.filter((l) => l.date >= addDays(today, -range));
  const userPoints = userLogs.map((l) => ({ label: formatDay(l.date, { day: 'numeric', month: 'short' }), value: l.kg }));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(weekStart(today), -7 * (7 - i));
    return { start, n: countIn(s.days, start, addDays(start, 6), (d) => Object.keys(d.done).length) };
  });
  const maxWeek = Math.max(1, ...weeks.map((w) => w.n));

  const timeline = [
    { date: s.createdAt, icon: '🐹', text: `A jornada com o ${s.pet.name} começou` },
    ...Object.entries(s.achievements).map(([id, date]) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      return { date, icon: a?.emoji ?? '⭐', text: a ? a.title : id };
    }),
    ...(j.reachedAt ? [{ date: j.reachedAt, icon: '🏆', text: 'Meta da jornada alcançada' }] : []),
    { date: j.startedAt, icon: jt.emoji, text: `Missão: ${GOALS[s.profile.goal].label}` },
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

        <section className="card grid gap-3 p-4" aria-label="Nossa jornada">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[20px] font-bold">{noWeight ? (area === 'calma' ? 'Jornada da calma' : 'Jornada de hábitos') : (
              <span className="flex items-center gap-2">
                <Glyph e={jt.emoji} size={26} /> {jt.title}
              </span>
            )}</h2>
          </div>
          {noWeight ? (
            <>
              <p className="text-[15px] text-muted">
                {isMinor
                  ? `Para menores de 18, o ${s.pet.name} não muda de peso e não existe contagem de calorias. A evolução dele vem dos hábitos e do movimento.`
                  : area === 'calma'
                    ? `Na área Calma ninguém fala de peso. O ${s.pet.name} evolui com as suas práticas de calma, o sono e o movimento.`
                    : `Na área de hábitos ninguém fala de peso nem de calorias. O ${s.pet.name} evolui com os seus hábitos e o movimento.`}
              </p>
              <button className="btn btn-soft" onClick={() => setAreaOpen(true)}>
                <Glyph e={AREAS[area].emoji} size={22} /> Mudar de área
              </button>
            </>
          ) : (
            <>
              <div className="flex items-end justify-around rounded-2xl bg-surface2 p-3">
                <div className="grid justify-items-center">
                  <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={90} idle={false} label={`${s.pet.name} agora`} />
                  <span className="text-[13px] font-extrabold">Agora{hideNums ? '' : ` · ${fmtNum(s.pet.grams)} g`}</span>
                </div>
                {j.dir !== 'manter' && (
                  <>
                    <span className="pb-10 text-[26px]" aria-hidden="true">
                      ➜
                    </span>
                    <div className="grid justify-items-center">
                      <Hamster fur={s.pet.fur} grams={j.goalGrams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={90} idle={false} label={`${s.pet.name} na meta`} />
                      <span className="text-[13px] font-extrabold">Meta{hideNums ? '' : ` · ${fmtNum(j.goalGrams)} g`}</span>
                    </div>
                  </>
                )}
              </div>
              {j.dir !== 'manter' && (
                <div className="grid gap-1">
                  <div className="flex items-center gap-2 text-[14px]">
                    <span className="font-bold">Progresso</span>
                    <div className="flex-1">
                      <Bar value={jn.progress * 100} tone="accent" label="Progresso da jornada" />
                    </div>
                    <span className="font-bold tabular-nums">{jn.progress > 0 && jn.progress < 0.1 ? fmtNum(jn.progress * 100, 1) : Math.round(jn.progress * 100)}%</span>
                  </div>
                  {!hideNums && (
                    <p className="text-[14px]">
                      Vocês já {jt.verb} <b>{fmtNum(jn.kcal, 0)} kcal</b> (≈ {fmtNum(jn.kcal / KCAL_PER_KG, jn.kcal < KCAL_PER_KG ? 2 : 1)} kg). Faltam <b>{fmtNum(Math.max(0, j.needKcal - jn.kcal), 0)} kcal</b>.
                      {jn.byScale && ' O Hami está seguindo a sua balança.'}
                    </p>
                  )}
                </div>
              )}
              {!hideNums && (
                <>
                  <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Calorias da jornada nos últimos 7 dias">
                    {last7.map((d) => (
                      <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-bold tabular-nums text-muted">{d.kcal ? fmtNum(d.kcal, 0) : ''}</span>
                        <div className={`w-full rounded-t-md ${j.dir === 'ganhar' ? 'bg-leaf' : 'bg-accent'}`} style={{ height: `${Math.max(4, (d.kcal / maxKcal) * 60)}px`, opacity: d.kcal ? 1 : 0.25 }} />
                        <span className="text-[10px] font-extrabold uppercase text-muted">{d.label}</span>
                      </div>
                    ))}
                  </div>
                  <LineChart points={petPoints} label="Peso do Hami" unit=" g" band={[BAND.min, BAND.max]} tone="var(--gold)" />
                </>
              )}
              <details className="rounded-2xl bg-surface2 p-3 text-[14px]">
                <summary className="cursor-pointer font-extrabold">Como as calorias funcionam?</summary>
                <div className="mt-2 grid gap-1.5 text-muted">
                  {j.dir === 'ganhar' ? (
                    <p>Para ganhar peso, contam as calorias que você comeu acima da sua referência, marcadas no Cardápio de hoje (no Início). As missões são hábitos que ajudam o corpo: força, sono e água.</p>
                  ) : (
                    <p>As missões são hábitos saudáveis, cada um com uma estimativa: movimento pelo gasto acima do repouso, e um pouquinho para água e sono. A comida fica no Cardápio de hoje, só para você ver as calorias do prato.</p>
                  )}
                  <p>O {s.pet.name} recebe exatamente as mesmas calorias que você. Cerca de {fmtNum(KCAL_PER_KG)} kcal equivalem a 1 kg: quando você chegar na sua meta, ele chega na dele.</p>
                  <p>Até {DAY_CAP[j.dir]} kcal contam por dia, para ninguém exagerar. Descanso nunca tira nada. São estimativas e não substituem um profissional de saúde.</p>
                  {!s.body.tracking && <p>As contas usam {REF_KG} kg como estimativa. Informe seu peso para ficar sob medida.</p>}
                </div>
              </details>
              {!s.body.tracking && j.dir !== 'manter' && (
                <button className="btn btn-soft" onClick={() => confirm('Guardar seu peso só para você, para as calorias ficarem sob medida? Dá pra apagar tudo nos Ajustes.') && enableTracking(true)}>
                  <Glyph e="⚖️" size={22} /> Informar meu peso e minha meta
                </button>
              )}
              <button className="btn btn-soft" onClick={() => setAreaOpen(true)}>
                <Glyph e={AREAS[area].emoji} size={22} /> Mudar de área
              </button>
            </>
          )}
        </section>

        {!noWeight && s.body.tracking && (
          <section className="card grid gap-3 p-4" aria-label="Sua evolução">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold">Sua evolução</h2>
              <span className="chip chip-plain">
                <Glyph e="🔒" size={16} /> Só você vê
              </span>
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
                <b>O Hami segue a minha balança.</b> Em vez das missões, o peso dele acompanha o seu progresso real até a meta. Dá pra desligar quando quiser.
              </span>
            </label>
            {j.dir !== 'manter' && (
              <div className="grid gap-2 rounded-2xl bg-surface2 p-3">
                <p className="text-[14px] font-extrabold">Minha meta de peso</p>
                <div className="flex gap-2">
                  <input aria-label="Meta em kg" className="field min-w-0 flex-1" inputMode="decimal" placeholder={s.body.baselineKg ? `Sugestão: ${fmtNum(defaultGoalKg(s.body.baselineKg, j.dir))} kg` : 'Meta (kg)'} value={goalKg} onChange={(e) => setGoalKg(e.target.value)} />
                  <button
                    className="btn btn-soft shrink-0"
                    onClick={() => {
                      const r = setGoal(goalKg ? Number(goalKg.replace(',', '.')) : null);
                      toast(r.ok ? 'Meta salva: a jornada do Hami se ajustou' : r.reason);
                    }}
                  >
                    Salvar
                  </button>
                </div>
                <p className="text-[12px] text-muted">Uma jornada vai até 20% do peso (emagrecer) ou 15% (ganhar), sem passar de um peso saudável para a sua altura. O HamiCare não faz recomendação médica.</p>
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
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${got ? 'bg-gold-soft' : 'bg-surface2 grayscale opacity-40'}`}>
                    <Glyph e={a.emoji} size={34} />
                  </span>
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
            <p className="text-[14px] text-muted">Tire fotos no botão de câmera da aba Cuidar. Elas mostram como o {s.pet.name} estava em cada fase.</p>
          )}
        </section>

        <section className="card grid gap-2 p-4" aria-label="Linha do tempo">
          <h2 className="font-display text-[20px] font-bold">Linha do tempo</h2>
          <ol className="grid gap-2 border-l-2 border-line pl-4">
            {timeline.map((t, i) => (
              <li key={i} className="text-[14px]">
                <span className="block text-[12px] font-bold text-muted">{formatDay(t.date, { day: 'numeric', month: 'long' })}</span>
                <span className="flex items-center gap-2">
                  <Glyph e={t.icon} size={22} /> {t.text}
                </span>
              </li>
            ))}
          </ol>
        </section>
        {!isPremium(s) && <p className="text-center text-[13px] text-muted">Gráficos dos últimos 30 dias. Com o HamiCare+, 6 meses.</p>}
        <PlusCard onOpen={onPlus} title="Veja 6 meses de evolução" text="Gráficos de 6 meses, além de roupas, pelagens e estilos de casa exclusivos." />
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
      <AreaSheet open={areaOpen} onClose={() => setAreaOpen(false)} />
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
