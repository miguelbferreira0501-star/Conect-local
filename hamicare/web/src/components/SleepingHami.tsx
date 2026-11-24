// O Hami 3D dormindo enroladinho como um pãozinho (no chão ou em cima do colchão), com a roupa que está usando,
// respirando devagar e soltando os "z".
import { Hami3D } from './Hami3D';
import { Zzz } from './HamiPhoto';
import type { Outfit } from '../types';

export function SleepingHami({ fur, size = 150, place = 'cama', outfit }: { fur: string; size?: number; place?: 'cama' | 'chao'; outfit?: Outfit }) {
  return (
    <span className={`sleep-hami sleep-3d is-${place}`} style={{ width: size }} role="img" aria-label={place === 'cama' ? 'Hami dormindo na caminha' : 'Hami tirando uma soneca'}>
      <Hami3D fur={fur} outfit={outfit} mood="dormindo" action="dormir" size={size} label="" />
      <span className="sleep-zzz">
        <Zzz size={Math.max(26, size * 0.2)} />
      </span>
    </span>
  );
}
