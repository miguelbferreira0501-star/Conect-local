// Destinos das viagens: a lista "Já possui / Bloqueado" (comprar com sementes) e a tela "Ir para…"
// que aparece quando a meta do dia é cumprida, com o Hami de mala na mão pronto para sair.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, Lock, X } from 'lucide-react';
import { Glyph } from './art';
import { Seed, toast } from './ui';
import { TrekScene, TREK_THEMES, WalkingHami, inkOn } from './Trek';
import { CARDS_GOAL, DESTINATIONS, SOUVENIR_GOAL, destById, souvenirPieces, type Destination } from '../data/destinations';
import { buyDestination, chooseDestination, destinationOwned, isPremium, trekPlaceOf, useApp } from '../lib/store';
import { play } from '../lib/sound';
import type { State } from '../types';

function Progress({ d, s }: { d: Destination; s: State }) {
  const cards = s.trekCards?.[d.id] ?? 0;
  const pieces = souvenirPieces(cards);
  return (
    <div className="dst-prog">
      <div>
        <span className="dst-prog-ico">
          <Glyph e={d.souvenir.emoji} size={30} />
        </span>
        <span className="dst-prog-txt">
          <b>{d.souvenir.name}</b>
          <span className="dst-bar is-pink">
            <i style={{ width: `${Math.max(6, (pieces / SOUVENIR_GOAL) * 100)}%` }} />
            <em>
              {pieces}/{SOUVENIR_GOAL}
            </em>
          </span>
        </span>
      </div>
      <div>
        <span className="dst-prog-ico">
          <Glyph e="💌" size={28} />
        </span>
        <span className="dst-prog-txt">
          <b>Cartões de lembrança</b>
          <span className="dst-bar is-blue">
            <i style={{ width: `${Math.max(6, (Math.min(cards, CARDS_GOAL) / CARDS_GOAL) * 100)}%` }} />
            <em>
              {Math.min(cards, CARDS_GOAL)}/{CARDS_GOAL}
            </em>
          </span>
        </span>
      </div>
    </div>
  );
}

/** Lista dos destinos: os que a pessoa tem (para escolher) e os bloqueados (para comprar). */
export function DestinationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [tab, setTab] = useState<'meus' | 'bloqueados'>('meus');
  if (!open) return null;
  // Para crianças (até 12) não aparece nada do Plus.
  const kid = s.profile.ageGroup === 'ate12';
  const current = trekPlaceOf(s);
  const mine = DESTINATIONS.filter((d) => destinationOwned(s, d.id));
  const locked = DESTINATIONS.filter((d) => !destinationOwned(s, d.id) && d.id !== 'lua' && !(kid && d.plus));
  const list = tab === 'meus' ? mine : locked;

  const buy = (d: Destination) => {
    const r = buyDestination(d.id);
    if (r === 'ok') {
      play('compra');
      toast(`${d.name} liberado! É o próximo destino do Hami.`);
      setTab('meus');
    } else if (r === 'plus') toast('Esse destino é do Lumbi+.');
    else if (r === 'sem-sementes') toast(`Faltam ${d.price - s.coins} sementes.`);
  };

  return createPortal(
    <div className="dst" role="dialog" aria-modal="true" aria-label="Destino">
      <div className="dst-panel">
        <div className="dst-head">
          <button className="dst-ico" onClick={onClose} aria-label="Fechar">
            <ChevronDown size={24} />
          </button>
          <h2>Destino</h2>
          <span className="dst-coins" aria-label={`${s.coins} sementes`}>
            <Seed /> {s.coins}
          </span>
        </div>
        <div className="dst-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'meus'} className={tab === 'meus' ? 'is-on' : ''} onClick={() => setTab('meus')}>
            Já possui
          </button>
          <button role="tab" aria-selected={tab === 'bloqueados'} className={tab === 'bloqueados' ? 'is-on' : ''} onClick={() => setTab('bloqueados')}>
            Bloqueado
          </button>
        </div>
        <div className="dst-list">
          {list.map((d) => {
            const on = tab === 'meus' && current === d.id;
            return (
              <article key={d.id} className={`dst-card ${on ? 'is-on' : ''} ${d.plus ? 'is-plus' : ''}`}>
                <button
                  className="dst-card-main"
                  onClick={() => {
                    if (tab === 'meus') {
                      chooseDestination(d.id);
                      play('toque');
                      toast(`Próximo destino: ${d.name}`);
                    }
                  }}
                  aria-label={tab === 'meus' ? `Escolher ${d.name}` : d.name}
                >
                  <span className="dst-banner">
                    <TrekScene theme={d.id} height={132} still />
                    {tab === 'bloqueados' && (
                      <span className="dst-lock" aria-hidden="true">
                        <Lock size={16} />
                      </span>
                    )}
                  </span>
                  {d.plus && <span className="dst-premium">Premium</span>}
                  <span className="dst-name">{d.name}</span>
                  {tab === 'meus' && <Progress d={d} s={s} />}
                </button>
                {tab === 'bloqueados' &&
                  (d.plus && !isPremium(s) ? (
                    <span className="dst-price is-plus">Só no Lumbi+</span>
                  ) : (
                    <button className="dst-price" onClick={() => buy(d)} aria-label={`Comprar ${d.name} por ${d.price} sementes`}>
                      <Seed /> {d.price}
                    </button>
                  ))}
                {on && (
                  <span className="dst-check" aria-label="Destino escolhido">
                    <Check size={18} strokeWidth={3.5} />
                  </span>
                )}
              </article>
            );
          })}
          {!list.length && <p className="dst-empty">{tab === 'bloqueados' ? 'Você já tem todos os destinos!' : 'Nenhum destino ainda.'}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Antes de sair: o Hami com a sacolinha, a fala do destino, o cartão e o botão "Ir". */
export function TrekGo({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: () => void }) {
  const s = useApp();
  const [pick, setPick] = useState(false);
  if (!open) return null;
  const d = destById(trekPlaceOf(s)) ?? DESTINATIONS[0];
  const t = TREK_THEMES[d.id] ?? TREK_THEMES.casinha;
  const ink = inkOn(t.ground);
  return createPortal(
    <div className="tgo" role="dialog" aria-modal="true" aria-label={`Ir para ${d.name}`} style={{ background: t.ground, color: ink }}>
      <div className="tgo-top">
        <button className="tgo-x" onClick={onClose} aria-label="Agora não">
          <X size={22} />
        </button>
        <button className="tgo-change" onClick={() => setPick(true)} style={{ color: ink }}>
          Mudar destino <ChevronRight size={18} />
        </button>
      </div>
      <p className="tgo-say">{d.line}</p>
      <div className="tgo-pet">
        <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={140} still />
      </div>
      <h2 className="tgo-title">Ir para {d.name}</h2>
      <div className="tgo-card">
        <span className="dst-banner">
          <TrekScene theme={d.id} height={140} still />
        </span>
        <Progress d={d} s={s} />
      </div>
      <button className="tgo-go" onClick={onGo}>
        Ir
      </button>
      <DestinationSheet open={pick} onClose={() => setPick(false)} />
    </div>,
    document.body,
  );
}
