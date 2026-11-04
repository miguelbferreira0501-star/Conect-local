// Desafios em linha do tempo: ícone colorido, barrinha com "0 / 1" e o botão de pegar o prêmio.
import { claimKey, questProgress, type QuestDef } from '../logic/progress';
import { claimQuest } from '../lib/store';
import { toast } from './ui';
import type { State } from '../types';
import { Glyph } from './art';

const LOOK: Record<string, { emoji: string; tint: string }> = {
  tarefas3: { emoji: '🏁', tint: '#FFE39A' },
  mover1: { emoji: '🏃', tint: '#CDEFC0' },
  cuidar2: { emoji: '🐹', tint: '#FFD6E2' },
  humor: { emoji: '🫶', tint: '#E6DBFF' },
  pote: { emoji: '🫙', tint: '#D3EAFF' },
  vibe: { emoji: '💛', tint: '#FFEBB3' },
  respirar: { emoji: '🧘', tint: '#CFF1E6' },
  ativos5: { emoji: '📅', tint: '#FFE39A' },
  mover3: { emoji: '👟', tint: '#CDEFC0' },
  diario3: { emoji: '📔', tint: '#FFDCC7' },
  aventura1: { emoji: '🗺️', tint: '#D3EAFF' },
  cuidado20: { emoji: '🛁', tint: '#E6DBFF' },
  mover12: { emoji: '🏅', tint: '#FFE39A' },
};

export function QuestList({ quests, s, today }: { quests: QuestDef[]; s: State; today: string }) {
  return (
    <ol className="quest-list">
      {quests.map((q) => {
        const p = questProgress(q, s.days, today);
        const claimed = !!s.claimed[claimKey(q, today)];
        const look = LOOK[q.id] ?? { emoji: '⭐', tint: '#FFE39A' };
        return (
          <li key={q.id} className="quest" data-done={claimed}>
            <span className="quest-dot" aria-hidden="true">
              {claimed ? '✓' : ''}
            </span>
            <div className="quest-card">
              <span className="quest-ico" style={{ background: look.tint }} aria-hidden="true">
                <Glyph e={look.emoji} size={34} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-extrabold leading-tight">{q.title}</p>
                <div className="quest-bar" role="progressbar" aria-label={q.title} aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={p}>
                  <div className="quest-fill" style={{ width: `${Math.max(12, (p / q.target) * 100)}%` }} />
                  <span>
                    {p} / {q.target}
                  </span>
                </div>
              </div>
              {claimed ? (
                <span className="text-[13px] font-extrabold text-leaf">Feito ✓</span>
              ) : (
                p >= q.target && (
                  <button className="check3d quest-claim" onClick={() => claimQuest(q.id) && toast(`+${q.coins} sementes e +${q.xp} XP!`)} aria-label={`Pegar prêmio: ${q.title}`}>
                    +{q.coins} <Glyph e="🌻" size={18} />
                  </button>
                )
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
