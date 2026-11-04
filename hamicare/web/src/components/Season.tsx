// Temporada do mês: um tema novo todo mês, com meta de dias ativos e prêmio.
import { useEffect, useRef, useState } from 'react';
import { claimSeasonTier, seasonDays, seasonTierClaimed } from '../lib/store';
import { Seed, toast } from './ui';
import { Chest } from './Chest';
import { gameCfg } from '../lib/game';
import { gameSyncOn } from '../lib/gameSync';
import { http } from '../lib/social/api';
import type { SeasonTier } from '../shared/game';
import type { State } from '../types';
import { Glyph } from './art';

export const SEASONS = [
  { name: 'Verão das Ondas', emoji: '🌊', c: ['#7FD3FF', '#3F9BEA'] },
  { name: 'Carnaval de Cores', emoji: '🎭', c: ['#FFB86B', '#FF5E8A'] },
  { name: 'Outono das Folhas', emoji: '🍂', c: ['#FFC37A', '#E07B39'] },
  { name: 'Bosque dos Cogumelos', emoji: '🍄', c: ['#FF9F9F', '#D9534F'] },
  { name: 'Festa das Flores', emoji: '🌸', c: ['#FFC6DD', '#F072A8'] },
  { name: 'Arraial do Hami', emoji: '🌽', c: ['#FFE07A', '#F2A23A'] },
  { name: 'Inverno Quentinho', emoji: '☕', c: ['#C9B6FF', '#7E5BD9'] },
  { name: 'Ventania de Pipas', emoji: '🪁', c: ['#9FE3D2', '#3FB8AC'] },
  { name: 'Primavera Florida', emoji: '🌼', c: ['#C6F0A0', '#5FBF5E'] },
  { name: 'Noite das Lanternas', emoji: '🏮', c: ['#FFB08A', '#C8456C'] },
  { name: 'Trilha das Estrelas', emoji: '✨', c: ['#8FA2FF', '#4B3FA8'] },
  { name: 'Natal Iluminado', emoji: '🎄', c: ['#8FD9A8', '#2E8A5A'] },
] as const;

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Temporada do mês: trilha grátis de degraus que abrem com dias ativos (sem pressa e sem contagem regressiva). */
export function SeasonBanner({ s }: { s: State }) {
  const m = new Date().getMonth();
  const season = SEASONS[m];
  const cfg = gameCfg();
  const tiers = cfg.season.tiers;
  const local = seasonDays(s);
  const [server, setServer] = useState<{ days: number } | null>(null);
  useEffect(() => {
    if (!gameSyncOn()) return;
    let live = true;
    http<{ days: number }>('GET', '/game/season')
      .then((r) => live && setServer({ days: r.days }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [local]);
  const days = server ? server.days : local;
  const goal = tiers[tiers.length - 1]?.days ?? 20;
  const ready = tiers.map((t, i) => (days >= t.days && !seasonTierClaimed(s, i) ? i : -1)).filter((i) => i >= 0);
  const railRef = useRef<HTMLOListElement>(null);
  const firstOpen = Math.max(0, tiers.findIndex((_, i) => !seasonTierClaimed(s, i)));
  useEffect(() => {
    const el = railRef.current?.children[firstOpen] as HTMLElement | undefined;
    if (el && railRef.current) railRef.current.scrollLeft = Math.max(0, el.offsetLeft - 24);
  }, [firstOpen]);

  function claimAll() {
    let coins = 0;
    for (const i of ready) if (claimSeasonTier(i, days)) coins += tiers[i].coins ?? 0;
    toast(coins ? `Prêmios da temporada! +${coins} sementes` : 'Prêmios da temporada guardados!');
  }

  return (
    <section className="season season-pass" style={{ ['--s1' as string]: season.c[0], ['--s2' as string]: season.c[1] }} aria-label={`Temporada: ${season.name}`}>
      <div className="season-rays" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <span className="season-emoji" aria-hidden="true">
          <Glyph e={season.emoji} size={52} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] opacity-90">Temporada de {MONTHS[m]}</p>
          <p className="font-display text-[22px] font-bold leading-tight">{season.name}</p>
          <p className="text-[13px] font-bold opacity-90">
            {Math.min(days, goal)}/{goal} dias ativos · trilha grátis
          </p>
        </div>
      </div>
      <ol ref={railRef} className="season-rail relative" aria-label="Trilha da temporada">
        {tiers.map((t, i) => {
          const got = seasonTierClaimed(s, i);
          const open = days >= t.days;
          return (
            <li key={i} className={`season-node ${got ? 'is-got' : open ? 'is-ready' : ''}`}>
              <span className="season-day">{t.days}d</span>
              <button className="season-prize" disabled={!open || got} onClick={() => claimSeasonTier(i, days) && toast(tierText(t) + '!')} aria-label={`Degrau ${i + 1}: ${tierText(t)}${got ? ', pego' : open ? ', pronto para pegar' : `, abre com ${t.days} dias ativos`}`}>
                {t.chest ? <Chest kind={t.chest} size={34} /> : t.fragments ? <Glyph e="💎" size={28} /> : <Seed size={26} />}
                <small>{t.chest ? (t.coins ? `+${t.coins}` : 'Baú') : t.fragments ? `+${t.fragments}` : `+${t.coins}`}</small>
                {got && <span className="season-check">✓</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-bold opacity-90">Cada dia com uma missão feita conta. Sem pressa: a trilha fica aberta o mês todo.</p>
        {ready.length > 0 && (
          <button className="season-btn shrink-0" onClick={claimAll}>
            Pegar {ready.length > 1 ? `(${ready.length})` : ''}
          </button>
        )}
      </div>
    </section>
  );
}

function tierText(t: SeasonTier): string {
  const parts: string[] = [];
  if (t.coins) parts.push(`+${t.coins} sementes`);
  if (t.fragments) parts.push(`+${t.fragments} fragmentos`);
  if (t.chest) parts.push(gameCfg().chests[t.chest].name);
  return parts.join(' e ') || 'Prêmio';
}
