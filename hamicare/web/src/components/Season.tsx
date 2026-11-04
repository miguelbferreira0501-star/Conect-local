// Temporada do mês: um tema novo todo mês, com meta de dias ativos e prêmio.
import { claimSeason, seasonProgress, SEASON_GOAL } from '../lib/store';
import { toast } from './ui';
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

export function SeasonBanner({ s }: { s: State }) {
  const m = new Date().getMonth();
  const season = SEASONS[m];
  const { days, claimed } = seasonProgress(s);
  const pct = Math.min(100, (days / SEASON_GOAL) * 100);
  return (
    <section className="season" style={{ ['--s1' as string]: season.c[0], ['--s2' as string]: season.c[1] }} aria-label={`Temporada: ${season.name}`}>
      <div className="season-rays" aria-hidden="true" />
      <span className="season-emoji" aria-hidden="true">
        <Glyph e={season.emoji} size={64} />
      </span>
      <div className="relative grid gap-1">
        <p className="text-[12px] font-black uppercase tracking-[0.12em] opacity-90">Temporada de {MONTHS[m]}</p>
        <p className="font-display text-[23px] font-bold leading-tight">{season.name}</p>
        <div className="season-track" role="progressbar" aria-label="Dias ativos na temporada" aria-valuemin={0} aria-valuemax={SEASON_GOAL} aria-valuenow={days}>
          <div className="season-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold opacity-90">
            {days}/{SEASON_GOAL} dias ativos · prêmio: 120 sementes
          </p>
          {claimed ? (
            <span className="rounded-full bg-white/30 px-3 py-1 text-[13px] font-black">Selo ganho ✓</span>
          ) : (
            <button className="season-btn" disabled={days < SEASON_GOAL} onClick={() => claimSeason() && toast('Selo da temporada! +120 sementes')}>
              Pegar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
