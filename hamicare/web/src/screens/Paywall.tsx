import { useState } from 'react';
import { Check, ChevronLeft, Crown } from 'lucide-react';
import { PLUS_COUNTS, PLUS_PRICE } from '../components/PlusCard';
import { Hamster } from '../components/Hamster';
import { ItemIcon } from '../components/ItemIcon';
import { itemById } from '../data/items';
import { Seed, toast } from '../components/ui';
import { isPremium, startTrial, useApp } from '../lib/store';
import { startTrialOnServer, useAccount } from '../lib/account';
import { ApiError } from '../lib/social/api';
import { formatDay } from '../lib/util';
import { storeWord } from '../lib/native';
import { openGuardian } from '../components/Guardian';
import { canBuyHere } from '../lib/guardian';
import { Glyph } from '../components/art';
import { PlusWeeklyCard } from '../components/PlusWeekly';
import { PLUS_WEEKLY } from '../lib/store';
import { TEAM_MAX, TEAM_MAX_PLUS } from '../shared/team';

export { PLUS_PRICE };

const PARADE = ['fantasia-dragao-roxo', 'fantasia-tubarao', 'fantasia-panda'];
/** Dias grátis de cada plano (o servidor confere: anual 7, mensal 3). */
export const TRIAL_DAYS = { anual: 7, mensal: 3 } as const;
type Plan = keyof typeof TRIAL_DAYS;

type Row = [string, string | boolean, string | boolean];
const ROWS: Row[] = [
  ['Hami, missões, arenas e baús', true, true],
  ['SOS, respiração, diário e humor', true, true],
  ['Temporada do mês e coleções', true, true],
  ['Amigos e feed', true, true],
  ['Sementes de presente toda semana', false, `${PLUS_WEEKLY}`],
  ['Pessoas na turma', `${TEAM_MAX}`, `${TEAM_MAX_PLUS}`],
  ['Martelinho grátis todo mês', false, true],
  [`Fantasias, roupas e móveis exclusivos`, false, `${PLUS_COUNTS.items} itens`],
  [`Estilos de casa completos`, false, `${PLUS_COUNTS.styles}`],
  [`Pelagens especiais`, false, `${PLUS_COUNTS.furs}`],
  ['Estatísticas de evolução e humor', '30 dias', '6 meses'],
];

const cell = (v: string | boolean) => (v === true ? <Check size={18} className="mx-auto" aria-label="sim" /> : v === false ? <span className="opacity-60" aria-label="não">—</span> : <b>{v}</b>);

function Compare() {
  return (
    <div className="plan-table pw-table" role="table" aria-label="Grátis e Plus">
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
  );
}

/** HamiCare+ em duas etapas: o que muda (com o Hami vestido) e a escolha do plano. O essencial de autocuidado é sempre grátis. */
export function Paywall({ onClose, fromOnboarding, fur, name }: { onClose: () => void; fromOnboarding?: boolean; fur?: string; name?: string }) {
  const s = useApp();
  const { user } = useAccount();
  const premium = isPremium(s);
  const trialFree = !s.premium.trialStart && !user?.trialUsed;
  const [step, setStep] = useState<'intro' | 'planos'>('intro');
  const [plan, setPlan] = useState<Plan>('anual');
  const [compare, setCompare] = useState(false);
  const pet = name ?? (s.pet.name || 'Hami');
  const petFur = fur ?? s.pet.fur;
  const later = fromOnboarding ? 'Continuar grátis' : 'Agora não';

  async function begin() {
    const days = TRIAL_DAYS[plan];
    const msg = `${days} dias de Plus liberados!`;
    if (user) {
      try {
        await startTrialOnServer(plan);
        toast(msg);
      } catch (e) {
        toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
      }
    } else if (startTrial(days)) toast(msg);
    onClose();
  }

  if (premium) {
    return (
      <div className="pw grid gap-4">
        <Parade fur={petFur} />
        <h2 className="pw-title">O {pet} já é Plus! 💛</h2>
        <p className="rounded-2xl bg-white/15 p-4 text-center font-bold">Plus ativo até {formatDay(s.premium.until!, { day: 'numeric', month: 'long' })}.</p>
        <PlusWeeklyCard always />
        <Compare />
        <GuardianLinks onClose={onClose} />
        <button className="pw-later" onClick={onClose}>
          Voltar
        </button>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="pw grid gap-5">
        <Parade fur={petFur} />
        <h2 className="pw-title">
          Com o Plus, cuidar de você fica <span className="pw-hl">ainda mais gostoso!</span>
        </h2>
        <ul className="pw-benefits">
          <li>
            <span className="pw-ico">
              <Hamster growth={1} fur={petFur} outfit={{ chapeu: null, oculos: null, roupa: 'fantasia-raposa', acessorio: null, efeito: null }} size={56} idle={false} mood="feliz" label="Hami de raposinha" />
            </span>
            <span>
              <b>Deixe o {pet} do seu jeito</b>
              Fantasias, roupas e móveis exclusivos: são {PLUS_COUNTS.items} itens só do Plus.
            </span>
          </li>
          <li>
            <span className="pw-ico">
              <Seed size={34} />
            </span>
            <span>
              <b>{PLUS_WEEKLY} sementes toda semana</b>
              Uma mesada de cerca de 2.000 sementes por mês, mais um martelinho grátis para salvar a sua sequência.
            </span>
          </li>
          <li>
            <span className="pw-ico">
              <Glyph e="art:turma" size={44} />
            </span>
            <span>
              <b>Turma com até {TEAM_MAX_PLUS} pessoas</b>
              Chame mais amigos para cuidar dos Hamis juntos (sem Plus, cabem {TEAM_MAX}).
            </span>
          </li>
          <li>
            <span className="pw-ico">{itemById('k-cama-dossel-rosa') && <ItemIcon item={itemById('k-cama-dossel-rosa')!} size={30} />}</span>
            <span>
              <b>Mimos novos todo dia</b>
              Vitrine especial, casas prontas e pelagens raras, só pra você.
            </span>
          </li>
          <li>
            <span className="pw-ico">
              <Hamster growth={1} fur={petFur} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: 'm-pelucia', efeito: null }} size={56} idle={false} mood="animado" label="Hami com pelúcia" />
            </span>
            <span>
              <b>Apoie nossa missão</b>
              Você ajuda a manter o HamiCare grátis no essencial para quem precisa se cuidar.
            </span>
          </li>
        </ul>
        <button className="pw-cta" onClick={() => setStep('planos')}>
          {trialFree ? 'Testar por R$ 0,00' : 'Ver planos'}
        </button>
        {!fromOnboarding && <GuardianLinks onClose={onClose} />}
        <button className="pw-later" onClick={onClose}>
          {later}
        </button>
      </div>
    );
  }

  return (
    <div className="pw grid gap-4">
      <button className="pw-back" onClick={() => setStep('intro')} aria-label="Voltar">
        <ChevronLeft size={22} />
      </button>
      <h2 className="pw-title">{trialFree ? 'Escolha seu plano e comece o teste grátis' : 'Escolha seu plano'}</h2>
      <div className="grid gap-3" role="radiogroup" aria-label="Planos">
        <button className={`pw-plan pw-plan-year ${plan === 'anual' ? 'is-on' : ''}`} role="radio" aria-checked={plan === 'anual'} onClick={() => setPlan('anual')}>
          <span className="pw-badge">MAIS ESCOLHIDO · MELHOR PREÇO</span>
          <b className="text-[19px]">12 meses</b>
          <span className="pw-year-month">
            {PLUS_PRICE.yearMonthly}
            <small>/mês</small>
          </span>
          <span>
            <s className="opacity-70">{PLUS_PRICE.yearFull}</s> {PLUS_PRICE.year} por ano
          </span>
          <span className="text-[14px] opacity-85">{trialFree ? `${TRIAL_DAYS.anual} dias grátis · ` : ''}economize {PLUS_PRICE.saving} · um ano inteiro de cuidado</span>
        </button>
        <button className={`pw-plan pw-plan-month ${plan === 'mensal' ? 'is-on' : ''}`} role="radio" aria-checked={plan === 'mensal'} onClick={() => setPlan('mensal')}>
          <b className="text-[19px]">Mensal</b>
          <span>{PLUS_PRICE.month} por mês</span>
          {trialFree && <span className="text-[14px] opacity-85">{TRIAL_DAYS.mensal} dias grátis</span>}
        </button>
      </div>
      <button className="pw-link" onClick={() => setCompare(!compare)} aria-expanded={compare}>
        {compare ? 'Esconder o que muda' : 'Comparar Grátis e Plus'}
      </button>
      {compare && <Compare />}
      <div className="pw-laurel" aria-label="O essencial é sempre grátis e sem anúncios">
        <Laurel />
        <span>
          <b>O essencial é sempre grátis</b>
          Sem anúncios
        </span>
        <Laurel flip />
      </div>
      {trialFree ? (
        <>
          <p className="text-center text-[13px] opacity-90">O teste não pede cartão e não vira assinatura sozinho. Depois dele, o plano {plan} custa {plan === 'anual' ? `${PLUS_PRICE.year} por ano` : `${PLUS_PRICE.month} por mês`}. Cancele quando quiser.</p>
          <button className="pw-cta" onClick={begin}>
            Começar meus {TRIAL_DAYS[plan]} dias grátis
          </button>
        </>
      ) : (
        <p className="rounded-2xl bg-white/15 p-4 text-center text-[14px]">Seu teste grátis já foi usado. A assinatura do plano {plan} chega em breve {storeWord()}.</p>
      )}
      {!fromOnboarding && <GuardianLinks onClose={onClose} />}
      <button className="pw-later" onClick={onClose}>
        {later}
      </button>
    </div>
  );
}

/** Guardiões: pedir o Plus de presente ou dar para quem não pode pagar (dar só fora dos apps das lojas). */
function GuardianLinks({ onClose }: { onClose: () => void }) {
  const go = () => {
    onClose();
    openGuardian();
  };
  return (
    <div className="pw-guardian">
      <button onClick={go}>
        <Glyph e="💌" size={24} /> Não dá para pagar agora? Peça um HamiCare+ de presente
      </button>
      {canBuyHere() && (
        <button onClick={go}>
          <Glyph e="🛡️" size={24} /> Quer ajudar alguém? Seja um Guardião
        </button>
      )}
    </div>
  );
}

function Parade({ fur }: { fur: string }) {
  return (
    <div className="pw-parade" aria-label="Fantasias do Plus">
      {PARADE.map((id, i) => (
        <Hamster key={id} growth={1} fur={fur} outfit={{ chapeu: null, oculos: null, roupa: id, acessorio: null, efeito: null }} size={i === 1 ? 108 : 96} idle={false} mood={i === 1 ? 'surpreso' : i === 0 ? 'animado' : 'calmo'} label={itemById(id)?.name} />
      ))}
    </div>
  );
}

function Laurel({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 34 64" width="28" height="54" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M26 62 Q6 46 14 4" stroke="#F6B94A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {[[22, 54, -60], [15, 44, -50], [11, 33, -35], [11, 22, -20], [13, 11, -5]].map(([x, y, r]) => (
        <ellipse key={y} cx={x - 5} cy={y} rx="4.5" ry="8.5" fill="#F6B94A" transform={`rotate(${r} ${x - 5} ${y})`} />
      ))}
      {[[22, 54], [15, 44], [11, 33]].map(([x, y]) => (
        <ellipse key={y} cx={x + 5} cy={y - 4} rx="3.5" ry="7" fill="#F6B94A" opacity="0.85" transform={`rotate(35 ${x + 5} ${y - 4})`} />
      ))}
    </svg>
  );
}
