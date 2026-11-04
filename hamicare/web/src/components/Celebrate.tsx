// Momentos grandes: boas-vindas do dia, ofensiva com raios de sol, meta da jornada,
// resumo da semana, nível, fase e conquista. Um de cada vez, em tela cheia ou janela.
import { Hamster } from './Hamster';
import { Modal } from './ui';
import { AFFIRMATIONS, JOURNEY_TEXT } from '../data/lines';
import { PHASES } from '../logic/evolution';
import { streakOf } from '../logic/streak';
import { minor, sinceStart, todayKey, useApp, type Celebration } from '../lib/store';
import { addDays, fmtNum, hashStr, weekStart, WEEKDAYS } from '../lib/util';
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

/** Cartão de boas-vindas: aparece na primeira abertura do dia. */
export function DailyWelcome({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const today = todayKey();
  const dow = new Date(`${today}T12:00:00`).getDay();
  const n = sinceStart(s) + 1;
  const line = AFFIRMATIONS[hashStr(`${s.seed}:${today}`) % AFFIRMATIONS.length];
  const [a, b] = DAY_COLORS[dow];
  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-label="Boas-vindas do dia" style={{ ['--w1' as string]: a, ['--w2' as string]: b }}>
      <div className="welcome-rays" aria-hidden="true" />
      <div className="relative grid justify-items-center gap-3 text-center">
        <p className="welcome-day">DIA {n}</p>
        <h1 className="font-display text-[34px] font-bold leading-[1.05] text-white drop-shadow">É {DAY_NAMES[dow]}!</h1>
        <div className="welcome-pet">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={190} />
        </div>
        <div className="welcome-card">
          <p className="eyebrow !text-[#8a63d2]">Recadinho do {s.pet.name}</p>
          <p className="font-display text-[22px] font-bold leading-snug text-[#2b2240]">“{line}”</p>
        </div>
        <button className="btn welcome-btn w-full" onClick={onClose}>
          Bora, {s.pet.name}!
        </button>
      </div>
    </div>
  );
}

/** Ofensiva: tela cheia com raios girando, o Hami pulando e a semana marcada. */
export function StreakScreen({ count, onClose, onShare }: { count: number; onClose: () => void; onShare: (p: Photo) => void }) {
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
  if (!c || c.type === 'streak') return null;
  const hide = minor(s) || s.body.hideNumbers;
  const t = JOURNEY_TEXT[s.journey.dir];
  const content: { title: string; text: string; tone: string; icon?: string } =
    c.type === 'level'
      ? { title: `Nível ${c.level}!`, text: 'Cada cuidado seu fez isso acontecer. Confira o mapa: pode ter lugar novo liberado.', tone: 'gold' }
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
