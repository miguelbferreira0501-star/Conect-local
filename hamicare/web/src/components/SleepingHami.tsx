// O cachorrinho dormindo enroladinho (pose da folha de poses), com a roupa que está usando, respirando devagar
// e soltando os "z".
import { DogPose } from './DogPose';
import { Zzz } from './HamiPhoto';
import type { Outfit } from '../types';

export function SleepingHami({ fur, size = 150, place = 'cama', outfit }: { fur: string; size?: number; place?: 'cama' | 'chao'; outfit?: Outfit }) {
  return (
    <span className={`sleep-hami sleep-3d is-${place}`} style={{ width: size }} role="img" aria-label={place === 'cama' ? 'Dormindo na caminha' : 'Tirando uma soneca'}>
      <DogPose kind="dorme" fur={fur} outfit={outfit} width={size} label="" />
      <span className="sleep-zzz">
        <Zzz size={Math.max(26, size * 0.2)} />
      </span>
    </span>
  );
}
