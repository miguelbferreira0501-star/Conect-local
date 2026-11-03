// A jornada de peso na tela: o card grande do Início, os selos de calorias e o número que voa.
import { useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Hamster } from './Hamster';
import { JOURNEY_TEXT } from '../data/lines';
import { KCAL_PER_KG, conditioning, dayKcal, minDaysLeft } from '../logic/evolution';
import { dayOf, journeyNow, minor, todayKey } from '../lib/store';
import { fmtNum, prefersReducedMotion } from '../lib/util';
import type { Direction, State } from '../types';

/** Selo de calorias de uma missão: −44 kcal (emagrecer), +300 kcal (ganhar). */
export function KcalChip({ kcal, dir, small }: { kcal: number; dir: Direction; small?: boolean }) {
  if (kcal <= 0) return null;
  const sign = dir === 'perder' ? '−' : dir === 'ganhar' ? '+' : '';
  return (
    <span className={`kcal-chip ${dir === 'ganhar' ? 'kcal-gain' : dir === 'manter' ? 'kcal-neutral' : ''} ${small ? 'kcal-sm' : ''}`}>
      {dir === 'ganhar' ? '🍞' : '🔥'} {sign}
      {fmtNum(kcal, 0)} kcal
    </span>
  );
}

/** Número que voa da missão concluída: "−140 kcal". */
export function useKcalPop() {
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string; gain: boolean }[]>([]);
  const pop = useCallback((el: Element | null, text: string, gain = false) => {
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const id = Date.now() + Math.random();
    // Fica sempre dentro da tela, mesmo saindo do botão da direita.
    const x = Math.min(window.innerWidth - 70, Math.max(70, r.left + r.width / 2));
    setPops((p) => [...p, { id, x, y: r.top, text, gain }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1300);
  }, []);
  const layer = (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {pops.map((p) => (
        <span key={p.id} className={`kcal-fly ${p.gain ? 'kcal-gain' : ''}`} style={{ left: p.x, top: p.y }}>
          {p.text}
        </span>
      ))}
    </div>
  );
  return { pop, layer };
}

/** Card principal do Início: deixa claro que o Hami emagrece ou ganha peso junto com a pessoa. */
export function JourneyCard({ s, onOpen }: { s: State; onOpen: () => void }) {
  const today = todayKey();
  const j = s.journey;
  const t = JOURNEY_TEXT[j.dir];
  const isMinor = minor(s);
  const hide = s.body.hideNumbers;
  const { kcal, progress, byScale } = journeyNow(s, today);
  const todayKcal = dayKcal(dayOf(s, today), j.dir);
  const pct = Math.round(progress * 100);
  const pctLabel = progress > 0 && progress < 0.1 ? fmtNum(progress * 100, 1) : String(pct);
  const signed = (n: number) => (n > 0 ? `${t.sign}${fmtNum(n, 0)}` : '0');
  const left = Math.max(0, j.needKcal - kcal);
  const realData = s.body.tracking && !!s.body.baselineKg;

  if (isMinor) {
    const cond = conditioning(s.days, today);
    return (
      <button className="journey journey-manter text-left" onClick={onOpen}>
        <div className="flex items-center justify-between gap-2">
          <span className="journey-tag">🌱 Jornada de hábitos</span>
          <ChevronRight size={20} />
        </div>
        <p className="font-display text-[20px] font-bold leading-tight">O {s.pet.name} fica forte junto com você</p>
        <div className="journey-track">
          <div className="journey-fill" style={{ width: `${cond}%` }} />
        </div>
        <p className="text-[13px] font-bold opacity-80">Condicionamento {cond}/100 · vem dos seus dias de movimento</p>
      </button>
    );
  }

  if (j.dir === 'manter') {
    return (
      <button className="journey journey-manter text-left" onClick={onOpen}>
        <div className="flex items-center justify-between gap-2">
          <span className="journey-tag">⚖️ {t.title}</span>
          <ChevronRight size={20} />
        </div>
        <div className="flex items-center gap-3">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={70} idle={false} />
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold leading-tight">O {s.pet.name} fica firme {hide ? 'com você' : `nos ${fmtNum(s.pet.grams)} g`}</p>
            {!hide && <p className="text-[14px] font-bold opacity-85">Hoje: {fmtNum(todayKcal, 0)} kcal em movimento</p>}
          </div>
        </div>
        <p className="text-[12px] font-semibold opacity-75">Quer emagrecer ou ganhar peso com ele? Toque para trocar a missão.</p>
      </button>
    );
  }

  return (
    <button className={`journey journey-${j.dir} text-left`} onClick={onOpen} aria-label={`${t.title}: ${pct}% da meta. Abrir evolução`}>
      <div className="flex items-center justify-between gap-2">
        <span className="journey-tag min-w-0">
          <span aria-hidden="true">{t.emoji}</span>
          <span className="truncate">{t.title}</span>
        </span>
        <span className="journey-pct">
          {pctLabel}% <ChevronRight size={16} />
        </span>
      </div>
      <div className="flex items-end gap-2">
        <div className="shrink-0">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={84} idle={false} label={`${s.pet.name} agora`} />
        </div>
        <div className="grid min-w-0 flex-1 gap-1 pb-1">
          {!hide && (
            <p className="font-display text-[26px] font-bold leading-none tabular-nums">
              {fmtNum(s.pet.grams)} g <span className="text-[15px] font-extrabold opacity-80">→ {fmtNum(j.goalGrams)} g</span>
            </p>
          )}
          <div className="journey-track" role="progressbar" aria-label="Progresso da jornada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="journey-fill" style={{ width: `${Math.max(4, pct)}%` }} />
            <span className="journey-flag" aria-hidden="true">
              🏁
            </span>
          </div>
          <p className="text-[12.5px] font-bold opacity-85">
            {hide ? 'Cada missão saudável aproxima vocês dois da meta.' : byScale ? 'O Hami está seguindo a sua balança.' : `Você e o ${s.pet.name} ${t.verb} as mesmas calorias.`}
          </p>
        </div>
      </div>
      {!hide && (
        <div className="grid grid-cols-3 gap-1.5">
          <Stat value={signed(todayKcal)} label="kcal hoje" />
          <Stat value={signed(kcal)} label="kcal na jornada" />
          <Stat value={realData ? `≈ ${fmtNum(left / KCAL_PER_KG)} kg` : fmtNum(left, 0)} label={realData ? 'para a meta' : 'kcal para a meta'} />
        </div>
      )}
      {j.reachedAt ? (
        <p className="journey-note">🏆 Vocês chegaram na meta! Toque para escolher a próxima missão.</p>
      ) : (
        !hide && <p className="journey-note">No ritmo mais rápido que o app permite: uns {minDaysLeft(j, kcal)} dias. Devagar também chega.</p>
      )}
    </button>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="journey-stat rounded-2xl px-2 py-1.5 text-center">
      <p className="font-display text-[17px] font-bold leading-none tabular-nums">{value}</p>
      <p className="text-[10.5px] font-extrabold uppercase leading-tight opacity-85">{label}</p>
    </div>
  );
}
