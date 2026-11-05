// HamiCare+ à vista: um cartão com o Hami de cartola e o botão "Ver planos", e o selo "Plus" do topo.
// Não aparece para quem já é Plus nem para crianças de até 12 anos (sem oferta para criança).
import { Crown, ChevronRight } from 'lucide-react';
import { Hamster } from './Hamster';
import { isPremium, useApp } from '../lib/store';
import { ITEMS, STYLES } from '../data/items';
import { FURS } from '../data/fur';
import type { State } from '../types';

/** Preços do HamiCare+. yearFull = 12 × o mensal (para mostrar quanto o anual economiza). */
export const PLUS_PRICE = { month: 'R$ 49,90', year: 'R$ 329,90', yearMonthly: 'R$ 27,49', yearFull: 'R$ 598,80', saving: '45%' };

/** Quanto conteúdo é só do Plus (para mostrar números de verdade). */
export const PLUS_COUNTS = {
  items: ITEMS.filter((i) => i.plus).length,
  furs: FURS.filter((f) => f.plus).length,
  styles: STYLES.filter((s) => s.plus).length,
};

/** Mostra ofertas do Plus para esta pessoa? */
export const showPlusOffers = (s: State) => !isPremium(s) && s.profile.ageGroup !== 'ate12';

export function PlusCard({ onOpen, title, text, className = '' }: { onOpen: () => void; title: string; text: string; className?: string }) {
  const s = useApp();
  if (!showPlusOffers(s)) return null;
  const trial = !s.premium.trialStart;
  return (
    <button className={`plus-card ${className}`} onClick={onOpen} aria-label={`HamiCare+: ${title}. Ver planos`}>
      <span className="plus-card-pet" aria-hidden="true">
        <Hamster growth={1} fur={s.pet.fur} grams={s.pet.grams} phase={Math.max(s.pet.phase, 3)} mood="animado" outfit={{ ...s.pet.outfit, chapeu: 'cartola' }} size={74} idle={false} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="plus-card-eyebrow">
          <Crown size={13} /> HamiCare+
        </span>
        <span className="block font-display text-[17px] font-bold leading-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] font-semibold leading-snug opacity-85">{text}</span>
        <span className="plus-card-cta">
          {trial ? '7 dias grátis' : `A partir de ${PLUS_PRICE.yearMonthly}/mês`} · Ver planos <ChevronRight size={14} />
        </span>
      </span>
    </button>
  );
}

/** Botão do Plus no cenário do Início (abre os planos, ou mostra que o Plus está ativo). */
export function PlusPill({ onOpen, scene }: { onOpen: () => void; scene?: boolean }) {
  const s = useApp();
  if (s.profile.ageGroup === 'ate12' && !isPremium(s)) return null;
  const active = isPremium(s);
  return (
    <button className={`${scene ? 'plus-scene' : 'plus-pill'} ${active ? 'is-active' : ''}`} onClick={onOpen} aria-label={active ? 'HamiCare+ ativo' : 'Ver planos do HamiCare+'}>
      <Crown size={scene ? 22 : 16} />
      <span>Plus</span>
    </button>
  );
}
