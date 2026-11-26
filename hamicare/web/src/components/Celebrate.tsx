// Momentos grandes: boas-vindas do dia, ofensiva com raios de sol, meta da jornada,
// resumo da semana, nível, fase e conquista. Um de cada vez, em tela cheia ou janela.
import { useEffect, useState } from 'react';
import { Hamster } from './Hamster';
import { Modal } from './ui';
import { AFFIRMATIONS, JOURNEY_TEXT } from '../data/lines';
import { PHASES } from '../logic/evolution';
import { streakOf } from '../logic/streak';
import { minor, sinceStart, todayKey, useApp, type Celebration } from '../lib/store';
import { addDays, dayDiff, fmtNum, hashStr, weekStart, WEEKDAYS } from '../lib/util';
import { isActive } from '../logic/evolution';
import type { Photo } from '../types';
import { Glyph } from './art';

const DAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
/** Fundo vivo e liso de cada dia da semana. */
const DAY_BG = ['#EE7BA2', '#4F9FE0', '#4DB46C', '#4A97DB', '#F0A23A', '#EF7E5A', '#2FB0A3'];

/** Cartão ilustrado da afirmação: céu, montanhas, sol nascendo e o pet no alto da pedra. */
function AffirmationCard({ text, pet }: { text: string; pet: React.ReactNode }) {
  const words = text.replace(/[.!]$/, '').split(' ');
  const cut = Math.max(1, Math.ceil(words.length * 0.55));
  const end = /[.!]$/.test(text) ? text.slice(-1) : '';
  return (
    <div className="fw-card">
      <div className="fw-card-in">
        <svg className="fw-card-art" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="300" height="300" fill="#7CC4EE" />
          <circle cx="232" cy="236" r="96" fill="#A9D3C9" opacity="0.55" />
          <circle cx="232" cy="236" r="70" fill="#C7D7A6" opacity="0.6" />
          <circle cx="232" cy="236" r="44" fill="#F5B562" />
          <g fill="#FFFFFF" opacity="0.9">
            <ellipse cx="40" cy="180" rx="34" ry="14" />
            <ellipse cx="62" cy="172" rx="22" ry="14" />
            <ellipse cx="272" cy="150" rx="24" ry="9" />
            <ellipse cx="150" cy="196" rx="26" ry="9" />
          </g>
          <path d="M60 300 L150 196 L214 262 L250 222 L300 270 V300Z" fill="#C9CED6" />
          <path d="M150 196 L176 226 L160 222 L148 234 L138 214Z" fill="#FFFFFF" />
          <path d="M170 300 L232 240 L300 290 V300Z" fill="#B3BAC4" />
          <g fill="#3E9A4E">
            <path d="M218 262 l8 -20 l8 20z" />
            <path d="M244 280 l7 -18 l7 18z" />
            <path d="M200 282 l6 -15 l6 15z" />
          </g>
          <path d="M150 300 Q220 280 300 286 V300Z" fill="#6FCFCB" />
          <path d="M0 300 V236 Q40 214 96 226 Q132 236 150 262 L160 300Z" fill="#5A5E66" />
          <path d="M0 250 Q44 230 92 240" stroke="#71757E" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
        <p className="fw-card-kicker">Afirmação do dia</p>
        <p className="fw-card-text">
          {words.slice(0, cut).join(' ')} <span>{words.slice(cut).join(' ')}{end}</span>
        </p>
        <span className="fw-card-pet">{pet}</span>
      </div>
    </div>
  );
}

/**
 * Abertura do dia em duas telas de cor viva: boas-vindas com a afirmação do dia num cartão
 * ilustrado e, depois, a sequência com raios de sol, a semana e os martelinhos que salvaram dias.
 */
export function DailyWelcome({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const today = todayKey();
  const dow = new Date(`${today}T12:00:00`).getDay();
  const n = sinceStart(s) + 1;
  const st = streakOf(s.days, today, s.createdAt);
  const [step, setStep] = useState<0 | 1>(0);
  const [shown, setShown] = useState(Math.max(0, st.count - 1));
  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(() => setShown(st.count), 500);
    return () => clearTimeout(t);
  }, [step, st.count]);
  const aff = AFFIRMATIONS[hashStr(`${s.seed}:${today}`) % AFFIRMATIONS.length];
  const art = dow === 0 || dow === 6 ? 'ao' : 'à';
  // Semana de seg a dom (como a da imagem), com dias feitos, salvos pelo martelinho e de descanso.
  const start = addDays(today, -((dow + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const kind = (k: string) => (isActive(s.days[k]) ? 'ok' : s.days[k]?.repaired ? 'fix' : st.rested.includes(k) ? 'rest' : dayDiff(k, today) < 0 ? 'next' : dayDiff(k, today) === 0 ? 'today' : 'miss');
  const kinds = week.map(kind);
  const saved = kinds.includes('fix');
  const filledIdx = kinds.map((k, i) => (k === 'ok' || k === 'fix' || k === 'rest' ? i : -1)).filter((i) => i >= 0);
  const msg = saved ? `Ufa... sua sequência foi salva desta vez! Visite o ${s.pet.name} todo dia para continuar.` : st.count >= 2 ? `Você voltou de novo! Visite o ${s.pet.name} todo dia para a sequência continuar.` : `Um dia de cada vez. Visite o ${s.pet.name} amanhã para começar uma sequência.`;
  const pet = (mood: 'animado' | 'feliz', size: number) => <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={mood} size={size} />;
  return (
    <div className="fw" role="dialog" aria-modal="true" aria-label="Boas-vindas do dia" style={{ ['--fw' as string]: DAY_BG[dow] }}>
      {step === 0 && (
        <div className="fw-step" key="a">
          <p className="fw-day">Dia {n}</p>
          <h1 className="fw-title">
            Boas-vindas {art} {DAY_FULL[dow]}!
          </h1>
          <AffirmationCard text={aff} pet={pet('feliz', 120)} />
          <Glyph e="⚡" size={46} />
          <p className="fw-help">Ajude o {s.pet.name} a ganhar toda a energia hoje para sair em aventura e crescer!</p>
          <button className="fw-btn" onClick={() => setStep(1)}>
            Começar hoje
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="fw-step" key="b">
          <span className="fw-rays" aria-hidden="true" />
          <span className="fw-pet">{pet('animado', 190)}</span>
          <p className="fw-num">{shown}</p>
          <p className="fw-label">{st.count === 1 ? 'Dia seguido' : 'Dias seguidos'}</p>
          <div className="fw-week" aria-label="Semana da sequência">
            {filledIdx.length > 0 && <span className="fw-track" style={{ left: `calc(${(filledIdx[0] / 7) * 100}% + 4px)`, width: `calc(${((filledIdx[filledIdx.length - 1] - filledIdx[0] + 1) / 7) * 100}% - 8px)` }} />}
            {week.map((k, i) => (
              <div key={k} className="fw-wd">
                <small>{DAY_FULL[new Date(`${k}T12:00:00`).getDay()].slice(0, 1)}</small>
                <span className={`fw-dot is-${kinds[i]}`}>{kinds[i] === 'ok' ? '✓' : kinds[i] === 'fix' ? <Glyph e="🔨" size={30} /> : kinds[i] === 'rest' ? <Glyph e="💤" size={20} /> : ''}</span>
              </div>
            ))}
          </div>
          <p className="fw-msg">{msg}</p>
          <button className="fw-btn" onClick={onClose}>
            Vamos lá!
          </button>
        </div>
      )}
    </div>
  );
}

/** Ofensiva: tela cheia com raios girando, o Lumbi pulando e a semana marcada. */
export function StreakScreen({ count, hammer, onClose, onShare }: { count: number; hammer?: boolean; onClose: () => void; onShare: (p: Photo) => void }) {
  const s = useApp();
  const today = todayKey();
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));
  const st = streakOf(s.days, today, s.createdAt);
  const share = () =>
    onShare({ id: `ofensiva-${today}`, date: today, caption: `🔥 ${count} ${count === 1 ? 'dia' : 'dias'} seguidos com o ${s.pet.name}!`, scene: 'ofensiva', snap: { fur: s.pet.fur, grams: s.pet.grams, phase: s.pet.phase, outfit: s.pet.outfit, mood: 'animado' } });
  return (
    <div className="streak-screen" role="dialog" aria-modal="true" aria-label={`Ofensiva de ${count} dias`}>
      <div className="streak-rays" aria-hidden="true" />
      <div className="relative grid justify-items-center gap-2 text-center">
        <div className="streak-pet">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={200} />
        </div>
        <p className="streak-num">
          <Glyph e="🔥" size={54} /> {count}
        </p>
        <p className="font-display text-[28px] font-bold leading-tight text-white">{count === 1 ? 'Primeiro dia da ofensiva!' : `${count} dias seguidos!`}</p>
        <p className="max-w-[300px] text-[15px] font-bold text-white/90">Você apareceu por você hoje. O {s.pet.name} está orgulhoso (e pulando de alegria).</p>
        {hammer && (
          <p className="streak-hammer">
            <Glyph e="🔨" size={26} /> Ganhou um martelinho! Ele conserta a ofensiva se você faltar um dia.
          </p>
        )}
        <div className="mt-2 grid grid-cols-7 gap-1.5 rounded-3xl bg-white/20 p-3">
          {week.map((k) => (
            <div key={k} className="grid justify-items-center gap-1 text-[11px] font-black uppercase text-white">
              {WEEKDAYS[new Date(`${k}T12:00:00`).getDay()]}
              <span className={`streak-dot ${isActive(s.days[k]) ? 'is-on' : st.rested.includes(k) ? 'is-rest' : ''}`}>{isActive(s.days[k]) ? '✓' : st.rested.includes(k) ? <Glyph e="💤" size={16} /> : ''}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid w-full gap-2">
          <button className="btn welcome-btn" onClick={onClose}>
            Continuar
          </button>
          <button className="btn streak-share" onClick={share}>
            Compartilhar com amigos
          </button>
        </div>
      </div>
    </div>
  );
}

const SCENE: Record<string, [string, string, string, string]> = {
  accent: ['#C7B5F3', '#FFE3EA', '#9FD58A', '#86C774'],
  gold: ['#FFD27A', '#FFF3D2', '#A9D98A', '#8CC870'],
  leaf: ['#9FD6FF', '#E6F6FF', '#9ED789', '#7FC66C'],
};
/** Fundo das comemorações: céu suave, sol com brilho atrás do pet, nuvens, morrinhos e flores (sem listras). */
function CelebrateScene({ tone }: { tone: string }) {
  const [sky1, sky2, hill1, hill2] = SCENE[tone] ?? SCENE.accent;
  return (
    <svg className="cel-scene" viewBox="0 0 360 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`cs-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky1} />
          <stop offset="1" stopColor={sky2} />
        </linearGradient>
        <radialGradient id={`csg-${tone}`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#FFF6D8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="260" fill={`url(#cs-${tone})`} />
      <circle className="cel-glow" cx="180" cy="130" r="120" fill={`url(#csg-${tone})`} />
      <circle cx="180" cy="150" r="58" fill="#FFD36B" opacity="0.55" />
      <g className="cel-cloud" fill="#FFFFFF" opacity="0.9">
        <ellipse cx="62" cy="58" rx="30" ry="11" />
        <ellipse cx="76" cy="50" rx="18" ry="11" />
        <ellipse cx="296" cy="86" rx="26" ry="9" />
        <ellipse cx="308" cy="79" rx="15" ry="9" />
      </g>
      <path d="M0 200 Q90 168 180 186 T360 178 V260 H0Z" fill={hill1} />
      <path d="M0 226 Q120 206 240 218 T360 214 V260 H0Z" fill={hill2} />
      {[[40, 206, '#FF8FB8'], [72, 222, '#FFFFFF'], [300, 204, '#FFD34D'], [330, 222, '#FF8FB8'], [262, 230, '#FFFFFF']].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 3.6} cy={Math.sin((a * Math.PI) / 180) * 3.6} r="2.8" fill={c as string} />
          ))}
          <circle r="2" fill="#FFB347" />
        </g>
      ))}
      {[[110, 70], [250, 44], [150, 36], [220, 100]].map(([x, y], i) => (
        <path key={i} className="cel-spark" style={{ animationDelay: `${i * 0.5}s` }} transform={`translate(${x} ${y})`} d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5Z" fill="#FFFFFF" />
      ))}
    </svg>
  );
}

/** As outras comemorações, numa janela central com um cenário ilustrado no topo. */
export function CelebrationModal({ c, onClose }: { c: Celebration | undefined; onClose: () => void }) {
  const s = useApp();
  if (!c || c.type === 'streak' || c.type === 'level') return null;
  const hide = minor(s) || s.body.hideNumbers;
  const t = JOURNEY_TEXT[s.journey.dir];
  const content: { title: string; text: string; tone: string; icon?: string } =
    c.type === 'grow'
      ? { title: `O ${s.pet.name} cresceu!`, text: `Agora ${c.stage >= 7 ? 'ele é um' : 'ele está na fase'} ${c.name}. Cada dia de cuidado faz ele crescer mais um pouquinho.`, tone: 'leaf' }
      : c.type === 'phase'
      ? { title: `Fase ${PHASES[c.phase]}!`, text: `O ${s.pet.name} evoluiu junto com você. Constância é tudo!`, tone: 'leaf' }
      : c.type === 'achievement'
        ? { title: c.title, icon: c.emoji, text: `Conquista nova! +${c.coins} sementes de girassol.`, tone: 'accent' }
        : c.type === 'goal'
          ? { title: 'Meta alcançada!', icon: '🏆', text: `Vocês conseguiram! O ${s.pet.name} chegou na meta dele junto com você. Escolha a próxima missão em Nossa evolução: manter o peso também é uma vitória.`, tone: 'gold' }
          : {
              title: 'Resumo da semana',
              text: hide
                ? `Mais uma semana de jornada com o ${s.pet.name}. Vocês seguem juntos!`
                : `${t.sign}${fmtNum(c.kcal, 0)} kcal nesta semana. O ${s.pet.name} foi de ${fmtNum(c.before)} g para ${fmtNum(c.grams)} g. Devagar e sempre, junto com você.`,
              tone: 'accent',
            };
  return (
    <Modal open onClose={onClose} label={content.title}>
      <div className={`celebrate celebrate-${content.tone}`}>
        <CelebrateScene tone={content.tone} />
        <div className="relative grid justify-items-center gap-2 p-6 text-center">
          <div className="evolve-pop">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={170} />
          </div>
          {content.icon && <Glyph e={content.icon} size={48} />}
          <h2 className="font-display text-[27px] font-bold leading-tight">{content.title}</h2>
          <p className="text-[15px] font-semibold">{content.text}</p>
          <button className="btn btn-primary mt-2 w-full" onClick={onClose}>
            Que demais!
          </button>
        </div>
      </div>
    </Modal>
  );
}
