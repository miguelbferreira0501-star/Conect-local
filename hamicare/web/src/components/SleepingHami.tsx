// O Hami dormindo de barriguinha para baixo, igual à foto de referência: na cama (em cima do colchão) ou no
// chão (numa almofadinha redonda). Respira devagar e solta os "z" — animação calma, sem pulos.
import { HamiPhoto, photoRatio, Zzz } from './HamiPhoto';

export function SleepingHami({ fur, size = 230, place = 'cama' }: { fur: string; size?: number; place?: 'cama' | 'chao' }) {
  const h = size * photoRatio('dormindo');
  return (
    <span className={`sleep-hami sleep-photo is-${place}`} style={{ width: size, height: h }} role="img" aria-label={place === 'cama' ? 'Hami dormindo na caminha' : 'Hami tirando uma soneca'}>
      {place === 'chao' && <span className="sleep-cushion" aria-hidden="true" />}
      <span className="sleep-breathe">
        <HamiPhoto kind="dormindo" fur={fur} width={size} />
      </span>
      <span className="sleep-zzz">
        <Zzz size={Math.max(30, size * 0.24)} />
      </span>
    </span>
  );
}
