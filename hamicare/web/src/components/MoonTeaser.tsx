// Chamada da viagem para a Lua no Início: mostra quanto falta e leva ao Mapa das Arenas.
import { ChevronRight } from 'lucide-react';
import { Seed } from './ui';
import { MOON_N, MOON_PRICE } from '../data/arenas';
import { homeArenaOf, useApp } from '../lib/store';

export function MoonTeaser({ onGo }: { onGo: () => void }) {
  const s = useApp();
  if (s.moon && homeArenaOf(s) === MOON_N) return null;
  const pct = Math.min(1, s.coins / MOON_PRICE);
  return (
    <button className="moon-teaser" onClick={onGo} aria-label="Viagem para a Lua">
      <span className="moon-teaser-sky" aria-hidden="true">
        <span className="moon-teaser-moon" />
        <span className="moon-teaser-rocket">🚀</span>
      </span>
      <span className="min-w-0 flex-1 text-left">
        <small>Viagem para a Lua</small>
        <b>{s.moon ? `Voltar para a casa lunar do ${s.pet.name}` : s.coins >= MOON_PRICE ? 'Você já pode viajar! 🌙' : `Junte ${MOON_PRICE.toLocaleString('pt-BR')} sementes e ganhe uma casa na Lua`}</b>
        {!s.moon && (
          <span className="moon-teaser-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${pct})` }} />
          </span>
        )}
        {!s.moon && (
          <span className="moon-teaser-n">
            <Seed size={12} /> {s.coins.toLocaleString('pt-BR')} de {MOON_PRICE.toLocaleString('pt-BR')}
          </span>
        )}
      </span>
      <ChevronRight size={22} />
    </button>
  );
}
