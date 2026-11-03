import { Check, Sparkles } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { toast } from '../components/ui';
import { isPremium, startTrial, useApp } from '../lib/store';
import { formatDay } from '../lib/util';

export const PLUS_PRICE = { month: 'R$ 12,90', year: 'R$ 79,90', yearMonthly: 'R$ 6,66' };

const FREE = ['Hami, tarefas e evolução', 'Cuidados (banho, comida, carinho)', 'Casa básica e 8 lugares do mapa', 'Diário, humor, respiração e todas as ferramentas de calma', 'Amigos e feed'];
const PLUS = ['Roupas, pelagens e decorações especiais', 'Castelo e Espaço sideral (aventuras extras)', 'Coleções de casa completas', 'Estatísticas de 6 meses na Nossa Evolução', 'Temporadas com itens exclusivos'];

/** HamiCare+: o essencial de autocuidado é sempre grátis. */
export function Paywall({ onClose, fromOnboarding, fur, name }: { onClose: () => void; fromOnboarding?: boolean; fur?: string; name?: string }) {
  const s = useApp();
  const premium = isPremium(s);
  return (
    <div className="grid gap-4">
      <div className="grid justify-items-center gap-1 text-center">
        <Hamster fur={fur ?? s.pet.fur} grams={s.pet.grams} phase={Math.max(s.pet.phase, 3)} mood="animado" outfit={{ ...s.pet.outfit, chapeu: 'cartola' }} size={150} />
        <p className="eyebrow">HamiCare+</p>
        <h2 className="font-display text-[28px] font-bold leading-tight">Mais mimos para o {name ?? (s.pet.name || 'Hami')}</h2>
        <p className="max-w-[34ch] text-[15px] text-muted">Tudo que é cuidado de verdade continua grátis. O Plus é para quem quer mais fofura e mais mundo.</p>
      </div>

      <div className="grid gap-2 rounded-2xl bg-surface2 p-4">
        <p className="text-[13px] font-extrabold uppercase tracking-wide text-muted">Grátis para sempre</p>
        {FREE.map((f) => (
          <p key={f} className="flex items-start gap-2 text-[15px]">
            <Check size={18} className="mt-0.5 shrink-0 text-leaf" /> {f}
          </p>
        ))}
      </div>
      <div className="grid gap-2 rounded-2xl bg-accent-soft p-4">
        <p className="text-[13px] font-extrabold uppercase tracking-wide">Com o Plus</p>
        {PLUS.map((f) => (
          <p key={f} className="flex items-start gap-2 text-[15px]">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" /> {f}
          </p>
        ))}
      </div>

      {premium ? (
        <p className="rounded-2xl bg-leaf-soft p-4 text-center font-bold">Plus ativo até {formatDay(s.premium.until!, { day: 'numeric', month: 'long' })}.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border-2 border-accent p-3 text-center">
              <p className="text-[13px] font-bold text-muted">Anual</p>
              <p className="font-display text-[22px] font-bold leading-tight">{PLUS_PRICE.year}</p>
              <p className="text-[12px] text-muted">≈ {PLUS_PRICE.yearMonthly} por mês</p>
            </div>
            <div className="rounded-2xl border-2 border-line p-3 text-center">
              <p className="text-[13px] font-bold text-muted">Mensal</p>
              <p className="font-display text-[22px] font-bold leading-tight">{PLUS_PRICE.month}</p>
              <p className="text-[12px] text-muted">cancele quando quiser</p>
            </div>
          </div>
          {s.premium.trialStart ? (
            <p className="rounded-2xl bg-surface2 p-4 text-center text-[15px] text-muted">
              Seu teste grátis já foi usado. A assinatura paga chega na versão das lojas (Google Play e App Store) e no Pix.
            </p>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (startTrial()) toast('7 dias de Plus liberados!');
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
      <p className="text-center text-[12px] text-muted">O teste não pede cartão e não vira assinatura sozinho.</p>
    </div>
  );
}
