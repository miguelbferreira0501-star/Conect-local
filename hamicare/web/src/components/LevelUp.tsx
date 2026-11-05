// Nível novo em tela cheia: brilho, partículas, o Hami comemorando, o número e o prêmio.
// Quando o nível abre uma arena, vem a revelação: o Hami brilha, a arena aparece,
// depois a casa nova com os presentes, e você escolhe se muda agora ou explora depois.
import { useEffect, useState } from 'react';
import { ArenaScene } from './ArenaScene';
import { Chest } from './Chest';
import { Hamster } from './Hamster';
import { Room } from './Room';
import { ItemIcon } from './ItemIcon';
import { Seed, toast } from './ui';
import { itemById } from '../data/items';
import { arenaHouse } from '../data/arenas';
import { periodOf } from '../data/lines';
import { gameCfg } from '../lib/game';
import { homeArenaOf, moveHome, useApp, type Celebration } from '../lib/store';
import { prefersReducedMotion } from '../lib/util';
import { play } from '../lib/sound';

type LevelC = Extract<Celebration, { type: 'level' }>;
type Stage = 'nivel' | 'evolui' | 'arena' | 'casa';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.29) % 2.6,
  dur: 2.6 + (i % 5) * 0.5,
  size: 8 + (i % 4) * 4,
  kind: i % 3,
}));

function Particles() {
  return (
    <div className="lvl-particles" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span key={i} className={`lvl-p lvl-p-${p.kind}`} style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}

export function LevelUpScreen({ c, onClose }: { c: LevelC; onClose: () => void }) {
  const s = useApp();
  const cfg = gameCfg();
  const arena = c.arena ? cfg.arenas.find((a) => a.n === c.arena!.n) : undefined;
  const [stage, setStage] = useState<Stage>('nivel');
  const reduce = prefersReducedMotion();

  // Som de cada parte: a magia da evolução, a arena nova e a casa nova.
  useEffect(() => {
    if (stage === 'evolui') play('magia');
    else if (stage === 'arena') play('conquista');
    else if (stage === 'casa') play('bomdia');
  }, [stage]);

  // A evolução dura um instante e mostra a arena sozinha.
  useEffect(() => {
    if (stage !== 'evolui') return;
    const t = setTimeout(() => setStage('arena'), reduce ? 200 : 1900);
    return () => clearTimeout(t);
  }, [stage, reduce]);

  const pet = (mood: 'animado' | 'feliz', size: number, shine?: boolean) => <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={mood} size={size} shine={shine} label={s.pet.name} />;
  const gifts = (c.arena?.items ?? []).map(itemById).filter(Boolean);
  const already = arena ? homeArenaOf(s) === arena.n : false;

  function moveIn() {
    if (arena && moveHome(arena.n)) toast(`${s.pet.name} se mudou para ${arena.name}!`);
    onClose();
  }

  return (
    <div className={`lvl-screen lvl-${stage}`} role="dialog" aria-modal="true" aria-label={stage === 'nivel' ? `Nível ${c.level}` : arena ? `Arena nova: ${arena.name}` : 'Nível novo'}>
      {(stage === 'arena' || stage === 'casa') && arena && (
        <div className="lvl-arena-bg" aria-hidden="true" style={{ background: `linear-gradient(${arena.colors[0]}, ${arena.colors[1]})` }}>
          <div className="streak-rays lvl-rays" />
        </div>
      )}
      {(stage === 'nivel' || stage === 'evolui') && (
        <>
          <div className="streak-rays lvl-rays" aria-hidden="true" />
          <Particles />
        </>
      )}
      {stage !== 'casa' && stage !== 'nivel' && (
        <button className="lvl-skip" onClick={() => setStage('casa')}>
          Pular
        </button>
      )}

      {stage === 'nivel' && (
        <div className="relative grid justify-items-center gap-2 text-center">
          <div className="lvl-glow" aria-hidden="true" />
          <div className="streak-pet">{pet('animado', 190)}</div>
          <p className="lvl-word">NÍVEL</p>
          <p className="lvl-num">{c.level}</p>
          <p className="max-w-[300px] text-[16px] font-bold text-white/95">Cada cuidado seu fez isso acontecer. O {s.pet.name} está radiante!</p>
          {(c.coins ?? 0) > 0 && (
            <p className="lvl-reward">
              <Seed size={22} /> +{c.coins} sementes
            </p>
          )}
          <button className="btn welcome-btn mt-3 w-full" onClick={() => (arena ? setStage('evolui') : onClose())}>
            {arena ? 'Ver o que abriu' : 'Continuar'}
          </button>
        </div>
      )}

      {stage === 'evolui' && arena && (
        <div className="relative grid justify-items-center gap-3 text-center">
          <div className="lvl-evolve">{pet('animado', 200, true)}</div>
          <p className="font-display text-[26px] font-bold text-white">Algo novo está surgindo…</p>
          <div className="lvl-flash" aria-hidden="true" />
        </div>
      )}

      {stage === 'arena' && arena && (
        <div className="relative grid w-full justify-items-center gap-4 text-center">
          <div className="lvl-arena-pic" aria-hidden="true">
            <ArenaScene arena={arena.id} height="100%" fit="meet">
              <div className="lvl-arena-pet">{pet('animado', 96)}</div>
            </ArenaScene>
          </div>
          <div className="lvl-card w-full">
            <p className="eyebrow !text-[#8a63d2]">Arena {arena.n} aberta</p>
            <h1 className="font-display text-[30px] font-bold leading-tight text-[#2b2240]">{arena.name}</h1>
            <p className="text-[15px] font-semibold text-[#4b4560]">{arena.desc}</p>
            <button className="btn btn-primary mt-3 w-full" onClick={() => setStage('casa')}>
              Ver a casa nova
            </button>
          </div>
        </div>
      )}

      {stage === 'casa' && (
        <div className="relative grid w-full gap-3 self-end">
          <div className="lvl-card grid gap-3">
            {arena ? (
              <>
                <h2 className="text-center font-display text-[24px] font-bold leading-tight text-[#2b2240]">Sua casa em {arena.name}</h2>
                <Room house={arenaHouse(arena.n)} period={periodOf()} height={190}>
                  {pet('feliz', 92)}
                </Room>
                <div>
                  <p className="section-label !text-[#6b6480]">Presentes da arena</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(c.coins ?? 0) > 0 && (
                      <span className="reward-chip !bg-[#f3eefc] !text-[#2b2240]">
                        <Seed size={18} /> {c.coins}
                      </span>
                    )}
                    {c.arena?.chest && (
                      <span className="reward-chip !bg-[#f3eefc] !text-[#2b2240]">
                        <Chest kind={c.arena.chest} size={26} /> {cfg.chests[c.arena.chest].name}
                      </span>
                    )}
                    {gifts.map((it) => (
                      <span key={it!.id} className="reward-chip !bg-[#f3eefc] !text-[#2b2240]">
                        <ItemIcon item={it!} size={20} fur={s.pet.fur} /> {it!.name}
                      </span>
                    ))}
                  </div>
                  {c.arena?.chest && <p className="mt-2 text-[13px] font-semibold text-[#6b6480]">O baú grátis te espera na Loja, em Baús.</p>}
                </div>
                {already ? (
                  <button className="btn btn-primary w-full" onClick={onClose}>
                    Continuar
                  </button>
                ) : (
                  <div className="grid gap-2">
                    <button className="btn btn-primary w-full" onClick={moveIn}>
                      Morar aqui agora
                    </button>
                    <button className="btn btn-soft w-full" onClick={onClose}>
                      Explorar depois
                    </button>
                    <p className="text-center text-[13px] font-semibold text-[#6b6480]">A casa de agora fica guardada. Dá pra trocar quando quiser no Mapa das Arenas.</p>
                  </div>
                )}
              </>
            ) : (
              <button className="btn btn-primary w-full" onClick={onClose}>
                Continuar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
