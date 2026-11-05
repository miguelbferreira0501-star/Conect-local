// Crescimento do Hami: o selinho no Início e o cartão com as fases em Nossa evolução.
import { useMemo } from 'react';
import { Hamster } from './Hamster';
import { Bar } from './ui';
import { careDays, growthOf, GROWTH } from '../logic/growth';
import type { State } from '../types';

export function useGrowth(s: State) {
  return useMemo(() => growthOf(careDays(s.days)), [s.days]);
}

const dias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/** Selinho no cenário do Início: a fase de agora e quanto falta para crescer. */
export function GrowthPill({ s, onClick }: { s: State; onClick: () => void }) {
  const g = useGrowth(s);
  return (
    <button className="growth-pill" onClick={onClick} aria-label={`${s.pet.name}: ${g.name}. ${g.next ? `Cresce em ${dias(g.toNext)} de cuidado.` : 'Tamanho máximo.'}`}>
      <span className="growth-pill-icon" aria-hidden="true">🌱</span>
      <span className="grid min-w-0 flex-1 gap-1 text-left">
        <span className="growth-pill-name">
          {s.pet.name}: {g.name}
          <span className="growth-pill-next">{g.next ? ` · vira ${g.next.name} em ${dias(g.toNext)} de cuidado` : ' · tamanho máximo'}</span>
        </span>
        <span className="growth-pill-bar" aria-hidden="true">
          <span style={{ width: `${Math.round(g.progress * 100)}%` }} />
        </span>
      </span>
    </button>
  );
}

/** Cartão com as 8 fases: o Hami de cada tamanho, a fase atual e quanto falta. */
export function GrowthCard({ s }: { s: State }) {
  const g = useGrowth(s);
  return (
    <section className="card grid gap-3 p-4" aria-label="Crescimento">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[20px] font-bold">Crescimento</h2>
        <span className="text-[13px] font-extrabold text-muted">{dias(g.days)} de cuidado</span>
      </div>
      <div className="growth-row" role="list">
        {GROWTH.map((st, i) => (
          <div key={st.name} role="listitem" className={`growth-step ${i === g.stage ? 'is-now' : i < g.stage ? 'is-done' : ''}`} aria-label={`${st.name}: ${i <= g.stage ? 'alcançada' : `com ${st.days} dias de cuidado`}`}>
            <div className="growth-pet" style={{ opacity: i <= g.stage ? 1 : 0.3, filter: i <= g.stage ? 'none' : 'grayscale(1) brightness(1.1)' }}>
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} size={52} idle={false} growth={st.scale} />
            </div>
            <span className="growth-step-name">{st.name}</span>
          </div>
        ))}
      </div>
      {g.next ? (
        <>
          <Bar value={g.progress * 100} tone="leaf" label={`Até ${g.next.name}`} />
          <p className="text-[14px] text-muted">
            O {s.pet.name} está na fase <b className="text-[var(--ink)]">{g.name}</b>. Faltam <b className="text-[var(--ink)]">{dias(g.toNext)} de cuidado</b> para virar {g.next.name}. Todo dia em que você faz uma missão ou cuida dele, ele cresce mais um pouquinho (não precisa ser seguido).
          </p>
        </>
      ) : (
        <p className="text-[14px] text-muted">O {s.pet.name} chegou ao tamanho máximo. Que jornada linda!</p>
      )}
    </section>
  );
}
