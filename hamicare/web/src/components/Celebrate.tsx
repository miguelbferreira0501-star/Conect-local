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
      {step === 0 && (
        <div className="dw-step">
          <p className="dw-kicker">{DAY_NAMES[dow]}</p>
          <p className="dw-hello">{hello}</p>
          <div className="dw-heart">
            <svg viewBox="0 0 200 180" aria-hidden="true">
              <path d="M100 168 C40 124 14 92 14 58 C14 30 36 12 60 12 C78 12 92 22 100 36 C108 22 122 12 140 12 C164 12 186 30 186 58 C186 92 160 124 100 168 Z" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.7)" strokeWidth="5" />
            </svg>
            <span className="dw-star dw-star-1">★</span>
            <span className="dw-star dw-star-2">★</span>
            <span className="dw-star dw-star-3">✦</span>
            <span className="dw-pet">
              <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={150} />
            </span>
          </div>
          <p key={shown} className="dw-count">{shown}</p>
          <p className="dw-label">{shown === 1 ? 'dia junto' : 'dias juntos'}</p>
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
            <span className="dw-talk-pet">
              <Hamster fur={s.pet.fur} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={74} idle={false} />
            </span>
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
          <button className="dw-btn" onClick={() => setStep(2)}>
            Vamos começar!
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="dw-step">
          <p className="dw-hello">Seus cuidados de cada dia fazem o {s.pet.name} crescer, mais forte e saudável.</p>
          <div className="dw-grow">
            <span className="dw-ruler" aria-hidden="true" />
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="feliz" size={170} />
          </div>
          <p className="dw-title">{g.name}</p>
          <p className="dw-note">{g.next ? `Cresce de novo com mais ${g.toNext} ${g.toNext === 1 ? 'dia' : 'dias'} de cuidado.` : 'Ele já está do tamanho máximo. Que orgulho!'}</p>
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
