// Prêmio por amigo: cada amigo novo vale mais sementes que o anterior (até o 5º). O servidor confere as amizades.
import { Glyph } from './art';
import { Seed, toast } from './ui';
import { play } from '../lib/sound';
import { claimFriendReward, friendRewardClaimed, useApp } from '../lib/store';
import { FRIEND_LADDER } from '../shared/game';

export function FriendLadder({ friends, onInvite }: { friends: number; onInvite?: () => void }) {
  const s = useApp();
  const all = FRIEND_LADDER.every((_, i) => friendRewardClaimed(s, i + 1));
  if (all) return null;
  return (
    <section className="ladder-card" aria-label="Prêmios por amigo">
      <div className="flex items-center gap-2">
        <Glyph e="💌" size={30} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-bold leading-tight">Convide amigos e ganhe</h2>
          <p className="text-[12.5px] font-bold text-muted">Cada amigo novo vale mais que o anterior.</p>
        </div>
        {onInvite && (
          <button className="btn btn-primary btn-sm" onClick={onInvite}>
            Convidar
          </button>
        )}
      </div>
      <ol className="ladder">
        {FRIEND_LADDER.map((coins, i) => {
          const n = i + 1;
          const got = friendRewardClaimed(s, n);
          const ready = friends >= n && !got;
          return (
            <li key={n} className={`ladder-step ${got ? 'is-got' : ready ? 'is-ready' : ''}`}>
              <span className="ladder-n">{n}º</span>
              <span className="ladder-coins">
                <Seed size={11} /> {coins}
              </span>
              {ready ? (
                <button
                  className="ladder-btn"
                  data-sound="none"
                  onClick={() => {
                    const got2 = claimFriendReward(n, friends);
                    if (got2) {
                      play('semente');
                      toast(`+${got2} sementes pelo ${n}º amigo!`);
                    }
                  }}
                >
                  Pegar
                </button>
              ) : (
                <span className="ladder-state">{got ? '✓' : '🔒'}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
