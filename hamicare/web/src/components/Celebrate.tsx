// Momentos grandes: boas-vindas do dia, ofensiva com raios de sol, meta da jornada,
// resumo da semana, nível, fase e conquista. Um de cada vez, em tela cheia ou janela.
import { useEffect, useState } from 'react';
import { Hamster } from './Hamster';
import { useGrowth } from './Growth';
import { Modal } from './ui';
import { AFFIRMATIONS, JOURNEY_TEXT } from '../data/lines';
import { PHASES } from '../logic/evolution';
import { streakOf } from '../logic/streak';
import { minor, sinceStart, todayKey, useApp, type Celebration } from '../lib/store';
import { addDays, dayDiff, fmtNum, hashStr, weekStart, WEEKDAYS } from '../lib/util';
import { isActive } from '../logic/evolution';
import type { Photo } from '../types';
import { Glyph } from './art';

const DAY_NAMES = ['Domingo Doce', 'Segunda Serena', 'Terça Tranquila', 'Quarta Querida', 'Quinta Quentinha', 'Sexta Sorridente', 'Sábado Sossegado'];
const DAY_COLORS: [string, string][] = [
  ['#FFB0C8', '#FF7FA3'],
  ['#9FD2FF', '#5DA8F5'],
  ['#B9E8A8', '#5FBF7A'],
  ['#D2BCFF', '#9A72F0'],
  ['#FFD98A', '#FFAE45'],
  ['#FFC4A8', '#FF8A65'],
  ['#A8E6E0', '#3FB8AC'],
];

/** Cenário fofo das telas de abertura: nuvens, bolinhas, corações e estrelas flutuando e um morrinho florido. */
function DwDecor() {
  const floaters = ['♥', '✦', '★', '♥', '✿', '✦', '♥', '★', '✿', '♥'];
  return (
    <div className="dw-decor" aria-hidden="true">
      <span className="dw-dots" />
      <span className="dw-cloud dw-cloud-1" />
      <span className="dw-cloud dw-cloud-2" />
      <span className="dw-cloud dw-cloud-3" />
      {floaters.map((c, i) => (
        <span key={i} className="dw-float" style={{ left: `${6 + ((i * 37) % 88)}%`, animationDelay: `${(i * 0.9) % 7}s`, fontSize: `${14 + (i % 3) * 6}px` }}>
          {c}
        </span>
      ))}
      <svg className="dw-hill" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 60 Q100 20 200 46 T400 40 V120 H0Z" fill="#FFFFFF" opacity="0.22" />
        <path d="M0 84 Q120 56 240 76 T400 70 V120 H0Z" fill="#FFFFFF" opacity="0.32" />
        {[[40, 80], [96, 72], [300, 74], [356, 78], [180, 82]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect x="-1" y="0" width="2" height="12" fill="#6FB868" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r="3.4" fill={['#FF9FC2', '#FFE27A', '#FFFFFF', '#C9B6FF', '#9FD8FF'][i]} />
            ))}
            <circle r="2.4" fill="#FFB347" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Abertura do dia (estilo Catzy), em três passos: os dias juntos com o contador subindo,
 * a sequência de 7 dias com corações e o crescimento do Hami.
 */
export function DailyWelcome({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const today = todayKey();
  const dow = new Date(`${today}T12:00:00`).getDay();
  const n = sinceStart(s) + 1;
  const streak = streakOf(s.days, today, s.createdAt);
  const g = useGrowth(s);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [shown, setShown] = useState(Math.max(0, n - 1));
  useEffect(() => {
    const t = setTimeout(() => setShown(n), 900);
    return () => clearTimeout(t);
  }, [n]);
  const away = s.welcomed ? dayDiff(s.welcomed, today) : 0;
  const hello = n === 1 ? 'Nosso primeiro dia juntos!' : away > 1 ? 'Senti um pouquinho a sua falta. Só um pouquinho.' : 'Que bom te ver de novo!';
  // Ciclo de 7 dias: quantos corações já estão cheios nesta volta.
  const filled = streak.count === 0 ? 0 : ((streak.count - 1) % 7) + 1;
  const first = addDays(today, -(filled > 0 && isActive(s.days[today]) ? filled - 1 : filled));
  const line =
    streak.count >= 2
      ? `Depois de ${streak.count} dias, você está cada vez mais perto da pessoa que quer ser.`
      : `“${AFFIRMATIONS[hashStr(`${s.seed}:${today}`) % AFFIRMATIONS.length]}”`;
  const [a, b] = DAY_COLORS[dow];
  return (
    <div className="welcome dw" role="dialog" aria-modal="true" aria-label="Boas-vindas do dia" style={{ ['--w1' as string]: a, ['--w2' as string]: b }}>
      <DwDecor />
      {step === 0 && (
        <div className="dw-step">
          <p className="dw-kicker">{DAY_NAMES[dow]}</p>
          <p className="dw-hello">{hello}</p>
          <div className="dw-heart">
            <svg viewBox="0 0 200 180" aria-hidden="true">
              <defs>
                <linearGradient id="dwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFD3E4" />
                  <stop offset="1" stopColor="#FF9FC2" />
                </linearGradient>
                <pattern id="dwp" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="9" cy="9" r="2.6" fill="#FFFFFF" opacity="0.45" />
                </pattern>
              </defs>
              <path d="M100 172 C40 128 12 94 12 58 C12 28 36 8 62 8 C80 8 92 18 100 32 C108 18 120 8 138 8 C164 8 188 28 188 58 C188 94 160 128 100 172 Z" fill="#FFFFFF" />
              <path d="M100 164 C44 122 20 92 20 58 C20 33 40 16 62 16 C79 16 92 26 100 42 C108 26 121 16 138 16 C160 16 180 33 180 58 C180 92 156 122 100 164 Z" fill="url(#dwh)" />
              <path d="M100 164 C44 122 20 92 20 58 C20 33 40 16 62 16 C79 16 92 26 100 42 C108 26 121 16 138 16 C160 16 180 33 180 58 C180 92 156 122 100 164 Z" fill="url(#dwp)" />
              <path d="M44 46 C48 34 60 28 70 30" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8" />
            </svg>
            <span className="dw-star dw-star-1">★</span>
            <span className="dw-star dw-star-2">★</span>
            <span className="dw-star dw-star-3">✦</span>
            <span className="dw-pet">
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={150} />
            </span>
          </div>
          <div className="dw-badge">
            <p key={shown} className="dw-count">{shown}</p>
            <p className="dw-ribbon">
              <span>{shown === 1 ? 'dia junto' : 'dias juntos'}</span>
            </p>
          </div>
          <button className="dw-btn" onClick={() => setStep(1)}>
            Começar hoje
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="dw-step">
          <h1 className="dw-title">Sequência de 7 dias</h1>
          <p className="dw-fire">
            <Glyph e="🔥" size={22} /> {streak.count} {streak.count === 1 ? 'dia seguido' : 'dias seguidos'}
          </p>
          <div className="dw-talk">
            <p>{line}</p>
          </div>
          <ol className="dw-week" aria-label={`${filled} de 7 dias desta sequência`}>
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i} className={i < filled ? 'is-on' : ''}>
                <small>{WEEKDAYS[new Date(`${addDays(first, i)}T12:00:00`).getDay()].slice(0, 1).toUpperCase()}</small>
                <span>♥</span>
              </li>
            ))}
          </ol>
          <p className="dw-note">Cuide de você aos poucos por 7 dias. Cada vez que completar um ciclo, uma sequência nova começa{streak.count >= 1 ? ' e você ganha um martelinho' : ''}.</p>
          <div className="dw-stage" aria-hidden="true">
            <span className="dw-cushion" />
            <span className="dw-stage-pet">
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={180} />
            </span>
            <span className="dw-bubble">🔥 {streak.count}</span>
          </div>
          <button className="dw-btn" onClick={() => setStep(2)}>
            Vamos começar!
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="dw-step">
          <p className="dw-hello">Seus cuidados de cada dia fazem o {s.pet.name} crescer, mais forte e saudável.</p>
          <div className="dw-grow">
            <span className="dw-sun" aria-hidden="true" />
            <span className="dw-ruler" aria-hidden="true" />
            <span className="dw-pot" aria-hidden="true">🌱</span>
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={170} />
          </div>
          <div className="dw-card">
            <p className="dw-card-name">
              <span aria-hidden="true">🌱</span> {g.name}
              {g.next && <small> → {g.next.name}</small>}
            </p>
            <span className="dw-card-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(6, Math.round(g.progress * 100))}%` }} />
            </span>
            <p className="dw-card-note">{g.next ? `Cresce de novo com mais ${g.toNext} ${g.toNext === 1 ? 'dia' : 'dias'} de cuidado.` : 'Ele já está do tamanho máximo. Que orgulho!'}</p>
          </div>
          <button className="dw-btn" onClick={onClose}>
            Bora, {s.pet.name}!
          </button>
        </div>
      )}
    </div>
  );
}

/** Ofensiva: tela cheia com raios girando, o Hami pulando e a semana marcada. */
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

/** As outras comemorações, numa janela central com raios suaves. */
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
        <div className="celebrate-rays" aria-hidden="true" />
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
