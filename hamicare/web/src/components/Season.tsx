// Temporada do mês: um tema novo todo mês, com meta de dias ativos e prêmio.
import { useEffect, useRef, useState } from 'react';
import { X, Lock, Check, Zap, Clock, Crown } from 'lucide-react';
import { claimSeasonPlus, claimSeasonTier, isPremium, seasonDays, seasonPlusClaimed, seasonTierClaimed, useApp, SEASON_PLUS } from '../lib/store';
import { openUi } from '../lib/bus';
import { Hamster } from './Hamster';
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

/** Dias ativos no mês: com conta, vale a contagem do servidor. */
function useSeasonDays(s: State): number {
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
  return server ? server.days : local;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Temporada do mês: trilha grátis de degraus que abrem com dias ativos (sem pressa e sem contagem regressiva). */
export function SeasonBanner({ s }: { s: State }) {
  const m = new Date().getMonth();
  const season = SEASONS[m];
  const cfg = gameCfg();
  const tiers = cfg.season.tiers;
  const days = useSeasonDays(s);
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
            {Math.min(days, goal)}/{goal} dias ativos
          </p>
        </div>
        <button className="season-btn shrink-0" onClick={() => openUi('temporada')}>
          Ver trilha
        </button>
      </div>
      <ol ref={railRef} className="season-rail overflow-x-auto relative" aria-label="Trilha da temporada">
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

/** Trilha da temporada em tela cheia (estilo Finch): Grátis de um lado, Plus do outro, um dia por linha. */
export function SeasonPass({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const days = useSeasonDays(s);
  if (!open) return null;
  const now = new Date();
  const m = now.getMonth();
  const season = SEASONS[m];
  const tiers = gameCfg().season.tiers;
  const premium = isPremium(s);
  const kid = s.profile.ageGroup === 'ate12';
  const showPlus = premium || !kid;
  const end = new Date(now.getFullYear(), m + 1, 1).getTime() - now.getTime();
  const left = `${Math.floor(end / 86_400_000)}d ${Math.floor((end % 86_400_000) / 3_600_000)}h`;
  const nextIdx = tiers.findIndex((t) => days < t.days);
  const next = nextIdx < 0 ? null : tiers[nextIdx];
  const prev = nextIdx <= 0 ? 0 : tiers[nextIdx - 1].days;
  const pct = next ? (days - prev) / Math.max(1, next.days - prev) : 1;
  return (
    <div className="sp" role="dialog" aria-modal="true" aria-label={`Temporada: ${season.name}`}>
      <header className="sp-hero" style={{ ['--s1' as string]: season.c[0], ['--s2' as string]: season.c[1] }}>
        <button className="sp-close" onClick={onClose} aria-label="Fechar">
          <X size={22} strokeWidth={3.5} />
        </button>
        <span className="sp-emoji sp-emoji-a" aria-hidden="true"><Glyph e={season.emoji} size={74} /></span>
        <span className="sp-emoji sp-emoji-b" aria-hidden="true"><Glyph e={season.emoji} size={46} /></span>
        <span className="sp-pet" aria-hidden="true">
          <Hamster fur={s.pet.fur} phase={s.pet.phase} outfit={s.pet.outfit} size={128} idle={false} mood="feliz" label="" />
        </span>
        <p className="sp-kicker">Temporada de {MONTHS[m]}</p>
        <h2 className="sp-title">{season.name}</h2>
        <span className="sp-ends">
          <Clock size={22} />
          <span>
            <small>Termina em</small>
            <b>{left}</b>
          </span>
        </span>
        {showPlus && (
          <button className="sp-plus" onClick={() => (onClose(), openUi('plus'))}>
            <i>{premium ? 'Ativo' : 'Ativar'}</i>
            HamiCare <em>PLUS</em>
          </button>
        )}
      </header>
      <div className="sp-bar">
        <Zap size={26} fill="#F5B82E" strokeWidth={0} />
        <span className="sp-meter" role="progressbar" aria-label="Dias ativos" aria-valuemin={0} aria-valuemax={next?.days ?? days} aria-valuenow={days}>
          <span style={{ width: `${Math.max(8, Math.min(100, pct * 100))}%` }} />
          <b>{next ? `${days} / ${next.days} dias` : 'Trilha completa!'}</b>
        </span>
        <span className="sp-arrow" aria-hidden="true">▶</span>
        <span className="sp-next">{next ? nextIdx + 1 : '★'}</span>
      </div>
      <div className={`sp-grid ${showPlus ? '' : 'is-solo'}`}>
        <div className="sp-heads">
          <span className="sp-free">Grátis</span>
          {showPlus && <span className="sp-plusflag"><Crown size={15} /> Plus</span>}
        </div>
        {tiers.map((t, i) => {
          const openTier = days >= t.days;
          const got = seasonTierClaimed(s, i);
          const gotPlus = seasonPlusClaimed(s, i);
          return (
            <div key={i} className={`sp-row ${openTier ? 'is-open' : ''}`}>
              <button
                className={`sp-tile ${got ? 'is-got' : openTier ? 'is-ready' : ''}`}
                disabled={got}
                onClick={() => (openTier ? claimSeasonTier(i, days) && toast(tierText(t) + '!') : toast(`Abre com ${t.days} ${t.days === 1 ? 'dia ativo' : 'dias ativos'} no mês.`))}
                aria-label={`Dia ${t.days}, grátis: ${tierText(t)}${got ? ', pego' : openTier ? ', pronto para pegar' : ''}`}
              >
                {t.chest ? <Chest kind={t.chest} size={50} /> : t.fragments ? <Glyph e="💎" size={44} /> : <Seed size={40} />}
                <small>{t.chest ? (t.coins ? `+${t.coins}` : 'Baú') : t.fragments ? `+${t.fragments}` : `+${t.coins}`}</small>
                {got && <span className="sp-check"><Check size={18} strokeWidth={4} /></span>}
              </button>
              <span className="sp-day">
                <small>Dia</small>
                <b>{t.days}</b>
              </span>
              {showPlus && i < SEASON_PLUS.length ? (
                <button
                  className={`sp-tile is-plus ${gotPlus ? 'is-got' : premium && openTier ? 'is-ready' : ''}`}
                  disabled={gotPlus}
                  onClick={() => {
                    if (!premium) return void (onClose(), openUi('plus'));
                    if (!openTier) return void toast(`Abre com ${t.days} ${t.days === 1 ? 'dia ativo' : 'dias ativos'} no mês.`);
                    const c = claimSeasonPlus(i, days);
                    if (c) toast(`+${c} sementes do Plus!`);
                  }}
                  aria-label={`Dia ${t.days}, Plus: ${SEASON_PLUS[i]} sementes${gotPlus ? ', pego' : !premium ? ', só com Plus' : openTier ? ', pronto para pegar' : ''}`}
                >
                  <Seed size={40} />
                  <small>+{SEASON_PLUS[i]}</small>
                  {gotPlus ? <span className="sp-check"><Check size={18} strokeWidth={4} /></span> : !premium ? <span className="sp-lock"><Lock size={16} strokeWidth={3} /></span> : null}
                </button>
              ) : showPlus ? (
                <span />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="sp-foot">Cada dia com pelo menos uma missão feita conta um dia na trilha.</p>
    </div>
  );
}
