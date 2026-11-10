// Martelinho: quando a ofensiva quebra (faltou um dia além do descanso da semana), dá para consertar
// com um martelinho. Ganha 1 a cada 7 dias seguidos (guarda até 3) ou compra com sementes.
import { Glyph } from './art';
import { Seed, toast } from './ui';
import { play } from '../lib/sound';
import { buyHammer, hammersOf, streakRepair, useApp, applyHammers } from '../lib/store';
import { HAMMER_MAX } from '../logic/streak';
import { HAMMER_PRICE } from '../shared/game';
import { formatDay } from '../lib/util';

/** Cartão que aparece só quando há uma ofensiva quebrada que ainda dá para consertar. */
export function StreakRepairCard() {
  const s = useApp();
  const plan = streakRepair(s);
  if (!plan) return null;
  const have = hammersOf(s);
  const need = plan.fix.length;
  const days = plan.fix.map((k) => formatDay(k, { weekday: 'long' })).join(' e ');
  return (
    <section className="repair-card" aria-label="Consertar a ofensiva">
      <span className="repair-ico" aria-hidden="true">
        <Glyph e="🔨" size={44} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="repair-title">Sua ofensiva de {plan.after} dias quebrou</p>
        <p className="repair-sub">
          Faltou {days}. {need === 1 ? 'Um martelinho conserta' : `${need} martelinhos consertam`} e a sequência volta.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {have >= need ? (
            <button
              className="btn btn-primary btn-sm"
              data-sound="none"
              onClick={() => {
                const r = applyHammers();
                if (r && r !== 'sem-martelinho') {
                  play('magia');
                  toast(`Consertado! Ofensiva de volta: ${r.after} dias 🔥`);
                }
              }}
            >
              Consertar ({need} <Glyph e="🔨" size={16} />)
            </button>
          ) : (
            <BuyHammer />
          )}
          <span className="repair-have">
            Você tem {have} de {HAMMER_MAX} <Glyph e="🔨" size={15} />
          </span>
        </div>
      </div>
    </section>
  );
}

/** Botão de comprar martelinho (sementes). */
export function BuyHammer({ small }: { small?: boolean }) {
  const s = useApp();
  const full = hammersOf(s) >= HAMMER_MAX;
  return (
    <button
      className={`btn btn-soft ${small ? 'btn-sm' : 'btn-sm'}`}
      disabled={full}
      data-sound="none"
      onClick={() => {
        const r = buyHammer();
        if (r === 'ok') {
          play('compra');
          toast('Martelinho guardado 🔨');
        } else if (r === 'sem-sementes') toast(`Faltam sementes: o martelinho custa ${HAMMER_PRICE}.`);
      }}
    >
      {full ? 'Bolsa cheia' : (
        <>
          Comprar <Glyph e="🔨" size={16} /> · <Seed size={12} /> {HAMMER_PRICE}
        </>
      )}
    </button>
  );
}

/** Linha da bolsa de martelinhos (na tela de Missões, junto da ofensiva). */
export function HammerBag() {
  const s = useApp();
  const have = hammersOf(s);
  return (
    <div className="hammer-bag">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          {Array.from({ length: HAMMER_MAX }, (_, i) => (
            <span key={i} className={`hammer-slot ${i < have ? 'is-on' : ''}`} aria-hidden="true">
              <Glyph e="🔨" size={22} />
            </span>
          ))}
        </span>
        <BuyHammer small />
      </div>
      <p className="text-[13px] font-bold leading-snug text-muted">
        Martelinhos: {have} de {HAMMER_MAX}. Eles consertam a ofensiva se você faltar um dia. Ganhe 1 a cada 7 dias seguidos.
      </p>
    </div>
  );
}
