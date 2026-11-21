// O Hami dormindo: o mesmo Hami de sempre (com a roupa escolhida), de olhinhos fechados e respirando devagar.
import { Hamster } from './Hamster';
import type { Outfit } from '../types';

export function SleepingHami({ fur, size = 230, outfit }: { fur: string; size?: number; outfit?: Outfit }) {
  return (
    <span className="sleep-hami" style={{ width: size, height: (size * 186) / 260 }} role="img" aria-label="Hami dormindo">
      <span className="sleep-breathe">
        <Hamster fur={fur} outfit={outfit} mood="dormindo" size={(size * 186) / 260} label="Hami dormindo" />
      </span>
    </span>
  );
}
