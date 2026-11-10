// Mesada do HamiCare+: 500 sementes toda semana (e um martelinho grátis por mês). Some quando já foi pega.
import { Crown, Gift } from 'lucide-react';
import { Seed, toast } from './ui';
import { burstConfetti } from '../lib/confetti';
import { PLUS_WEEKLY, claimPlusWeekly, isPremium, plusWeeklyClaimed, useApp } from '../lib/store';

export function PlusWeeklyCard({ always = false }: { always?: boolean }) {
  const s = useApp();
  if (!isPremium(s)) return null;
  const done = plusWeeklyClaimed(s);
  if (done && !always) return null;
  return (
    <section className={`plusw ${done ? 'is-done' : ''}`} aria-label="Mesada do Plus">
      <span className="plusw-ico" aria-hidden="true">
        {done ? <Crown size={26} /> : <Gift size={26} />}
      </span>
      <span className="plusw-txt">
        <b>{done ? 'Mesada da semana já pega' : 'Sua mesada do Plus chegou!'}</b>
        <small>{done ? 'Volta na segunda-feira com mais sementes.' : `${PLUS_WEEKLY} sementes toda semana, e um martelinho grátis por mês.`}</small>
      </span>
      {!done && (
        <button
          className="plusw-btn"
          data-sound="conquista"
          onClick={(e) => {
            const r = claimPlusWeekly();
            if (!r) return;
            burstConfetti(e.currentTarget);
            toast(`+${r.coins} sementes${r.hammer ? ' e 1 martelinho' : ''}!`);
          }}
        >
          <Seed size={16} /> Pegar {PLUS_WEEKLY}
        </button>
      )}
    </section>
  );
}
