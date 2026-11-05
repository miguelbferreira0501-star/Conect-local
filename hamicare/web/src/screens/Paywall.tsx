import { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { PLUS_COUNTS, PLUS_PRICE } from '../components/PlusCard';
import { Hamster } from '../components/Hamster';
import { toast } from '../components/ui';
import { isPremium, startTrial, useApp } from '../lib/store';
import { startTrialOnServer, useAccount } from '../lib/account';
import { ApiError } from '../lib/social/api';
import { formatDay } from '../lib/util';

export { PLUS_PRICE };

type Row = [string, string | boolean, string | boolean];
const ROWS: Row[] = [
  ['Hami, missões, arenas e baús', true, true],
  ['SOS, respiração, diário e humor', true, true],
  ['Temporada do mês e coleções', true, true],
  ['Amigos e feed', true, true],
  [`Roupas e decorações exclusivas`, false, `${PLUS_COUNTS.items} itens`],
  [`Pelagens especiais`, false, `${PLUS_COUNTS.furs}`],
  ['Estatísticas de evolução e humor', '30 dias', '6 meses'],
];

const cell = (v: string | boolean) => (v === true ? <Check size={18} className="mx-auto text-leaf" aria-label="sim" /> : v === false ? <span className="text-muted" aria-label="não">—</span> : <b>{v}</b>);

/** HamiCare+: o essencial de autocuidado é sempre grátis. */
export function Paywall({ onClose, fromOnboarding, fur, name }: { onClose: () => void; fromOnboarding?: boolean; fur?: string; name?: string }) {
  const s = useApp();
  const { user } = useAccount();
  const premium = isPremium(s);
  const [plan, setPlan] = useState<'anual' | 'mensal'>('anual');
  return (
    <div className="grid gap-4">
      <div className="grid justify-items-center gap-1 text-center">
        <Hamster fur={fur ?? s.pet.fur} grams={s.pet.grams} phase={Math.max(s.pet.phase, 3)} mood="animado" outfit={{ ...s.pet.outfit, chapeu: 'cartola' }} size={150} />
        <p className="eyebrow flex items-center gap-1">
          <Crown size={14} /> HamiCare+
        </p>
        <h2 className="font-display text-[28px] font-bold leading-tight">Mais mimos para o {name ?? (s.pet.name || 'Hami')}</h2>
        <p className="max-w-[34ch] text-[15px] text-muted">Tudo que é cuidado de verdade continua grátis. O Plus é para quem quer mais fofura e mais mundo.</p>
      </div>

      <div className="plan-table" role="table" aria-label="Grátis e Plus">
        <div className="plan-row plan-head" role="row">
          <span role="columnheader" />
          <span role="columnheader">Grátis</span>
          <span role="columnheader" className="is-plus">
            <Crown size={14} /> Plus
          </span>
        </div>
        {ROWS.map(([label, free, plus]) => (
          <div key={label} className="plan-row" role="row">
            <span role="cell">{label}</span>
            <span role="cell">{cell(free)}</span>
            <span role="cell" className="is-plus">
              {cell(plus)}
            </span>
          </div>
        ))}
      </div>

      {premium ? (
        <p className="rounded-2xl bg-leaf-soft p-4 text-center font-bold">Plus ativo até {formatDay(s.premium.until!, { day: 'numeric', month: 'long' })}.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Planos">
            <button className={`plan-card ${plan === 'anual' ? 'is-on' : ''}`} role="radio" aria-checked={plan === 'anual'} onClick={() => setPlan('anual')}>
              <span className="plan-badge">Economize {PLUS_PRICE.saving}</span>
              <span className="text-[13px] font-bold text-muted">Anual</span>
              <span className="font-display text-[22px] font-bold leading-tight">{PLUS_PRICE.year}</span>
              <span className="text-[12px] text-muted">≈ {PLUS_PRICE.yearMonthly} por mês</span>
            </button>
            <button className={`plan-card ${plan === 'mensal' ? 'is-on' : ''}`} role="radio" aria-checked={plan === 'mensal'} onClick={() => setPlan('mensal')}>
              <span className="text-[13px] font-bold text-muted">Mensal</span>
              <span className="font-display text-[22px] font-bold leading-tight">{PLUS_PRICE.month}</span>
              <span className="text-[12px] text-muted">cancele quando quiser</span>
            </button>
          </div>
          {s.premium.trialStart ? (
            <p className="rounded-2xl bg-surface2 p-4 text-center text-[15px] text-muted">
              Seu teste grátis já foi usado. A assinatura do plano {plan} chega em breve pela Google Play, pela App Store e no Pix.
            </p>
          ) : (
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (user) {
                  try {
                    await startTrialOnServer();
                    toast('7 dias de Plus liberados!');
                  } catch (e) {
                    toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
                  }
                } else if (startTrial()) toast('7 dias de Plus liberados!');
                onClose();
              }}
            >
              Testar 7 dias grátis
            </button>
          )}
        </>
      )}
      <button className="btn btn-ghost" onClick={onClose}>
        {fromOnboarding ? 'Continuar grátis' : 'Voltar'}
      </button>
      <p className="text-center text-[12px] text-muted">O teste não pede cartão e não vira assinatura sozinho. Depois dele, o plano {plan} custa {plan === 'anual' ? `${PLUS_PRICE.year} por ano` : `${PLUS_PRICE.month} por mês`}.</p>
    </div>
  );
}
